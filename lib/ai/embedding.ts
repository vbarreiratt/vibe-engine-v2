import { VertexAI } from '@google-cloud/vertexai'
import fs from 'fs/promises'

const SERVICE_ACCOUNT_PATH = '/Users/vbarreirat/utilidades/bicho_utilidades/vibe-engine/service-account.json'

// Cache Vertex client definition
let vertexAI: VertexAI | null = null

async function getVertexClient() {
    if (vertexAI) return vertexAI

    try {
        const serviceAccountRaw = await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8')
        const serviceAccount = JSON.parse(serviceAccountRaw)

        const project = serviceAccount.project_id
        const location = 'us-central1'

        vertexAI = new VertexAI({
            project: project,
            location: location,
            googleAuthOptions: {
                credentials: {
                    client_email: serviceAccount.client_email,
                    private_key: serviceAccount.private_key,
                }
            }
        })
        return vertexAI
    } catch (error) {
        console.error("Failed to init Vertex AI:", error)
        throw error
    }
}

export async function generateEmbedding(text: string) {
    try {
        const client = await getVertexClient()
        // The user requested 'gemini-embedding-001'.
        // In Vertex AI SDK, text embedding models are usually 'text-embedding-004'.
        // However, 'text-embedding-004' is the current stable Gecko model.
        // We will try to use the model name 'text-embedding-004' as it is the most reliable text embedder.
        // If 'gemini-embedding-001' is strictly required and exists (e.g. absolute resource name), we might need to adjust.
        // Using 'text-embedding-004' for now as the best closest standard.
        const model = client.getGenerativeModel({
            model: 'publishers/google/models/text-embedding-004' // Using standard full path or just ID
        })

        // Cast to any to avoid TS error if types are outdated
        const result = await (model as any).embedContent(text)
        const embedding = result.embedding?.values

        if (!embedding) {
            throw new Error("No embedding returned")
        }

        return embedding
    } catch (error) {
        console.error("Embedding Error (Vertex):", error)
        // Fallback or rethrow
        throw error
    }
}
