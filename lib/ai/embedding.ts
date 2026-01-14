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

        // Use textEmbedding method for embedding models
        const textEmbeddingModel = client.preview.getGenerativeModel({
            model: 'text-embedding-004',
        });

        // Call embedContent with the proper format
        const result = await textEmbeddingModel.embedContent({
            content: { role: 'user', parts: [{ text }] }
        });

        const embedding = result?.embedding?.values;

        if (!embedding) {
            throw new Error("No embedding returned")
        }

        return embedding
    } catch (error) {
        console.error("Embedding Error (Vertex):", error)
        throw error
    }
}
