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

        // Simple permission check (RLS handles fetch, but we do manual check for granular error or if using service role)
        // Implicitly handled by RLS on the query above.

        if (run.status !== 'ready') {
            return NextResponse.json({ run });
        }

        // If ready, fetch the graph data (clusters, nodes, edges)
        // efficient parallel queries
        const [clustersParams, nodesParams, edgesParams] = await Promise.all([
            supabase.from('clusters').select('*').eq('clusters_run_id', id),
            supabase.from('cluster_nodes').select('*, images(thumb_url, original_url)').eq('clusters_run_id', id),
            supabase.from('cluster_edges').select('*').eq('clusters_run_id', id)
        ]);

        if (clustersParams.error) throw clustersParams.error;
        if (nodesParams.error) throw nodesParams.error;
        if (edgesParams.error) throw edgesParams.error;

        // Flatten nodes data to include image_url directly
        const nodes = nodesParams.data.map((node: any) => ({
            ...node,
            image_url: node.images?.thumb_url || node.images?.original_url
        }));

        return NextResponse.json({
            run,
            clusters: clustersParams.data,
            nodes: nodes,
            edges: edgesParams.data
        });

    } catch (error: any) {
        console.error('Error fetching cluster run:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
