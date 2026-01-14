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

// Create Ingestion (Session)
export async function createIngestion(projectId: string, name: string, isPublic: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: ingestion, error } = await supabase.from('ingestions').insert({
        project_id: projectId,
        user_id: user.id,
        name: name || `Ingestão ${new Date().toLocaleDateString()}`,
        visibility: isPublic ? 'public' : 'private',
        status: 'uploading'
    }).select().single()

    if (error) throw new Error(error.message)
    return ingestion
}

export async function batchSaveImages(projectId: string, ingestionId: string | null, images: { publicUrl: string, key: string, width: number, height: number, size: number }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    if (images.length === 0) return

    // Prepare data for batch insert
    const imageRecords = images.map(img => ({
        project_id: projectId,
        ingestion_id: ingestionId, // Link to Ingestion
        original_url: img.publicUrl,
        thumb_url: img.publicUrl,
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

    // ... rest of logic (scan entries etc) logic remains similar ...
    if (imgError) throw new Error(imgError.message)

    if (insertedImages) {
        // ... same scan logic ...
        const scanRecords = insertedImages.map(img => ({
            image_id: img.id,
            project_id: projectId,
            status: 'pending'
        }))
        await supabase.from('image_scan').insert(scanRecords)
    }

    // Update Ingestion Status if needed
    if (ingestionId) {
        await supabase.from('ingestions').update({ status: 'completed' }).eq('id', ingestionId)
    }

    // Single Audit Log
    await supabase.from('audit_log').insert({
        entity_type: 'ingestion',
        entity_id: ingestionId || projectId,
        action_type: 'create_images',
        after_data: { count: images.length, ingestionId },
        actor_user_id: user.id,
        actor_role: 'curator',
        project_id: projectId
    })
}
