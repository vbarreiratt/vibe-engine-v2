'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const nickname = formData.get('nickname') as string
    const bio = formData.get('bio') as string

    if (!nickname || nickname.length < 2) {
        return { error: 'Nickname muito curto.' }
    }

    const { error } = await supabase.from('profiles').update({
        nickname,
        bio,
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
