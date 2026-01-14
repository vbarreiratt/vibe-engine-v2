import { openai } from './tagging'

export async function generateEmbedding(text: string) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        })

        return response.data[0].embedding
    } catch (error) {
        console.error("Embedding Error:", error)
        throw error
    }
}
