'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const nickname = formData.get('nickname') as string
    const bio = formData.get('bio') as string
    const avatarConfigRaw = formData.get('avatarConfig') as string

    let avatarConfig = null
    try {
        avatarConfig = avatarConfigRaw ? JSON.parse(avatarConfigRaw) : null
    } catch { }

    if (!nickname || nickname.length < 2) {
        return { error: 'Nickname muito curto.' }
    }

    const { error } = await supabase.from('profiles').update({
        nickname,
        bio,
        avatar_config: avatarConfig,
        updated_at: new Date().toISOString()
    }).eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    await supabase.from('audit_log').insert({
        entity_type: 'profile',
        entity_id: user.id,
        action_type: 'profile_update',
        actor_user_id: user.id,
        after_data: { nickname, bio }
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard') // Update layout sidebar
    return { success: true }
}

import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteOwnAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Audit before deletion (store in memory, user will be deleted)
    const userId = user.id
    const userEmail = user.email

    // Use admin client to delete user
    const supabaseAdmin = createAdminClient()

    // --- Clean up FK dependencies BEFORE deleting user ---

    // 1. Remove from project_members
    await supabaseAdmin.from('project_members').delete().eq('user_id', userId)

    // 2. Update images to null creator
    await supabaseAdmin.from('images').update({ created_by: null }).eq('created_by', userId)

    // 3. Update ingestions to null user
    await supabaseAdmin.from('ingestions').update({ user_id: null }).eq('user_id', userId)

    // 4. Update image_scan to null scanned_by
    await supabaseAdmin.from('image_scan').update({ scanned_by: null }).eq('scanned_by', userId)

    // 5. Update image_signals to null updated_by
    await supabaseAdmin.from('image_signals').update({ updated_by: null }).eq('updated_by', userId)

    // 6. Update audit_log to null actor
    await supabaseAdmin.from('audit_log').update({ actor_user_id: null }).eq('actor_user_id', userId)

    // 7. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId)

    // --- Now delete from Auth ---
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
        console.error('Delete Own Account Error:', deleteError)
        return { error: deleteError.message }
    }

    // Audit Log (use admin client since user is deleted)
    await supabaseAdmin.from('audit_log').insert({
        entity_type: 'user',
        entity_id: userId,
        action_type: 'self_delete',
        after_data: { email: userEmail },
        actor_user_id: userId
    })

    return { success: true }
}
