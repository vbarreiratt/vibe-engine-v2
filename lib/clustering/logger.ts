/**
 * Sistema de logging para auditoria do processo de clusterização
 */

export interface ClusterJobLog {
    type: 'job_start' | 'job_end' | 'cluster_created' | 'user_action';
    timestamp: string;
    data: any;
}

export class ClusterLogger {
    private logs: ClusterJobLog[] = [];

    logJobStart(data: {
        nodeCount: number;
        embeddingModel: string;
        embeddingDimension: number;
        similarityMetric: string;
        resonanceThreshold: number;
        clusteringMethod: string;
    }) {
        this.logs.push({
            type: 'job_start',
            timestamp: new Date().toISOString(),
            data
        });
    }

    logJobEnd(data: {
        clustersGenerated: number;
        outliers: number;
        duration: number; // em segundos
    }) {
        this.logs.push({
            type: 'job_end',
            timestamp: new Date().toISOString(),
            data
        });
    }

    logClusterCreated(data: {
        cluster_id: string;
        nodeCount: number;
        dominantSignals: {
            state: string[];
            matter: string[];
            movement: string[];
        };
        justification: string;
    }) {
        this.logs.push({
            type: 'cluster_created',
            timestamp: new Date().toISOString(),
            data
        });
    }

    logUserAction(data: {
        userId: string;
        action: 'move_node' | 'create_cluster' | 'merge_clusters' | 'split_cluster' | 'mark_outlier' | 'rename_cluster';
        target: string; // node_id ou cluster_id
        beforeState?: any;
        afterState?: any;
        reason?: string;
    }) {
        this.logs.push({
            type: 'user_action',
            timestamp: new Date().toISOString(),
            data
        });
    }

    /**
     * Gera log legível para humanos
     */
    generateHumanReadableLog(): string {
        let output = '';

        for (const log of this.logs) {
            switch (log.type) {
                case 'job_start':
                    output += `[CLUSTER_JOB_START]\n`;
                    output += `Nodes recebidos: ${log.data.nodeCount}\n`;
                    output += `Modelo de embedding: ${log.data.embeddingModel}\n`;
                    output += `Dimensão: ${log.data.embeddingDimension}\n`;
                    output += `Métrica: ${log.data.similarityMetric}\n`;
                    output += `Threshold de ressonância: ${log.data.resonanceThreshold}\n`;
                    output += `Método de agrupamento: ${log.data.clusteringMethod}\n`;
                    output += `\n`;
                    break;

                case 'job_end':
                    output += `[CLUSTER_JOB_END]\n`;
                    output += `Clusters gerados: ${log.data.clustersGenerated}\n`;
                    output += `Outliers: ${log.data.outliers}\n`;
                    output += `Duração: ${log.data.duration.toFixed(2)}s\n`;
                    output += `\n`;
                    break;

                case 'cluster_created':
                    output += `[CLUSTER_AUTO]\n`;
                    output += `cluster_id: ${log.data.cluster_id}\n`;
                    output += `nodes: ${log.data.nodeCount}\n`;
                    output += `sinais dominantes:\n`;
                    if (log.data.dominantSignals.state.length > 0) {
                        output += `  • Estado: ${log.data.dominantSignals.state.join(', ')}\n`;
                    }
                    if (log.data.dominantSignals.matter.length > 0) {
                        output += `  • Matéria: ${log.data.dominantSignals.matter.join(', ')}\n`;
                    }
                    if (log.data.dominantSignals.movement.length > 0) {
                        output += `  • Movimento: ${log.data.dominantSignals.movement.join(', ')}\n`;
                    }
                    output += `Justificativa:\n${log.data.justification}\n`;
                    output += `\n`;
                    break;

                case 'user_action':
                    output += `[USER_ACTION]\n`;
                    output += `user: ${log.data.userId}\n`;
                    output += `ação: ${log.data.action}\n`;
                    output += `alvo: ${log.data.target}\n`;
                    if (log.data.reason) {
                        output += `motivo: "${log.data.reason}"\n`;
                    }
                    output += `timestamp: ${log.timestamp}\n`;
                    output += `\n`;
                    break;
            }
        }

        return output;
    }

    /**
     * Exporta logs em JSON
     */
    toJSON(): ClusterJobLog[] {
        return this.logs;
    }

    /**
     * Carrega logs de JSON
     */
    fromJSON(logs: ClusterJobLog[]) {
        this.logs = logs;
    }
}
