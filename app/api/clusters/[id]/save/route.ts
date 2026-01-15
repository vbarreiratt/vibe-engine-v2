import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Correct type for Next.js 15+ App Router
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Check auth
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, visibility } = body;

        if (!name && !visibility) {
            return NextResponse.json(
                { error: 'No fields to update provided' },
                { status: 400 }
            );
        }


        const updates: any = {};
        if (name) updates.name = name;
        if (visibility) updates.visibility = visibility;

        // RLS handles the permission check (must be owner or admin)
        // But we might want to fail fast if not found or unauthorized before update attempted?
        // Supabase .update() returning nothing if policy fails matches 'not found' behavior usually.

        const { data: run, error } = await supabase
            .from('clusters_runs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();


        if (error) {
            console.error("Update error", error);
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!run) {
            return NextResponse.json({ error: "Run not found or unauthorized" }, { status: 404 })
        }


        return NextResponse.json({ run });
    } catch (error: any) {
        console.error('Error updating clusters run:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
