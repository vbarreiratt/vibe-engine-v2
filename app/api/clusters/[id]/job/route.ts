import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ClusterEngine } from '@/lib/clustering/cluster-engine';

// Set max duration for Vercel (if Pro)
export const maxDuration = 60; // 60 seconds

// Helper to write exports
import fs from 'fs/promises';
import path from 'path';

// (Old exportRun removed in favor of ClusterLogger.exportLogs)

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Correct for Next 15+
) {
    try {
        const supabase = await createClient();
        const { id: clustersRunId } = await params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Fetch Request & Validate
        const { data: run, error: runError } = await supabase
            .from('clusters_runs')
            .select('id, signals_run_id, status, project_id')
            .eq('id', clustersRunId)
            .single();

        if (runError || !run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });
        if (run.status === 'ready' || run.status === 'running') {
            const url = new URL(request.url);
            if (url.searchParams.get('force') !== 'true') {
                return NextResponse.json({ message: 'Already processed', run });
            }
        }

        // Update status to running
        await supabase.from('clusters_runs').update({ status: 'running' }).eq('id', clustersRunId);

        // 2. Fetch Signals (Source of truth)
        const { data: signals, error: sigError } = await supabase
            .from('image_signals')
            .select('image_id, state, matter, movement') // Assuming these columns exist and image_id maps correctly
            .eq('run_id', run.signals_run_id);

        if (sigError) throw sigError;
        if (!signals || signals.length === 0) {
            throw new Error("No signals found for the source run.");
        }

        // Transform for Engine
        const imageSignals = signals.map(s => ({
            id: s.image_id,
            state: s.state || [],
            matter: s.matter || [],
            movement: s.movement || []
        }));

        // 3. Run Engine
        const engine = new ClusterEngine(imageSignals);

        // 3.1 Vectorize (Async, might take time)
        await engine.vectorize();

        // 3.2 Process (Graph + Louvain + Layout)
        const result = engine.run();

        // 4. Persist Results
        // 4.1 Clear previous results (if re-run)
        // delete cascade handles nodes/edges if we delete clusters?
        // No, we have multiple tables linked to clusters_runs presumably.
        // Let's delete from tables via project specific or run specific logic.
        // Cascading delete from clusters_runs means if we delete the run, everything goes.
        // But here we want to keep the run ID.
        // We should delete "children" of this run.
        await supabase.from('cluster_edges').delete().eq('clusters_run_id', clustersRunId);
        await supabase.from('cluster_nodes').delete().eq('clusters_run_id', clustersRunId);
        await supabase.from('clusters').delete().eq('clusters_run_id', clustersRunId);

        // 4.2 Insert Clusters
        // We need map of internal ID to DB UUID
        const clusterIdMap: Record<string, string> = {}; // engineId -> dbUuid

        for (const c of result.clusters) {
            const { data: insertedCluster, error: cErr } = await supabase
                .from('clusters')
                .insert({
                    clusters_run_id: clustersRunId,
                    name_suggested: c.name_suggested,
                    motor: c.motor,
                    description_suggested: `Cluster driven by ${c.motor} with ${c.items.length} items.`
                })
                .select('id')
                .single();

            if (cErr) throw cErr;
            clusterIdMap[c.id] = insertedCluster.id;
        }

        // 4.3 Insert Nodes
        const nodesPayload = result.nodes.map(n => ({
            clusters_run_id: clustersRunId,
            image_id: n.id,
            cluster_id: clusterIdMap[String(n.cluster_index)] || null,
            x: n.x,
            y: n.y,
            is_outlier: n.is_outlier
        }));

        if (nodesPayload.length > 0) {
            const { error: nErr } = await supabase.from('cluster_nodes').insert(nodesPayload);
            if (nErr) throw nErr;
        }

        // 4.4 Insert Edges
        const edgesPayload = result.edges.map(e => ({
            clusters_run_id: clustersRunId,
            source_image_id: e.source,
            target_image_id: e.target,
            weight: e.weight,
            layers: e.layers
        }));

        if (edgesPayload.length > 0) {
            // Batch insert (supabase limits usually 1000s, assume safe)
            const { error: eErr } = await supabase.from('cluster_edges').insert(edgesPayload);
            if (eErr) throw eErr;
        }

        // Prepare Export paths
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseDir = path.join(process.cwd(), 'outputs', `run_${timestamp}`);

        // 5. Success (Update status and save logs)
        const { data: finalRun } = await supabase
            .from('clusters_runs')
            .update({ 
                status: 'ready',
                log_text: result.log,
                log_path: baseDir
            })
            .eq('id', clustersRunId)
            .select()
            .single();

        // 6. Export to Filesystem (Task 6)
        console.log(`Exporting cognitive logs to ${baseDir}...`);
        await engine.logger.exportLogs(baseDir);

        return NextResponse.json({ success: true, run: finalRun, stats: { clusters: result.clusters.length, nodes: nodesPayload.length, edges: edgesPayload.length } });

    } catch (error: any) {
        console.error('Cluster Job Failed:', error);
        // Attempt to set error status
        // Safe to use 'params' awaited id directly? Yes.
        const { id } = await params;
        const supabase = await createClient();
        await supabase.from('clusters_runs').update({ status: 'error' }).eq('id', id);

        return NextResponse.json(
            { error: error.message || 'Processing Error' },
            { status: 500 }
        );
    }
}
