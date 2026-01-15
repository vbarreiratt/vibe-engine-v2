import { generateEmbedding } from '../ai/embedding';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { ClusterLogger } from './logger';
import { applyTwoStageLayout } from './layout';
import { normalizeSignalList } from './normalization';
import { ClusterAuditor } from './audit';
import * as fs from 'fs/promises';
import * as path from 'path';

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
    evidencePath?: string;
    audit?: any;
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
        this.logger.logInput({
            nodeCount: this.images.length,
            model: 'text-embedding-004',
            dimensions: 768
        });

        console.log(`Vectorizing ${this.images.length} images...`);
        for (const img of this.images) {
            // Normalization using the new rigorous dictionary
            const nState = normalizeSignalList(img.state).map(r => r.normalized);
            const nMatter = normalizeSignalList(img.matter).map(r => r.normalized);
            const nMove = normalizeSignalList(img.movement).map(r => r.normalized);

            // Canonical Text Builder
            const stateText = nState.join(', ');
            const matterText = nMatter.join(', ');
            const moveText = nMove.join(', ');
            const finalText = `state: ${stateText} | matter: ${matterText} | movement: ${moveText}`;

            // Log Canonical Text
            this.logger.logCanonicalText({
                imageId: img.id,
                original: { state: img.state, matter: img.matter, movement: img.movement },
                normalized: { state: nState, matter: nMatter, movement: nMove },
                finalText
            });

            // Parallel fetch for speed
            const startTime = Date.now();
            try {
                const [embState, embMatter, embMove] = await Promise.all([
                    stateText ? generateEmbedding(stateText) : Promise.resolve(new Array(768).fill(0)), // Handle empty, assume 768
                    matterText ? generateEmbedding(matterText) : Promise.resolve(new Array(768).fill(0)),
                    moveText ? generateEmbedding(moveText) : Promise.resolve(new Array(768).fill(0))
                ]);

                this.embeddings[img.id] = {
                    state: embState,
                    matter: embMatter,
                    movement: embMove
                };
                
                this.logger.logEmbedding({
                    imageId: img.id,
                    dimension: embState.length,
                    success: true,
                    durationMs: Date.now() - startTime
                });

            } catch (error: any) {
                this.logger.logEmbedding({
                    imageId: img.id,
                    dimension: 0,
                    success: false,
                    error: error.message,
                    durationMs: Date.now() - startTime
                });
                console.error(`Failed embedding for ${img.id}`, error);
            }
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
                
                const imgA = this.images.find(x => x.id === idA)!;
                const imgB = this.images.find(x => x.id === idB)!;
                const empA = this.embeddings[idA];
                const empB = this.embeddings[idB];

                if (!empA || !empB) continue;

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

                const isConnected = sM || sV || mV || (matchState && matchMatter) || (matchState && matchMove) || (matchMatter && matchMove);

                // Calculate Shared Signals (Intersection)
                // Use rigorous normalization for intersection check
                const normDetailsA = {
                    state: normalizeSignalList(imgA.state).map(r => r.normalized),
                    matter: normalizeSignalList(imgA.matter).map(r => r.normalized),
                    movement: normalizeSignalList(imgA.movement).map(r => r.normalized)
                };
                const normDetailsB = {
                    state: normalizeSignalList(imgB.state).map(r => r.normalized),
                    matter: normalizeSignalList(imgB.matter).map(r => r.normalized),
                    movement: normalizeSignalList(imgB.movement).map(r => r.normalized)
                };

                const getShared = (l1: string[], l2: string[]) => {
                    const s2 = new Set(l2);
                    return l1.filter(x => s2.has(x));
                };

                const sharedState = getShared(normDetailsA.state, normDetailsB.state);
                const sharedMatter = getShared(normDetailsA.matter, normDetailsB.matter);
                const sharedMove = getShared(normDetailsA.movement, normDetailsB.movement);
                
                const allShared = [...sharedState.map(s => `state:${s}`), ...sharedMatter.map(s => `matter:${s}`), ...sharedMove.map(s => `mov:${s}`)];

                // Weight calculation
                let weight = 0;
                if (isConnected) {
                    let scoreSum = 0;
                    let count = 0;
                    if (layers.includes('state')) { scoreSum += simState; count++; }
                    if (layers.includes('matter')) { scoreSum += simMatter; count++; }
                    if (layers.includes('movement')) { scoreSum += simMove; count++; }
                    weight = count > 0 ? scoreSum / count : 0;

                    graph.addEdge(idA, idB, {
                        weight,
                        layers,
                        // Extensive audit data
                        simState, simMatter, simMove,
                        sharedState, sharedMatter, sharedMove
                    });
                }

                // Log Similarity Decision
                // Check if semantic bridge (high cosine but few shared signals)
                const overallCosine = (simState + simMatter + simMove) / 3;
                const isSemanticBridge = isConnected && allShared.length < 2 && weight > 0.8;

                this.logger.logSimilarity({
                    sourceId: idA,
                    targetId: idB,
                    score: weight || overallCosine, // use weight if connected, else avg
                    threshold: this.T_PRIMARY, // Ref MVP
                    isEdgeCreated: !!isConnected,
                    sharedSignals: allShared,
                    isSemanticBridge
                });
            }
        }

        return graph;
    }

    // Step 4, 5, 6: Process
    async run(runId: string, outputDir: string): Promise<ClusterResult> {
        this.startTime = Date.now();
        const evidenceDir = path.join(outputDir, 'evidence');
        await fs.mkdir(evidenceDir, { recursive: true });

        // 1. Prepare Normalized Data for Evidence
        const normalizedData = this.images.map(img => {
            return {
                id: img.id,
                state: normalizeSignalList(img.state),
                matter: normalizeSignalList(img.matter),
                movement: normalizeSignalList(img.movement)
            };
        });

        // Save inputs_canonical.csv
        const inputsCsv = ['image_id,canonical_text,hash'];
        normalizedData.forEach(n => {
            const text = `state: ${n.state.map(x=>x.normalized).join(' ')} | matter: ${n.matter.map(x=>x.normalized).join(' ')} | movement: ${n.movement.map(x=>x.normalized).join(' ')}`;
            const hash = ClusterAuditor.hashString(text);
            inputsCsv.push(`${n.id},"${text}",${hash}`);
        });
        await fs.writeFile(path.join(evidenceDir, 'inputs_canonical.csv'), inputsCsv.join('\n'));

        // Save signals_normalized.json
        await fs.writeFile(path.join(evidenceDir, 'signals_normalized.json'), JSON.stringify(normalizedData, null, 2));

        // 2. Build Graph (and kNN Fallback)
        const graph = this.buildGraph();

        // Safe Fallback: Check for disconnected nodes and attempt 1-NN or 2-NN if some overlap exists
        this.images.forEach(img => {
            const degree = graph.degree(img.id);
            if (degree === 0) {
                 // Try to find ANY neighbor with at least minimal overlap (1 shared or threshold > 0.6) representing a weak link
                 // This reduces fragmentation into NOISE for valid but weak items
                 let bestMatch = null;
                 let maxScore = -1;
                 
                 this.images.forEach(other => {
                      if (img.id === other.id) return;
                      // Recalculate basic sim (inefficient but safe fallback method)
                      const empA = this.embeddings[img.id];
                      const empB = this.embeddings[other.id];
                      if (!empA || !empB) return;
                      
                      const s = cosineSimilarity(empA.state, empB.state);
                      const m = cosineSimilarity(empA.matter, empB.matter);
                      const v = cosineSimilarity(empA.movement, empB.movement);
                      const avg = (s + m + v) / 3;
                      
                      if (avg > maxScore) {
                          maxScore = avg;
                          bestMatch = other.id;
                      }
                 });

                 if (bestMatch && maxScore > 0.65) {
                     graph.addEdge(img.id, bestMatch, {
                         weight: maxScore,
                         layers: ['knn_rescue'],
                         simState: 0, simMatter: 0, simMove: 0,
                         sharedState: [], sharedMatter: [], sharedMove: [],
                         isRescue: true
                     });
                 }
            }
        });
        
        // Save graph_edges.csv with Expanded Components
        const edgesCsv = ['source,target,weight,layers,sim_state,sim_matter,sim_move,overlap_state,overlap_matter,overlap_move,is_rescue'];
        graph.edges().forEach(e => {
            const attr = graph.getEdgeAttributes(e);
            const ovS = attr.sharedState ? attr.sharedState.length : 0;
            const ovM = attr.sharedMatter ? attr.sharedMatter.length : 0;
            const ovV = attr.sharedMove ? attr.sharedMove.length : 0;
            
            edgesCsv.push(`${graph.source(e)},${graph.target(e)},${attr.weight.toFixed(4)},"${attr.layers.join('|')}",${attr.simState?.toFixed(2)||0},${attr.simMatter?.toFixed(2)||0},${attr.simMove?.toFixed(2)||0},${ovS},${ovM},${ovV},${attr.isRescue||false}`);
        });
        await fs.writeFile(path.join(evidenceDir, 'graph_edges.csv'), edgesCsv.join('\n'));

        // Detect Communities
        const communities = louvain(graph);
        const uniqueClusters = new Set(Object.values(communities));

        this.logger.logFormation({
            method: 'Louvain Modularity + ForceAtlas2',
            parameters: { resolution: 1.0, threshold: this.T_PRIMARY },
            totalClusters: uniqueClusters.size,
            outliersCount: 0 
        });

        // Apply initial layout
        const positions = forceAtlas2(graph, {
            iterations: 100,
            settings: { gravity: 1, scalingRatio: 10 }
        });

        // Group by cluster
        const clustersMap: Record<string, string[]> = {};
        Object.entries(communities).forEach(([nodeId, commId]) => {
            const cId = String(commId);
            if (!clustersMap[cId]) clustersMap[cId] = [];
            clustersMap[cId].push(nodeId);
        });

        const clusterMetricsForAudit: any[] = [];

        // Format clusters and log each one
        const clustersFormatted = Object.entries(clustersMap).map(([cId, itemIds]) => {
            // Re-fetch normalized signals for these items
            const clusterItems = normalizedData.filter(n => itemIds.includes(n.id));
            
            const allStates = clusterItems.flatMap(i => i.state.map(s => s.normalized));
            const allMatters = clusterItems.flatMap(i => i.matter.map(s => s.normalized));
            const allMovements = clusterItems.flatMap(i => i.movement.map(s => s.normalized));

            const topState = this.getTopTag(allStates, ['vibra', 'neutro']);
            const topMatter = this.getTopTag(allMatters, []);
            
            const dominantSignals = {
                state: this.getTopTags(allStates, 3),
                matter: this.getTopTags(allMatters, 3),
                movement: this.getTopTags(allMovements, 3)
            };

            // Calculate Medoid
            let medoidId = itemIds[0];
            let maxDegree = -1;
            itemIds.forEach(nodeA => {
                let internalDegree = 0;
                itemIds.forEach(nodeB => {
                    if (nodeA !== nodeB && graph.hasEdge(nodeA, nodeB)) internalDegree++;
                });
                if (internalDegree > maxDegree) {
                    maxDegree = internalDegree;
                    medoidId = nodeA;
                }
            });

            // Structural Metrics
            const edgesInCluster = [];
            let totalWeight = 0;
            let edgeCount = 0;
            let weights: number[] = [];

            for(let i=0; i<itemIds.length; i++) {
                for(let j=i+1; j<itemIds.length; j++) {
                    const src = itemIds[i]; 
                    const tgt = itemIds[j];
                    if (graph.hasEdge(src, tgt)) {
                        const w = graph.getEdgeAttribute(src, tgt, 'weight');
                        edgesInCluster.push({
                            source: src,
                            target: tgt,
                            weight: w
                        });
                        totalWeight += w;
                        edgeCount++;
                        weights.push(w);
                    }
                }
            }
            const strongestEdges = edgesInCluster.sort((a,b) => b.weight - a.weight).slice(0, 5);

            // --- Real Metrics ---
            
            // 1. Density
            const avgWeight = edgeCount > 0 ? totalWeight / edgeCount : (itemIds.length === 1 ? 0.0 : 0.0);
            const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
            const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
            const density = { avg: avgWeight, min: minWeight, max: maxWeight };

            // 2. Recurrence (Signal Overlap)
            const countSignal = (list: typeof normalizedData, layer: 'state' | 'matter' | 'movement', signal: string) => {
                if (!signal) return 0;
                return list.filter(img => {
                     // @ts-ignore
                    const signals = img[layer] || [];
                    return signals.map((s: any) => s.normalized).includes(signal);
                }).length;
            };
            
            const recState = dominantSignals.state[0] ? countSignal(clusterItems, 'state', dominantSignals.state[0]) / itemIds.length : 0;
            const recMatter = dominantSignals.matter[0] ? countSignal(clusterItems, 'matter', dominantSignals.matter[0]) / itemIds.length : 0;
            const recMove = dominantSignals.movement[0] ? countSignal(clusterItems, 'movement', dominantSignals.movement[0]) / itemIds.length : 0;
            
            // New: Multi-Layer Recurrence Logic (Method requirement)
            const recValues = [recState, recMatter, recMove].sort((a,b) => b-a);
            const recurrenceMulti = (recValues[0] + recValues[1]) / 2; // Avg of top 2
            
            const recurrence = { state: recState, matter: recMatter, movement: recMove };
            
            // 3. Stability (Leave-One-Out Simulation)
            let stabilityScore = 0;
            if (itemIds.length >= 3) {
                let consistentCores = 0;
                // Try removing each node and checking if the remaining nodes still have high connectivity
                itemIds.forEach(removedNode => {
                     const remaining = itemIds.filter(id => id !== removedNode);
                     // Calculate density of remaining
                     let subTotalW = 0;
                     let subCount = 0;
                     for(let i=0; i<remaining.length; i++){
                        for(let j=i+1; j<remaining.length; j++){
                            if(graph.hasEdge(remaining[i], remaining[j])) {
                                subTotalW += graph.getEdgeAttribute(remaining[i], remaining[j], 'weight');
                                subCount++;
                            }
                        }
                     }
                     const subDensity = subCount > 0 ? subTotalW / subCount : 0;
                     if (subDensity >= (avgWeight * 0.85)) consistentCores++; // If density drops less than 15%
                });
                stabilityScore = consistentCores / itemIds.length;
            } else if (itemIds.length === 2) {
                stabilityScore = avgWeight > 0.8 ? 0.5 : 0.2; // Pairs are semi-stable if strong
            }

            // 4. Strength Score (No Dummies)
            const maxRecurrence = Math.max(recState, recMatter, recMove);
            // Base strength is density
            let rawStrength = density.avg; 
            // Boost with recurrence
            rawStrength += (maxRecurrence * 0.3);
            // Penalty for small size
            let sizePenalty = 0;
            if (itemIds.length < 3) sizePenalty = 0.3;
            if (itemIds.length === 1) sizePenalty = 0.9;

            // 4. Base Score (Method: Weight Recurrence higher)
            const strengthScore = (recurrenceMulti * 0.7) + (density.avg * 0.3);

            // 5. Classification Rules (Strict Gates from Method)
            let classification: 'STRONG' | 'WEAK' | 'PROTO' | 'NOISE' = 'WEAK';
            
            const maxEdgeWeight = strongestEdges[0]?.weight || 0;

            // Gate 1: Noise (Too small or too disconnected)
            if (itemIds.length < 2 || maxEdgeWeight < 0.35) {
                classification = 'NOISE';
            }
            // Gate 2 & 3 & 4 (Check Quality)
            else {
                const passesRecurrenceGate = recurrenceMulti >= 0.6;
                
                if (passesRecurrenceGate) {
                    if (itemIds.length >= 4 && density.avg > 0.6) {
                        classification = 'STRONG';
                    } else {
                        // High recurrence but small or sparse
                        classification = 'PROTO';
                    }
                } else {
                    // Fails recurrence gate (signals diffuse)
                    classification = 'WEAK';
                }
            }
            
            // Generate justification
            let justification = `Cluster ${classification} (${(strengthScore*100).toFixed(0)}%). `;
            if (classification === 'STRONG') {
                justification += `Vibe forte. Recorrência multi-camada (${(recurrenceMulti*100).toFixed(0)}%) e densidade alta.`;
            } else if (classification === 'PROTO') {
                justification += `Núcleo em formação. Sinais fortes, mas quantidade/densidade abaixo do limiar.`;
            } else if (classification === 'NOISE') {
                justification += `Descartado. Tamanho insuficiente ou arestas fracas.`;
            } else {
                justification += `Vibe fraca. Sinais dispersos (Recorrência < 60%). Requer curadoria.`;
            }

            const insight = {
                clusterId: cId,
                nodeCount: itemIds.length,
                medoidNodeId: medoidId,
                dominantSignals,
                strongestEdges,
                classification,
                strengthScore,
                stabilityScore,
                density,
                recurrence,
                justification
            }
            this.logger.logClusterInsight(insight);
            clusterMetricsForAudit.push(insight);

            return {
                id: cId,
                name_suggested: `${topState || 'Vibe'} ${topMatter || 'Material'}`,
                motor: 'state' as const,
                items: itemIds
            };
        });

        // Near-Cluster Check (Bucket logic)
        const nearClusters: { signals: string, nodes: string[], reason: string }[] = [];
        // Map all pairs (state+matter)
        const buckets: Record<string, string[]> = {};
        normalizedData.forEach(node => {
            const s = node.state[0]?.normalized || 'x';
            const m = node.matter[0]?.normalized || 'y';
            const key = `${s}|${m}`;
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(node.id);
        });
        
        // Identify buckets that didn't form a single cluster
        Object.entries(buckets).forEach(([key, ids]) => {
             if (ids.length >= 2) {
                 // Check if these are split across clusters
                 const involvedClusters = new Set(ids.map(id => {
                     return clustersFormatted.find(c => c.items.includes(id))?.id;
                 }));
                 if (involvedClusters.size > 1) {
                     nearClusters.push({
                         signals: key,
                         nodes: ids,
                         reason: 'Split across clusters'
                     });
                 }
             }
        });
        await fs.writeFile(path.join(evidenceDir, 'near_clusters.json'), JSON.stringify(nearClusters, null, 2));

        // Save cluster_assignments.csv
        const assignmentsCsv = ['image_id,cluster_id'];
        clustersFormatted.forEach(c => {
            c.items.forEach(item => assignmentsCsv.push(`${item},${c.id}`));
        });
        await fs.writeFile(path.join(evidenceDir, 'cluster_assignments.csv'), assignmentsCsv.join('\n'));

        // Save cluster_metrics.json
        await fs.writeFile(path.join(evidenceDir, 'cluster_metrics.json'), JSON.stringify(clusterMetricsForAudit, null, 2));

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
            edges: edgesFormatted,
            evidencePath: evidenceDir
        };

        // Apply 2-stage layout
        result = applyTwoStageLayout(result);

        // Create Real Hashes for Audit (SHA256)
        const hashes = {
            inputs: ClusterAuditor.hashString(inputsCsv.join('\n')),
            edges: ClusterAuditor.hashString(edgesCsv.join('\n')),
            metrics: ClusterAuditor.hashString(JSON.stringify(clusterMetricsForAudit, null, 2))
        };
        // Also write detailed map to disk for human verification
        const detailedHashes = {
            ...hashes,
            'inputs_canonical.csv': hashes.inputs,
            'graph_edges.csv': hashes.edges,
            'cluster_metrics.json': hashes.metrics,
            'signals_normalized.json': ClusterAuditor.hashString(JSON.stringify(normalizedData, null, 2))
        };
        await fs.writeFile(path.join(evidenceDir, 'hashes.json'), JSON.stringify(detailedHashes, null, 2));

        // Audit
        const audit = ClusterAuditor.runSanityChecks(result, clusterMetricsForAudit, hashes);
        await fs.writeFile(path.join(evidenceDir, 'sanity_checks.json'), JSON.stringify(audit, null, 2));
        
        result.audit = audit;

        // Attach log
        result.log = this.logger.generateCognitiveMarkdown();

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
