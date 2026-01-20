'use server'

import { createClient } from '@/lib/supabase/server'
import { generateTags } from '@/lib/ai/tagging'
import { revalidatePath } from 'next/cache'

export async function processImageTags(projectId: string, imageId: string, imageUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Generate Tags
    const tags = await generateTags(imageUrl)
    if (!tags) throw new Error('Failed to generate tags')

    // 2. Save Tags
    const { error } = await supabase
        .from('image_signals')
        .insert({
            image_id: imageId,
            state: tags.state,
            matter: tags.matter,
            movement: tags.movement,
            updated_by: user.id
        })

    if (error) {
        // If conflict (already tagged), update
        if (error.code === '23505') { // unique_violation
            await supabase
                .from('image_signals')
                .update({
                    state: tags.state,
                    matter: tags.matter,
                    movement: tags.movement,
                    updated_by: user.id,
                    updated_at: new Date().toISOString()
                })
                .eq('image_id', imageId)
        } else {
            throw new Error(error.message)
        }
    }

    // 3. Mark processed in a hypothetical 'workflow_status' or just rely on 'image_signals' existence.
    // Ideally we might want a flag on `image_scan` or `images` saying "tagging_done".
    // For MVP, presence in `image_signals` is enough.

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'image_signals',
        entity_id: imageId,
        action_type: 'ai_tag_gen',
        after_data: tags,
        actor_user_id: user.id, // Triggered by user context
        project_id: projectId
    })

    revalidatePath(`/dashboard/project/${projectId}/tagging`)
    return tags
}

export async function updateImageTags(projectId: string, imageId: string, type: 'state' | 'matter' | 'movement', tags: string[]) {
    const supabase = await createClient()
    // Validation...
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const updatePayload: any = { updated_by: user.id, updated_at: new Date().toISOString() }
    updatePayload[type] = tags

    await supabase.from('image_signals').update(updatePayload).eq('image_id', imageId)

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'image_signals',
        entity_id: imageId,
        action_type: 'tag_edit',
        after_data: { [type]: tags },
        actor_user_id: user.id,
        project_id: projectId
    })

    revalidatePath(`/dashboard/project/${projectId}/tagging`)
}
