import { S3Client } from '@aws-sdk/client-s3'

if (!process.env.DO_SPACES_ENDPOINT || !process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET) {
    throw new Error('Missing DigitalOcean Spaces credentials')
}

export const storageClient = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION || 'nyc3',
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
    forcePathStyle: false, // Spaces supports virtual-hosted-style URLs (bucket.region.digitaloceanspaces.com)
})

export const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vibe-files'
