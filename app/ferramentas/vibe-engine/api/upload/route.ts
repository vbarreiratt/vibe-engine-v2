
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

// Upload V0 Style: Server-Side Processing for Max Throughput on Robust Hardware

async function pMap<T, R>(
    array: T[],
    mapper: (item: T, index: number) => Promise<R>,
    concurrency: number
): Promise<R[]> {
    const results = new Array<R>(array.length);
    let index = 0;
    async function worker() {
        while (index < array.length) {
            const i = index++;
            results[i] = await mapper(array[i], i);
        }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const projectId = formData.get('projectId') as string
        const files = formData.getAll('files') as File[]

        if (!projectId || files.length === 0) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        // 1. Auth Check (Cookie based)
        const { createClient: createServerClient } = await import('@/lib/supabase/server')
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 2. Admin Context (Service Role) for High-Speed Writes
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabaseAdmin = createAdminClient()

        // 3. Upload to S3 (Concurrency Limited)
        const bucketName = process.env.DO_SPACES_BUCKET!
        const s3 = new S3Client({
            endpoint: process.env.DO_SPACES_ENDPOINT,
            region: process.env.DO_SPACES_REGION || "nyc3",
            credentials: {
                accessKeyId: process.env.DO_SPACES_KEY!,
                secretAccessKey: process.env.DO_SPACES_SECRET!
            },
            // Optimize for high throughput
            maxAttempts: 3
        })

        const successfulUploads = await pMap(files, async (file) => {
            if (!file.type.startsWith('image/')) return null

            try {
                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)

                const ext = file.name.split('.').pop()
                const fileName = `${crypto.randomUUID()}.${ext}`
                // Path structure: project_id/filename
                const key = `${projectId}/${fileName}`

                await s3.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: file.type,
                    ACL: 'public-read'
                }))

                const publicUrl = `https://${bucketName}.${process.env.DO_SPACES_REGION}.cdn.digitaloceanspaces.com/${key}`

                // Calculate Hash for deduplication logic later if needed
                // const hash = crypto.createHash('md5').update(buffer).digest('hex')

                return {
                    id: crypto.randomUUID(), // Pre-generate ID
                    project_id: projectId,
                    original_url: publicUrl,
                    thumb_url: publicUrl, // No thumb generation yet
                    storage_path: key,
                    width: 0, // Pending processing
                    height: 0, // Pending processing
                    created_by: user.id
                }
            } catch (err) {
                console.error(`[S3] Failed to upload ${file.name}:`, err)
                return null
            }
        }, 10) // 10 concurrent uploads based on 4 vCPU/16GB specs

        const validImages = successfulUploads.filter(r => r !== null) as any[]

        // 4. Batch Insert Images (Service Role)
        if (validImages.length > 0) {
            // A. Insert Images
            const { error: imgError } = await supabaseAdmin.from('images').insert(validImages)

            if (imgError) {
                console.error('Batch Insert Error:', imgError)
                throw imgError
            }

            // B. Create corresponding Image Scan entries
            const scanEntries = validImages.map(img => ({
                image_id: img.id,
                project_id: projectId,
                status: 'pending'
            }))

            const { error: scanError } = await supabaseAdmin.from('image_scan').insert(scanEntries)
            if (scanError) console.error('Scan Entry Error:', scanError)

            // C. Audit Log (Single Entry for Batch)
            await supabaseAdmin.from('audit_log').insert({
                entity_type: 'batch_upload',
                entity_id: projectId, // Project as entity
                action_type: 'upload',
                after_data: { count: validImages.length },
                actor_user_id: user.id,
                project_id: projectId
            })
        }

        return NextResponse.json({
            success: true,
            totalProcessed: validImages.length
        })

    } catch (error: any) {
        console.error('[Upload API] Critical Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
