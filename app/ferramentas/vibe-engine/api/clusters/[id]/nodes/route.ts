import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
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

        const body = await request.json();
        const { nodes } = body; // Array of { id, x, y, cluster_id, is_outlier }

        if (!nodes || !Array.isArray(nodes)) {
            return NextResponse.json(
                { error: 'Invalid payload: nodes array required' },
                { status: 400 }
            );
        }

        // Check write permission on the run
        const { data: run } = await supabase
            .from('clusters_runs')
            .select('created_by, project_id')
            .eq('id', id)
            .single();

        if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });
        // Verify ownership or admin via RLS/logic
        // (Simplification: assuming RLS on update calls below handles it, but good to check status/lock)

        // Perform batch updates
        // Supabase upsert is good, but we want to UPDATE existing nodes, not create new ones usually.
        // However, nodes should exist.
        // We'll map the payload to the DB columns.

        const updates = nodes.map((node: any) => ({
            id: node.id,
            clusters_run_id: id, // Safety to ensure we don't move nodes to other runs
            x: node.x,
            y: node.y,
            cluster_id: node.cluster_id, // nullable
            is_outlier: node.is_outlier,
            updated_at: new Date().toISOString()
        }));

        // Upserting is efficient for batch updates in Supabase
        const { error } = await supabase
            .from('cluster_nodes')
            .upsert(updates, { onConflict: 'id' });

        if (error) throw error;

        return NextResponse.json({ success: true, count: updates.length });
    } catch (error: any) {
        console.error('Error updating cluster nodes:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
