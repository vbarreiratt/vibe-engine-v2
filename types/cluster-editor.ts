export type SignalRole = 'structural' | 'support' | 'noise' | 'neutral'; // Neutral = automatic/default
export type NodeCurationStatus = 'active' | 'weak' | 'pillar' | 'removed';
export type CanvasMode = 'view' | 'playground' | 'synthesis';

export type EditorSignal = {
    term: string;
    layer: 'state' | 'matter' | 'movement';
    recurrence: number; // 0 to 1
    count: number;
    totalNodes: number;
    role: SignalRole; // Now explicitly semantic
    isActive: boolean; // For simulation
    isPromoted: boolean; // Deprecated, use role='structural'
};

export type EditorNode = {
    id: string; // Image ID
    nodeId: string; // Join table ID (cluster_nodes.id)
    url: string;
    signals: string[]; // List of terms present in this node
    connectionStrength: number;
    curationStatus: NodeCurationStatus;
};

export type ClusterMetrics = {
    classification: 'STRONG' | 'PROTO' | 'WEAK' | 'NOISE';
    avgRecurrence: number;
    density: number;
    stability: number; // 0 to 1
    nodeCount: number;
    dominantLayer: 'state' | 'matter' | 'movement' | 'balanced';
};

export type SynthesisRole = 'territory' | 'pillar' | 'counterpoint' | 'archive' | null;

export type ClusterSynthesis = {
    name: string | null;
    description: string | null;
    role: SynthesisRole;
};

export type ClusterEditorData = {
    clusterId: string;
    label: string;
    signals: EditorSignal[];
    nodes: EditorNode[];
    metrics: ClusterMetrics;
    synthesis: ClusterSynthesis;
};
