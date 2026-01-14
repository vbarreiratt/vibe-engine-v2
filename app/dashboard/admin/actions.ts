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

import { createAdminClient } from '@/lib/supabase/admin'

export async function createUser(formData: FormData) {
    const supabase = await createClient()

    // Authorization Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: currentUserProfile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    if (currentUserProfile?.role !== 'admin') throw new Error('Forbidden')

    // Data Extraction
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string

    // Service Role Operation
    const supabaseAdmin = createAdminClient()

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    })

    if (createError) {
        console.error('Create User Error:', createError)
        return { error: createError.message }
    }

    if (newUser.user && role === 'admin') {
        // Trigger creates as curator, we upgrade immediately
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('user_id', newUser.user.id)

        if (updateError) console.error('Failed to set admin role:', updateError)
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'user',
        entity_id: newUser.user?.id || 'unknown',
        action_type: 'create_user',
        after_data: { email, role },
        actor_user_id: user.id,
        actor_role: 'admin'
    })

    revalidatePath('/dashboard/admin')
    return { success: true }
}
