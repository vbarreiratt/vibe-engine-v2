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
        throw new Error(projectError.message)
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

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

export async function deleteProject(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    if (profile?.role !== 'admin') {
        throw new Error('Forbidden: Only admins can delete projects')
    }

    // 1. Clean up Storage (S3)
    const s3 = new S3Client({
        endpoint: process.env.DO_SPACES_ENDPOINT,
        region: process.env.DO_SPACES_REGION || "nyc3",
        credentials: {
            accessKeyId: process.env.DO_SPACES_KEY!,
            secretAccessKey: process.env.DO_SPACES_SECRET!
        }
    })

    const bucket = process.env.DO_SPACES_BUCKET
    const prefix = `${projectId}/`
    let continuationToken: string | undefined = undefined

    try {
        let isTruncated = true

        while (isTruncated) {
            const listCmd = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken
            })

            const listRes = await s3.send(listCmd) as any

            if (listRes.Contents && listRes.Contents.length > 0) {
                const keys = listRes.Contents
                    .map((obj: any) => obj.Key)
                    .filter((key: any): key is string => !!key)

                if (keys.length > 0) {
                    const deleteCmd = new DeleteObjectsCommand({
                        Bucket: bucket,
                        Delete: {
                            Objects: keys.map((Key: string) => ({ Key })),
                            Quiet: true
                        }
                    })
                    await s3.send(deleteCmd)
                    console.log(`Deleted ${keys.length} files from S3 for project ${projectId}`)
                }
            }

            continuationToken = listRes.NextContinuationToken
            isTruncated = listRes.IsTruncated ?? false
        }
    } catch (e) {
        console.error('Failed to cleanup S3 files:', e)
        // We continue to delete DB even if S3 fails, to avoid zombie projects in UI
    }

    // 2. Delete from DB (Cascade will handle children: images, ingestions, logs, etc)
    const { error } = await supabase.from('projects').delete().eq('id', projectId)

    if (error) {
        console.error('Delete Project Error', error)
        throw new Error(error.message)
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'project',
        entity_id: projectId,
        action_type: 'delete',
        after_data: { deleted: true },
        actor_user_id: user.id,
        actor_role: 'admin'
    })

    revalidatePath('/dashboard')
}
