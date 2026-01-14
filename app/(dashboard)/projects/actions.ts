'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const selectedMembers = formData.getAll('members') as string[] // array of user_ids

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Create Project
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            name,
            description,
            created_by: user.id
        })
        .select('id')
        .single()

    if (projectError) {
        console.error('Create Project Error', projectError)
        return { error: projectError.message }
    }

    // Assign Members (Curators)
    if (selectedMembers.length > 0) {
        const memberData = selectedMembers.map(uid => ({
            project_id: project.id,
            user_id: uid,
            role: 'curator'
        }))

        const { error: memberError } = await supabase
            .from('project_members')
            .insert(memberData)

        if (memberError) {
            console.error('Assign Members Error', memberError)
            // Note: Project was created, but members failed. 
            // In a real app we might want a transaction or rollback logic.
        }
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'project',
        entity_id: project.id,
        action_type: 'create',
        after_data: { name, description, assigned_members_count: selectedMembers.length },
        actor_user_id: user.id,
        actor_role: 'admin'
        // Note: We should fetch actual role to be safe or rely on RLS/check
    })

    revalidatePath('/dashboard')
    redirect(`/dashboard/project/${project.id}`)
}
