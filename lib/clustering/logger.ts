
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Sistema de logging auditável e cognitivo para o Vibe Engine.
 * Mantém rastreabilidade completa (Normalização -> Vetor -> Grafo -> Cluster).
 */

// --- Interfaces de Log Técnico e Cognitivo ---

export interface LogEventInput {
    nodeCount: number;
    dimensions: number;
    model: string;
}

export interface LogCanonicalText {
    imageId: string;
    original: {
        state: string[];
        matter: string[];
        movement: string[];
    };
    normalized: {
        state: string[];
        matter: string[];
        movement: string[];
    };
    finalText: string;
}

export interface LogEmbedding {
    imageId: string;
    dimension: number;
    success: boolean;
    error?: string;
    durationMs: number;
}

export interface LogSimilarity {
    sourceId: string;
    targetId: string;
    score: number;
    threshold: number;
    isEdgeCreated: boolean;
    sharedSignals: string[];
    isSemanticBridge: boolean;
}

export interface LogClusterFormation {
    method: string; // e.g., 'Louvain', 'ConnectedComponents'
    parameters: any;
    totalClusters: number;
    outliersCount: number;
}

export interface LogClusterInsight {
    clusterId: string; // internal ID/Index
    nodeCount: number;
    medoidNodeId: string;
    dominantSignals: {
        state: string[];
        matter: string[];
        movement: string[];
    };
    strongestEdges: {
        source: string;
        target: string;
        weight: number;
    }[];
    classification: 'STRONG' | 'WEAK' | 'PROTO' | 'NOISE';
    strengthScore: number;
    stabilityScore: number;
    density: { avg: number; min: number; max: number };
    recurrence: { state: number; matter: number; movement: number }; // % overlap of dominant signals
    justification: string;
}

// Estrutura completa do Trace (Estado mutável durante o job)
export interface ClusterTrace {
    runId: string;
    timestamp: string;
    input: LogEventInput;
    nodes: Record<string, LogCanonicalText>; // imageId -> info
    embeddings: Record<string, LogEmbedding>;
    edges: LogSimilarity[];
    formation: LogClusterFormation;
    clusters: Record<string, LogClusterInsight>; // clusterId -> info
    logs: string[]; // Logs crus de texto para debug rápido
}

export class ClusterLogger {
    private trace: ClusterTrace;

    constructor(runId: string = 'unknown') {
        this.trace = {
            runId,
            timestamp: new Date().toISOString(),
            input: { nodeCount: 0, dimensions: 0, model: 'unknown' },
            nodes: {},
            embeddings: {},
            edges: [],
            formation: { method: 'unknown', parameters: {}, totalClusters: 0, outliersCount: 0 },
            clusters: {},
            logs: []
        };
    }

    // --- Métodos de Captura (Instrumentação) ---

    logInput(input: LogEventInput) {
        this.trace.input = input;
        this.log(`Job iniciado: ${input.nodeCount} node(s). Model: ${input.model}`);
    }

    logCanonicalText(data: LogCanonicalText) {
        this.trace.nodes[data.imageId] = data;
    }

    logEmbedding(data: LogEmbedding) {
        this.trace.embeddings[data.imageId] = data;
    }

    logSimilarity(data: LogSimilarity) {
        // Apenas guardamos se for relevante (ex: acima de um certo ponto) ou se gerou aresta
        // Para não explodir a memória, podemos filtrar scores muito baixos se não gerarem aresta
        // Mas o pedido é para auditoria completa. Vamos manter edges criados + rejeições 'quase' aceitas.
        if (data.isEdgeCreated || data.score > 0.5) {
            this.trace.edges.push(data);
        }
    }

    logFormation(data: LogClusterFormation) {
        this.trace.formation = data;
        this.log(`Clusters formados via ${data.method}: ${data.totalClusters} clusters, ${data.outliersCount} outliers.`);
    }

    logClusterInsight(data: LogClusterInsight) {
        this.trace.clusters[data.clusterId] = data;
    }

    private log(msg: string) {
        this.trace.logs.push(`[${new Date().toISOString()}] ${msg}`);
        console.log(`[ClusterLogger] ${msg}`);
    }

    // --- Geradores de Saída ---

