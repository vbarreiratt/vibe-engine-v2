import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { project_id, scan_id, signals_run_id, name, visibility = 'private' } = body;

        if (!project_id || !scan_id || !signals_run_id || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify membership
        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', project_id)
            .eq('user_id', user.id)
            .single();

        if (!member && user.role !== 'service_role') { // simplistic check, assumes profiles role check logic is in RLS or handled elsewhere. RLS usually handles write permissions.
            // Actually, let's rely on RLS for strict enforcement, but a quick check here saves DB cycles if obvious.
            // Admin check is separate.
            const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
            if (profile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Insert new clusters_run with status 'queued'
        const { data: run, error } = await supabase
            .from('clusters_runs')
            .insert({
                project_id,
                scan_id,
                signals_run_id,
                name,
                visibility,
                status: 'queued',
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Trigger background job (mock for now or TODO)
        // In a real scenario, we might call an internal API endpoint or push to a queue here.
        // For MVP, we might just return success and let the client assume it's queued.
        // Ideally we fire-and-forget a fetch to a process-run endpoint.

        return NextResponse.json({ run });
    } catch (error: any) {
        console.error('Error creating clusters run:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
