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

export async function deleteUser(targetUserId: string) {
    const supabase = await createClient()

    // Authorization Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: currentUserProfile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    if (currentUserProfile?.role !== 'admin') throw new Error('Forbidden')

    // Prevent self-delete
    if (targetUserId === user.id) {
        return { error: 'Você não pode deletar sua própria conta.' }
    }

    // Service Role Operation
    const supabaseAdmin = createAdminClient()

    // --- Clean up FK dependencies BEFORE deleting user ---

    // 1. Remove from project_members
    await supabaseAdmin.from('project_members').delete().eq('user_id', targetUserId)

    // 2. Update images to null creator
    await supabaseAdmin.from('images').update({ created_by: null }).eq('created_by', targetUserId)

    // 3. Update ingestions to null user
    await supabaseAdmin.from('ingestions').update({ user_id: null }).eq('user_id', targetUserId)

    // 4. Update image_scan to null scanned_by
    await supabaseAdmin.from('image_scan').update({ scanned_by: null }).eq('scanned_by', targetUserId)

    // 5. Update image_signals to null updated_by
    await supabaseAdmin.from('image_signals').update({ updated_by: null }).eq('updated_by', targetUserId)

    // 6. Update audit_log to null actor
    await supabaseAdmin.from('audit_log').update({ actor_user_id: null }).eq('actor_user_id', targetUserId)

    // 7. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('user_id', targetUserId)

    // --- Now delete from Auth ---
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
        console.error('Delete User Error:', deleteError)
        return { error: deleteError.message }
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'user',
        entity_id: targetUserId,
        action_type: 'delete_user',
        actor_user_id: user.id,
        actor_role: 'admin'
    })

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function resetUserPassword(targetUserId: string, targetEmail: string) {
    const supabase = await createClient()

    // Authorization Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: currentUserProfile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    if (currentUserProfile?.role !== 'admin') throw new Error('Forbidden')

    // Service Role Operation - Generate password recovery link
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetEmail
    })

    if (error) {
        console.error('Reset Password Error:', error)
        return { error: error.message }
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'user',
        entity_id: targetUserId,
        action_type: 'reset_password',
        actor_user_id: user.id,
        actor_role: 'admin'
    })

    // Return the recovery link (Admin can share it or it's sent by email depending on Supabase config)
    return {
        success: true,
        link: data?.properties?.action_link || null,
        message: 'Link de recuperação gerado. O usuário pode acessá-lo para redefinir a senha.'
    }
}
