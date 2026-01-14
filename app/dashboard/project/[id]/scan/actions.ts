'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitScanDecision(projectId: string, imageId: string, status: 'vibra' | 'nao_vibra') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Upsert Scan Decision
    // We used to have separate table image_scan linked to images.
    // Let's invoke upsert on image_scan.

    // Check if it exists? We likely created a pending one on upload.
    // So update is better.

    const { error } = await supabase
        .from('image_scan')
        .update({
            status,
            scanned_by: user.id,
            scanned_at: new Date().toISOString()
        })
        .eq('image_id', imageId)
        .eq('project_id', projectId) // Extra safety

    if (error) {
        console.error('Scan Error', error)
        return { error: error.message }
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'image_scan',
        entity_id: imageId,
        action_type: status === 'vibra' ? 'scan_vibe' : 'scan_no_vibe',
        actor_user_id: user.id,
        project_id: projectId
    })

    revalidatePath(`/dashboard/project/${projectId}/scan`)
    return { success: true }
}

export async function batchSubmitScan(projectId: string, decisions: { imageId: string, status: 'vibra' | 'nao_vibra' }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    if (decisions.length === 0) return

    // Since upsert might be tricky with massive batches if we want to update.
    // But we are updating status. 'image_scan' already has rows.
    // Postgres doesn't allow update from values list easily in standard SQL without logic.
    // It's cleaner to loop promises concurrently or use a stored procedure.
    // With Supabase client, we can't bulk update diverse values easily in one call unless we upsert with all columns.
    // Let's rely on Promise.all server-side, it's fast enough for <1000 items usually.

    await Promise.all(decisions.map(d =>
        supabase.from('image_scan')
            .update({
                status: d.status,
                scanned_by: user.id,
                scanned_at: new Date().toISOString()
            })
            .eq('image_id', d.imageId)
            .eq('project_id', projectId)
    ))

    revalidatePath(`/dashboard/project/${projectId}/scan`)
    return { success: true }
}
