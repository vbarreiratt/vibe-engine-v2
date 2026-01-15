'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AvatarConfig } from '@/lib/avatar-assets'

export async function completeOnboarding(payload: {
    nickname: string
    bio: string
    avatarConfig?: AvatarConfig | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    if (!payload.nickname || payload.nickname.length < 2) {
        return { error: 'Nickname deve ter pelo menos 2 caracteres.' }
    }

    // Update Profile
    const { error } = await supabase.from('profiles').update({
        nickname: payload.nickname,
        bio: payload.bio,
        avatar_config: payload.avatarConfig || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
    }).eq('user_id', user.id)

    if (error) {
        console.error('Onboarding Error', error)
        return { error: 'Erro ao salvar perfil.' }
    }

    // Audit Log
    await supabase.from('audit_log').insert({
        entity_type: 'profile',
        entity_id: user.id,
        action_type: 'onboarding_complete',
        actor_user_id: user.id,
        after_data: payload
    })

    // Get Role for Redirection
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()

    return {
        success: true,
        role: profile?.role || 'curator'
    }
}