    /**
     * Gera o Markdown Cognitivo (Narrativa Humana)
     */
    generateCognitiveMarkdown(): string {
        const t = this.trace;
        let md = `# Relatório Cognitivo de Clusterização (Vibe Engine)\n\n`;
        md += `**Run ID:** \`${t.runId}\`\n`;
        md += `**Data:** ${t.timestamp}\n`;
        md += `**Input:** ${t.input.nodeCount} imagens processadas via ${t.input.model} (${t.input.dimensions}d).\n\n`;

        md += `## 1. Preparação e Normalização (Amostra)\n`;
        md += `Exibindo primeiros 3 exemplos de transformação texto -> canônico:\n\n`;
        Object.values(t.nodes).slice(0, 3).forEach(n => {
            md += `### Imagem \`${n.imageId}\`\n`;
            md += `- **Original**: S=[${n.original.state.join(', ')}] M=[${n.original.matter.join(', ')}] V=[${n.original.movement.join(', ')}]\n`;
            md += `- **Canônico**: "${n.finalText}"\n\n`;
        });

        md += `## 2. Decisões de Grafo (Arestas)\n`;
        md += `Total de conexões avaliadas relevantes: ${t.edges.length}\n\n`;

        // Amostra de arestas fortes
        const strongEdges = t.edges.filter(e => e.isEdgeCreated).sort((a, b) => b.score - a.score).slice(0, 5);
        md += `### Top 5 Conexões Mais Fortes\n`;
        strongEdges.forEach(e => {
            md += `- **${e.sourceId} ↔ ${e.targetId}** (Score: ${e.score.toFixed(3)})\n`;
            md += `  - Shared Signals: ${e.sharedSignals.join(', ') || '(Similaridade vetorial latente)'}\n`;
            if (e.isSemanticBridge) md += `  - *Semantic Bridge (Alta similaridade apesar de poucos sinais exatos)*\n`;
        });

        const grouped = {
            STRONG: [] as LogClusterInsight[],
            PROTO: [] as LogClusterInsight[],
            WEAK: [] as LogClusterInsight[],
            NOISE: [] as LogClusterInsight[]
        };

        Object.values(t.clusters).forEach(c => {
            if (grouped[c.classification]) {
                grouped[c.classification].push(c);
            } else {
                // Fallback for unexpected or mixed types if any
                grouped.WEAK.push(c);
            }
        });

        const printGroup = (title: string, list: LogClusterInsight[]) => {
            if (list.length === 0) return;
            md += `### ${title}\n`;
            list.forEach(c => {
                md += `**[Cluster ${c.clusterId}]** (Força: ${c.strengthScore?.toFixed(2) || 'N/A'}, Estabilidade: ${c.stabilityScore?.toFixed(2) || 'N/A'}, Densidade: ${c.density?.avg.toFixed(2) || 'N/A'})\n`;
                md += `- **Cadeia de Formação**:\n`;
                md += `  - Sinais Recorrentes: Estado=${(c.recurrence?.state * 100).toFixed(0)}%, Matéria=${(c.recurrence?.matter * 100).toFixed(0)}%, Movimento=${(c.recurrence?.movement * 100).toFixed(0)}%\n`;
                md += `  - Sinais Dominantes: ${c.dominantSignals.state[0] || '-'} / ${c.dominantSignals.matter[0] || '-'} / ${c.dominantSignals.movement[0] || '-'}\n`;
                md += `- **Interpretação**: ${c.justification}\n\n`;
            });
        };

        md += `\n## 3. Explicação dos Clusters\n`;
        md += `Método: ${t.formation.method}. Resultado: ${t.formation.totalClusters} clusters.\n\n`;

        printGroup('Clusters Fortes (Vibes Consolidadas)', grouped.STRONG);
        printGroup('Proto-Clusters (Mundos Emergentes)', grouped.PROTO);
        printGroup('Clusters Fracos (Limítrofes)', grouped.WEAK);
        printGroup('Ruído / Outliers', grouped.NOISE);

        md += `\n### Auditoria e Evidências\n`;
        md += `Para garantir a rastreabilidade deste processo (Chain of Evidence), consulte os artefatos:\n`;
        md += `- **Cálculos Detalhados**: \`evidence/cluster_metrics.json\`\n`;
        md += `- **Atribuições**: \`evidence/cluster_assignments.csv\`\n`;
        md += `- **Arestas Auditadas**: \`evidence/graph_edges.csv\`\n`;
        md += `- **Inputs Canônicos**: \`evidence/inputs_canonical.csv\`\n\n`;

        md += `> _Relatório gerado automaticamente pelo Vibe Engine v2 (Audit Mode)._\n`;

        return md;
    }

    /**
     * Retorna o objeto JSON completo para log técnico
     */
    generateTechnicalJson(): object {
        return this.trace;
    }

    /**
     * Gera CSV de Nodes
     */
    generateNodesCSV(): string {
        const header = "node_id,canonical_text,top_signals_state,top_signals_matter,top_signals_movement,embedding_ok\n";
        const rows = Object.values(this.trace.nodes).map(n => {
            // escape text
            const safeText = `"${n.finalText.replace(/"/g, '""')}"`;
            const s = `"${n.normalized.state.join('|')}"`;
            const m = `"${n.normalized.matter.join('|')}"`;
            const v = `"${n.normalized.movement.join('|')}"`;
            const embOk = this.trace.embeddings[n.imageId]?.success ?? false;
            return `${n.imageId},${safeText},${s},${m},${v},${embOk}`;
        });
        return header + rows.join('\n');
    }

    /**
     * Gera CSV de Edges
     */
    generateEdgesCSV(): string {
        const header = "source,target,cosine,shared_signals,is_created,is_bridge\n";
        const rows = this.trace.edges.map(e => {
            const shared = `"${e.sharedSignals.join('|')}"`;
            return `${e.sourceId},${e.targetId},${e.score.toFixed(4)},${shared},${e.isEdgeCreated},${e.isSemanticBridge}`;
        });
        return header + rows.join('\n');
    }

    /**
     * Exporta tudo para disco
     */
    async exportLogs(baseDir: string) {
        try {
            await fs.mkdir(baseDir, { recursive: true });

            await fs.writeFile(path.join(baseDir, 'cluster_log_cognitivo.md'), this.generateCognitiveMarkdown());
            await fs.writeFile(path.join(baseDir, 'cluster_log_tecnico.json'), JSON.stringify(this.generateTechnicalJson(), null, 2));
            await fs.writeFile(path.join(baseDir, 'cluster_nodes.csv'), this.generateNodesCSV());
            await fs.writeFile(path.join(baseDir, 'cluster_graph.csv'), this.generateEdgesCSV());

            console.log(`Logs exportados com sucesso para ${baseDir}`);
        } catch (error) {
            console.error("Erro ao exportar logs:", error);
        }
    }
}
// End of Logger

