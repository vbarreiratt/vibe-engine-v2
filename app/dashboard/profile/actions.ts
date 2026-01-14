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

    // Delete from Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
        console.error('Delete Own Account Error:', deleteError)
        return { error: deleteError.message }
    }

    // Profile should cascade delete, but ensure
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId)

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
