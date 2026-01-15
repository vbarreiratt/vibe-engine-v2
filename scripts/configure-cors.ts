
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const config = {
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION || 'nyc3',
    bucket: process.env.DO_SPACES_BUCKET,
    key: process.env.DO_SPACES_KEY,
    secret: process.env.DO_SPACES_SECRET
}

if (!config.endpoint || !config.key || !config.secret || !config.bucket) {
    console.error('Missing configuration')
    process.exit(1)
}

const s3 = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
        accessKeyId: config.key,
        secretAccessKey: config.secret
    }
})

async function setCors() {
    console.log(`Setting CORS for bucket: ${config.bucket}...`)

    try {
        const command = new PutBucketCorsCommand({
            Bucket: config.bucket,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
                        AllowedOrigins: ["http://localhost:3000", "https://*.vercel.app"], // Add your production domain later
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        })

        await s3.send(command)
        console.log('✅ CORS configured successfully!')
    } catch (e) {
        console.error('Failed to set CORS:', e)
    }
}

setCors()
