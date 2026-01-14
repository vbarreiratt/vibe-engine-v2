'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: 'admin' | 'curator') {
    const supabase = await createClient()

    // Verify if current user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (currentUserProfile?.role !== 'admin') {
        throw new Error('Forbidden: Only admins can change roles')
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId)

    if (error) {
        console.error('Error updating role:', error)
        return { error: error.message }
    }

    // Audit Log
    await supabase.from('audit_log').insert({
        entity_type: 'user',
        entity_id: userId,
        action_type: 'role_change',
        after_data: { role: newRole },
        actor_user_id: user.id,
        actor_role: 'admin'
    })

    revalidatePath('/dashboard/admin')
    return { success: true }
}
