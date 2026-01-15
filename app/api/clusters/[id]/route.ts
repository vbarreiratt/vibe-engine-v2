import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Auth check
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch the run header to check permission & status
        const { data: run, error: runError } = await supabase
            .from('clusters_runs')
            .select('*')
            .eq('id', id)
            .single();

        if (runError || !run) {
            return NextResponse.json({ error: 'Run not found' }, { status: 404 });
        }

        // If ready, fetch the graph data (clusters, nodes, edges)
        if (run.status !== 'ready') {
            return NextResponse.json({ run });
        }

        const [clustersParams, nodesParams, edgesParams] = await Promise.all([
            supabase.from('clusters').select('*').eq('clusters_run_id', id),
            // Join images to get URL, description_ai, scan info
            supabase.from('cluster_nodes')
                .select(`
                    id, image_id, x, y, is_outlier, cluster_id,
                    images (
                        id, description_ai, thumb_url, original_url,
                        ingestions ( id, name, visibility, created_at )
                    )
                `)
                .eq('clusters_run_id', id),
            supabase.from('cluster_edges').select('*').eq('clusters_run_id', id)
        ]);

        if (clustersParams.error) throw clustersParams.error;
        if (nodesParams.error) throw nodesParams.error;
        if (edgesParams.error) throw edgesParams.error;

        // Fetch Signals (needed for "Signals (tags)" section)
        // We fetch all signals for this run's source signals_run_id
        // Optimization: In a real large scale app, we might paginate or only fetch on demand.
        // For < 1000 nodes, fetching all is fine.
        const nodeImageIds = nodesParams.data.map((n: any) => n.image_id);
        const { data: signalsData } = await supabase
            .from('image_signals')
            .select('image_id, state, matter, movement')
            .eq('run_id', run.signals_run_id)
            .in('image_id', nodeImageIds);

        const signalsMap = new Map();
        if (signalsData) {
            signalsData.forEach((s: any) => signalsMap.set(s.image_id, s));
        }

        // Transform Nodes
        const nodes = nodesParams.data.map((node: any) => {
            const img = node.images;
            const sig = signalsMap.get(node.image_id) || { state: [], matter: [], movement: [] };
            return {
                id: node.image_id, // Use image_id as the primary ID for frontend graph
                cluster_node_id: node.id,
                cluster_id: node.cluster_id, // This links to clusters.id (UUID)
                position: { x: node.x, y: node.y },
                is_outlier: node.is_outlier,
                image: {
                    thumb_url: img?.thumb_url || img?.original_url,
                    full_url: img?.original_url,
                },
                description_ai: img?.description_ai,
                signals: {
                    state: sig.state,
                    matter: sig.matter,
                    movement: sig.movement
                },
                ingestion: img?.ingestions ? {
                    scan_name: img.ingestions.name,
                    is_public: img.ingestions.visibility === 'public',
                    created_at: img.ingestions.created_at
                } : null
            };
        });

        // Transform Edges & Build EdgesByNode
        const edges = edgesParams.data.map((e: any) => ({
            source: e.source_image_id,
            target: e.target_image_id,
            weight: e.weight,
            layers: e.layers,
            shared_signals: e.shared_terms
        }));

        const edgesByNode: Record<string, any[]> = {};
        edges.forEach((edge: any) => {
            if (!edgesByNode[edge.source]) edgesByNode[edge.source] = [];
            if (!edgesByNode[edge.target]) edgesByNode[edge.target] = [];
            edgesByNode[edge.source].push(edge);
            edgesByNode[edge.target].push(edge);
        });

        // Transform Clusters
        const clusters = clustersParams.data.map((c: any) => ({
            id: c.id,
            label: c.name_final || c.name_suggested,
            status: 'STRONG', // Default, should ideally come from Metrics/Classif
            classification: c.metrics?.classification || 'STRONG', // Assuming metrics has it
            strengthScore: c.strength_score,
            metrics: c.metrics,
            // Add other prompts fields
            name_suggested: c.name_suggested,
            summary: c.metrics?.summary || c.description_suggested
        }));

        const payload = {
            cluster_id: id, // Actually Run ID in this context, but prompt requested 'cluster_id' field. 
            // The prompt says "GET /api/clusters/:clusterId" and response has "cluster_id".
            // Since we are getting a RUN, let's use the Run ID.
            project_id: run.project_id,
            signals_run_id: run.signals_run_id,
            run: {
                run_id: run.id,
                status: run.status,
                created_at: run.created_at,
                // log_text is heavy, maybe omit or include if small
                log_text: run.log_text
            },
            layout: {
                viewport: { width: 1920, height: 1080 } // Mock
            },
            clusters,
            nodes,
            edges,
            edgesByNode // Critical for frontend perf
        };

        return NextResponse.json(payload);

    } catch (error: any) {
        console.error('Error fetching cluster run:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
