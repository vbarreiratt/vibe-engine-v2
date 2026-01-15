import { generateEmbedding } from '../ai/embedding'

interface ImagePoint {
    id: string
    tags: {
        state: string[]
        matter: string[]
        movement: string[]
    }
}

interface ClusterResult {
    name: string
    imageIds: string[]
    cohesion: number
}

// Simple cosine similarity
function cosineSimilarity(a: number[], b: number[]) {
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function runResonance(images: ImagePoint[]) {
    // 1. Generate Embeddings for all images based on Tags
    // In a real production system, we'd cache these or store in DB 'embeddings' column.

    const items = await Promise.all(images.map(async (img) => {
        const text = `
            Estado: ${img.tags.state.join(', ')}.
            Matéria: ${img.tags.matter.join(', ')}.
            Movimento: ${img.tags.movement.join(', ')}.
        `.trim()

        const vector = await generateEmbedding(text)
        return { ...img, vector, text }
    }))

    // 2. Simple Hierarchical Clustering (Agglomerative)
    // Threshold for similarity to merge
    const MERGE_THRESHOLD = 0.85

    let clusters = items.map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        items: [item],
        centroid: item.vector
    }))

    let merged = true
    while (merged) {
        merged = false
        let bestPair = { i: -1, j: -1, score: -1 }

        // Find best pair
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const score = cosineSimilarity(clusters[i].centroid, clusters[j].centroid)
                if (score > bestPair.score) {
                    bestPair = { i, j, score }
                }
            }
        }

        // Merge if above threshold
        if (bestPair.score > MERGE_THRESHOLD) {
            const cA = clusters[bestPair.i]
            const cB = clusters[bestPair.j]

            // New centroid (weighted average)
            const newItems = [...cA.items, ...cB.items]
            const dim = cA.centroid.length
            const newCentroid = new Array(dim).fill(0)

            for (let k = 0; k < dim; k++) {
                let sum = 0
                newItems.forEach(it => sum += it.vector[k])
                newCentroid[k] = sum / newItems.length
            }

            // Replace i with merged, remove j
            clusters[bestPair.i] = {
                id: cA.id, // keep ID or new
                items: newItems,
                centroid: newCentroid
            }
            clusters.splice(bestPair.j, 1)
            merged = true
        }
    }

    // 3. Format Output
    return clusters.map((c, idx) => ({
        name: `Vibe Cluster ${idx + 1}`, // Temporary name
        imageIds: c.items.map(i => i.id),
        cohesion: 0.9 // Mock score for MVP
    }))
}
