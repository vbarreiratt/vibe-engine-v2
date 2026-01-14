import { generateEmbedding } from '../ai/embedding';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { ClusterLogger } from './logger';
import { applyTwoStageLayout } from './layout';

// Types from the prompt
interface ImageSignals {
    id: string; // image_id
    state: string[];
    matter: string[];
    movement: string[];
    image_url?: string;
}

export interface ClusterResult {
    clusters: {
        id: string; // will be index or uuid
        name_suggested: string; // "State + Matter"
        motor: 'state' | 'matter' | 'movement';
        items: string[]; // image_ids
    }[];
    nodes: {
        id: string; // image_id
        x: number;
        y: number;
        cluster_index: number;
        is_outlier: boolean;
    }[];
    edges: {
        source: string;
        target: string;
        weight: number;
        layers: string[]; // ['state', 'movement']
    }[];
    log?: string; // Human-readable log
}

// Helper: Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class ClusterEngine {
    private images: ImageSignals[];
    private embeddings: Record<string, { state: number[], matter: number[], movement: number[] }> = {};
    public logger: ClusterLogger;
    private startTime: number = 0;

    // Thresholds
    private T_PRIMARY = 0.75; // Strong connection
    private T_SECONDARY = 0.65; // Supporting connection

    constructor(images: ImageSignals[]) {
        this.images = images;
        this.logger = new ClusterLogger();
    }

    // Step 1: Vectorize
    // Note: This is expensive if N is large. In MVP 1 signals_run, N ~ 20-50.
    // If N > 100, we should cache embeddings in DB.
    async vectorize() {
        console.log(`Vectorizing ${this.images.length} images...`);
        for (const img of this.images) {
            // Join tags to form a sentence describing the layer
            const stateText = img.state.join(', ');
            const matterText = img.matter.join(', ');
            const moveText = img.movement.join(', ');

            // Parallel fetch for speed
            const [embState, embMatter, embMove] = await Promise.all([
                stateText ? generateEmbedding(stateText) : Promise.resolve(new Array(1536).fill(0)), // Handle empty
                matterText ? generateEmbedding(matterText) : Promise.resolve(new Array(1536).fill(0)),
                moveText ? generateEmbedding(moveText) : Promise.resolve(new Array(1536).fill(0))
            ]);

            this.embeddings[img.id] = {
                state: embState,
                matter: embMatter,
                movement: embMove
            };
        }
    }

    // Step 2 & 3: Build Graph
    buildGraph(): Graph {
        const graph = new Graph();

        // Add nodes
        this.images.forEach(img => {
            graph.addNode(img.id, { ...img });
        });

        const ids = this.images.map(i => i.id);

        // Compute edges
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const idA = ids[i];
                const idB = ids[j];
                const empA = this.embeddings[idA];
                const empB = this.embeddings[idB];

                const simState = cosineSimilarity(empA.state, empB.state);
                const simMatter = cosineSimilarity(empA.matter, empB.matter);
                const simMove = cosineSimilarity(empA.movement, empB.movement);

                // Resonance Rule: 2 or 3 layers match
                const matchState = simState > this.T_PRIMARY;
                const matchMatter = simMatter > this.T_PRIMARY;
                const matchMove = simMove > this.T_PRIMARY;

                // Also accept Primary + Secondary combinations
                const sM = (simState > this.T_PRIMARY && simMatter > this.T_SECONDARY) || (simState > this.T_SECONDARY && simMatter > this.T_PRIMARY);
                const sV = (simState > this.T_PRIMARY && simMove > this.T_SECONDARY) || (simState > this.T_SECONDARY && simMove > this.T_PRIMARY);
                const mV = (simMatter > this.T_PRIMARY && simMove > this.T_SECONDARY) || (simMatter > this.T_SECONDARY && simMove > this.T_PRIMARY);

                const layers: string[] = [];
                if (simState > this.T_SECONDARY) layers.push('state');
                if (simMatter > this.T_SECONDARY) layers.push('matter');
                if (simMove > this.T_SECONDARY) layers.push('movement');

                // Logic: Must have at least 2 layers contributing
                if (sM || sV || mV || (matchState && matchMatter) || (matchState && matchMove) || (matchMatter && matchMove)) {
                    // Average weight of contributing layers
                    let scoreSum = 0;
                    let count = 0;
                    if (layers.includes('state')) { scoreSum += simState; count++; }
                    if (layers.includes('matter')) { scoreSum += simMatter; count++; }
                    if (layers.includes('movement')) { scoreSum += simMove; count++; }

                    const weight = count > 0 ? scoreSum / count : 0;

                    graph.addEdge(idA, idB, {
                        weight,
                        layers,
                        // Could store raw scores if needed
                    });
                }
            }
        }

        return graph;
    }

    // Step 4, 5, 6: Process
    run(): ClusterResult {
        this.startTime = Date.now();

        // Log job start
        this.logger.logJobStart({
            nodeCount: this.images.length,
            embeddingModel: 'text-embedding-004',
            embeddingDimension: 768,
            similarityMetric: 'cosine similarity',
            resonanceThreshold: this.T_PRIMARY,
            clusteringMethod: 'louvain community detection'
        });

        const graph = this.buildGraph();

        // Detect Communities
        const communities = louvain(graph);

        // Apply initial layout (will be replaced by 2-stage)
        const positions = forceAtlas2(graph, {
            iterations: 100,
            settings: {
                gravity: 1,
                scalingRatio: 10
            }
        });

        // Group by cluster
        const clustersMap: Record<string, string[]> = {};

        Object.entries(communities).forEach(([nodeId, commId]) => {
            const cId = String(commId);
            if (!clustersMap[cId]) clustersMap[cId] = [];
            clustersMap[cId].push(nodeId);
        });

        // Format clusters and log each one
        const clustersFormatted = Object.entries(clustersMap).map(([cId, itemIds]) => {
            const allStates = itemIds.flatMap(id => this.images.find(i => i.id === id)?.state || []);
            const allMatters = itemIds.flatMap(id => this.images.find(i => i.id === id)?.matter || []);
            const allMovements = itemIds.flatMap(id => this.images.find(i => i.id === id)?.movement || []);

            const topState = this.getTopTag(allStates, ['vibra', 'neutro']);
            const topMatter = this.getTopTag(allMatters, []);
            const topMovement = this.getTopTag(allMovements, []);

            const dominantSignals = {
                state: this.getTopTags(allStates, 3),
                matter: this.getTopTags(allMatters, 3),
                movement: this.getTopTags(allMovements, 3)
            };

            // Generate justification
            let justification = `Cluster formado por`;
            if (dominantSignals.state.length > 0) {
                justification += ` estado ${dominantSignals.state.join(', ')}`;
            }
            if (dominantSignals.matter.length > 0) {
                justification += `, matéria ${dominantSignals.matter.join(', ')}`;
            }
            if (dominantSignals.movement.length > 0) {
                justification += `, movimento ${dominantSignals.movement.join(', ')}`;
            }
            justification += `.`;

            // Log cluster creation
            this.logger.logClusterCreated({
                cluster_id: `C${cId}`,
                nodeCount: itemIds.length,
                dominantSignals,
                justification
            });

            return {
                id: cId,
                name_suggested: `${topState || 'Vibe'} ${topMatter || 'Material'}`,
                motor: 'state' as const,
                items: itemIds
            };
        });

        const nodesFormatted = this.images.map((img, idx) => {
            let pos = positions[img.id];

            if (!pos || isNaN(pos.x) || isNaN(pos.y) || pos.x === null || pos.y === null) {
                const angle = (idx / this.images.length) * 2 * Math.PI;
                const radius = 100;
                pos = {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                };
            }

            const commId = String(communities[img.id] ?? 0);
            const clusterSize = clustersMap[commId]?.length || 0;
            const degree = graph.degree(img.id);

            return {
                id: img.id,
                x: pos.x || 0,
                y: pos.y || 0,
                cluster_index: parseInt(commId) || 0,
                is_outlier: degree === 0 || clusterSize === 1
            };
        });

        const edgesFormatted = graph.edges().map(edgeKey => {
            const attr = graph.getEdgeAttributes(edgeKey);
            const source = graph.source(edgeKey);
            const target = graph.target(edgeKey);
            return {
                source,
                target,
                weight: attr.weight,
                layers: attr.layers
            };
        });

        let result: ClusterResult = {
            clusters: clustersFormatted,
            nodes: nodesFormatted,
            edges: edgesFormatted
        };

        // Apply 2-stage layout
        result = applyTwoStageLayout(result);

        // Log job completion
        const duration = (Date.now() - this.startTime) / 1000;
        const outlierCount = result.nodes.filter(n => n.is_outlier).length;

        this.logger.logJobEnd({
            clustersGenerated: result.clusters.length,
            outliers: outlierCount,
            duration
        });

        // Attach human-readable log
        result.log = this.logger.generateHumanReadableLog();

        return result;
    }

    private getTopTag(tags: string[], ignore: string[]): string {
        const counts: Record<string, number> = {};
        for (const t of tags) {
            const norm = t.toLowerCase().trim();
            if (ignore.includes(norm)) continue;
            counts[norm] = (counts[norm] || 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    }

    private getTopTags(tags: string[], topN: number = 3): string[] {
        const counts: Record<string, number> = {};
        for (const t of tags) {
            const norm = t.toLowerCase().trim();
            counts[norm] = (counts[norm] || 0) + 1;
        }
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([tag]) => tag);
    }
}
