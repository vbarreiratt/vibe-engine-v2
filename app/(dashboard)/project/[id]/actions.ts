'use server'

import { createClient } from '@/lib/supabase/server'
import { storageClient, BUCKET_NAME } from '@/lib/storage/client'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { revalidatePath } from 'next/cache'

export async function getUploadUrl(projectId: string, fileName: string, fileType: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify access
    const memberCheck = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

    const adminCheck = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

    if (!memberCheck.data && !adminCheck.data) {
        throw new Error('Forbidden: Not a member of this project')
    }

    const key = `${projectId}/${Date.now()}-${fileName}`

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: fileType,
        ACL: 'public-read', // Or private if we want signed URLs for viewing
    })

    try {
        const signedUrl = await getSignedUrl(storageClient, command, { expiresIn: 600 })
        // Construct public URL (assuming public-read for now for simplicity of MVP, 
        // or we can generate signed GET urls later. Prompt says "use abordagem segura" but MVP "pode começar com assinadas")
        // Let's stick to signed upload, public read for now to speed up "Thumbnails" unless requested otherwise.
        // Actually, let's assume we store the "Public URL" or "Storage Path".

        const publicUrl = `${process.env.DO_SPACES_ENDPOINT!.replace('https://', `https://${BUCKET_NAME}.`)}/${key}`

        return { signedUrl, publicUrl, key }
    } catch (err: any) {
        console.error(err)
        throw new Error('Failed to generate upload URL')
    }
}

export async function saveImage(projectId: string, url: string, path: string, width: number, height: number, size: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Insert Image
    const { data, error } = await supabase.from('images').insert({
        project_id: projectId,
        original_url: url, // For now, original is the served url
        thumb_url: url, // We might need a resize step later. For MVP, use same.
        storage_path: path,
        width,
        height,
        created_by: user.id
    }).select().single()

    if (error) {
        throw new Error(error.message)
    }

    // Also create initial scan entry
    await supabase.from('image_scan').insert({
        image_id: data.id,
        project_id: projectId,
        status: 'pending'
    })

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'image',
        entity_id: data.id,
        action_type: 'upload',
        after_data: { url, path },
        actor_user_id: user.id,
        project_id: projectId
    })

    revalidatePath(`/dashboard/project/${projectId}`)
    return data
}
