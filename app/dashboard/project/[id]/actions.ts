'use server'

import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

const s3 = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION || "nyc3",
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!
    }
})

// Single URL gen (Legacy/Single use)
export async function getUploadUrl(projectId: string, fileName: string, fileType: string) {
    // ... existing logic code ...
    // Keeping for backward compat if needed, but implementation below is what matters
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check access
    if (!user) throw new Error('Unauthorized')

    // Generate unique key
    const ext = fileName.split('.').pop()
    const uniqueName = `${crypto.randomUUID()}.${ext}`
    const key = `${projectId}/${uniqueName}`

    const command = new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
        ContentType: fileType,
        ACL: 'public-read'
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
    const publicUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.cdn.digitaloceanspaces.com/${key}`

    return { signedUrl, publicUrl, key }
}

// BATCH URL GENERATION
export async function getPresignedUrls(projectId: string, files: { name: string, type: string }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Generate all URLs in parallel promises server-side
    const urls = await Promise.all(files.map(async (file) => {
        const ext = file.name.split('.').pop()
        const uniqueName = `${crypto.randomUUID()}.${ext}`
        const key = `${projectId}/${uniqueName}`

        const command = new PutObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: key,
            ContentType: file.type,
            ACL: 'public-read'
        })

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
        const publicUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.cdn.digitaloceanspaces.com/${key}`

        return {
            originalName: file.name,
            signedUrl,
            publicUrl,
            key
        }
    }))

    return urls
}

export async function batchSaveImages(projectId: string, images: { publicUrl: string, key: string, width: number, height: number, size: number }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    if (images.length === 0) return

    // Prepare data for batch insert
    const imageRecords = images.map(img => ({
        project_id: projectId,
        original_url: img.publicUrl,
        thumb_url: img.publicUrl, // pending thumb service
        storage_path: img.key,
        width: img.width,
        height: img.height,
        created_by: user.id
    }))

    // Batch Insert Images
    const { data: insertedImages, error: imgError } = await supabase
        .from('images')
        .insert(imageRecords)
        .select('id')

    if (imgError) throw new Error(imgError.message)

    if (insertedImages) {
        // Prepare Scan Entries
        const scanRecords = insertedImages.map(img => ({
            image_id: img.id,
            project_id: projectId,
            status: 'pending'
        }))

        // Batch Insert default Scan status
        const { error: scanError } = await supabase.from('image_scan').insert(scanRecords)
        if (scanError) console.error('Error creating scan entries:', scanError)
    }

    // Single Audit Log
    await supabase.from('audit_log').insert({
        entity_type: 'batch_upload',
        entity_id: projectId,
        action_type: 'upload',
        after_data: { count: images.length },
        actor_user_id: user.id,
        actor_role: 'curator', // or fetch from profile
        project_id: projectId
    })
}
