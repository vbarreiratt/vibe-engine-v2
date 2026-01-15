import { ClusterResult } from './cluster-engine';

/**
 * Layout em 2 estágios:
 * 1. Macro: Posiciona os centros dos clusters
 * 2. Micro: Posiciona os nodes ao redor do centro do cluster
 */

interface PositionedNode {
    id: string;
    x: number;
    y: number;
    cluster_index: number;
    is_outlier: boolean;
}

interface ClusterCenter {
    cluster_index: number;
    cx: number;
    cy: number;
    nodeCount: number;
}

export function applyTwoStageLayout(result: ClusterResult): ClusterResult {
    // 1. Calcular centros dos clusters (Macro)
    const clusterCenters = calculateClusterCenters(result);

    // 2. Posicionar nodes ao redor dos centros (Micro)
    const repositionedNodes = positionNodesAroundClusters(result.nodes, result.clusters, clusterCenters);

    return {
        ...result,
        nodes: repositionedNodes
    };
}

function calculateClusterCenters(result: ClusterResult): ClusterCenter[] {
    const centers: ClusterCenter[] = [];
    const regularClusters: number[] = [];
    const outlierClusters: number[] = [];

    // Separar clusters regulares de outliers
    result.clusters.forEach((cluster, idx) => {
        const nodeCount = cluster.items.length;
        if (nodeCount === 1) {
            outlierClusters.push(idx);
        } else {
            regularClusters.push(idx);
        }
    });

    // Configuração do layout
    const BASE_SPACING = 400; // Espaçamento entre clusters
    const OUTLIER_RADIUS = 800; // Raio do anel de outliers

    // Layout em grid relaxado para clusters regulares
    const cols = Math.ceil(Math.sqrt(regularClusters.length));

    regularClusters.forEach((clusterIdx, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;

        // Adicionar jitter para parecer orgânico
        const jitterX = (Math.random() - 0.5) * 80;
        const jitterY = (Math.random() - 0.5) * 80;

        centers.push({
            cluster_index: clusterIdx,
            cx: col * BASE_SPACING + jitterX,
            cy: row * BASE_SPACING + jitterY,
            nodeCount: result.clusters[clusterIdx].items.length
        });
    });

    // Layout em anel para outliers
    outlierClusters.forEach((clusterIdx, i) => {
        const angle = (i / outlierClusters.length) * 2 * Math.PI;
        centers.push({
            cluster_index: clusterIdx,
            cx: Math.cos(angle) * OUTLIER_RADIUS,
            cy: Math.sin(angle) * OUTLIER_RADIUS,
            nodeCount: 1
        });
    });

    return centers;
}

function positionNodesAroundClusters(
    nodes: PositionedNode[],
    clusters: any[],
    centers: ClusterCenter[]
): PositionedNode[] {
    const NODE_RADIUS = 60; // Raio da órbita de nodes ao redor do centro

    return nodes.map(node => {
        const center = centers.find(c => c.cluster_index === node.cluster_index);

        if (!center) {
            // Fallback: manter posição original
            return node;
        }

        // Encontrar o índice do node dentro do cluster
        const cluster = clusters[node.cluster_index];
        const nodeIndexInCluster = cluster.items.indexOf(node.id);
        const totalNodesInCluster = cluster.items.length;

        if (totalNodesInCluster === 1) {
            // Node singleton: fica no centro
            return {
                ...node,
                x: center.cx,
                y: center.cy
            };
        }

        // Posicionar em círculo ao redor do centro
        const angle = (nodeIndexInCluster / totalNodesInCluster) * 2 * Math.PI;
        const radius = NODE_RADIUS + (totalNodesInCluster > 6 ? 40 : 0); // Aumenta raio para clusters grandes

        // Jitter leve para parecer orgânico
        const jitterX = (Math.random() - 0.5) * 20;
        const jitterY = (Math.random() - 0.5) * 20;

        return {
            ...node,
            x: center.cx + Math.cos(angle) * radius + jitterX,
            y: center.cy + Math.sin(angle) * radius + jitterY
        };
    });
}

/**
 * Calcula bounds para fit-to-view
 */
export function calculateBounds(nodes: PositionedNode[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
} {
    if (nodes.length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Calcula transformação para fit-to-view
 */
export function calculateFitToView(
    bounds: ReturnType<typeof calculateBounds>,
    viewportWidth: number,
    viewportHeight: number,
    padding: number = 100
): {
    scale: number;
    offsetX: number;
    offsetY: number;
} {
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1); // Não aumentar muito

    // Centralizar
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const offsetX = viewportWidth / 2 - centerX * scale;
    const offsetY = viewportHeight / 2 - centerY * scale;

    return { scale, offsetX, offsetY };
}
