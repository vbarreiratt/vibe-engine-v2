export type EditorSignal = {
    term: string;
    layer: 'state' | 'matter' | 'movement';
    recurrence: number; // 0 to 1
    count: number;
    totalNodes: number;
    role: 'structural' | 'support' | 'fragile';
    isActive: boolean; // For simulation
    isPromoted: boolean; // For manual weight
};

export type EditorNode = {
    id: string;
    url: string;
    signals: string[]; // List of terms present in this node
    connectionStrength: number;
};

export type ClusterMetrics = {
    classification: 'STRONG' | 'PROTO' | 'WEAK' | 'NOISE';
    avgRecurrence: number;
    density: number;
    stability: number; // 0 to 1
    nodeCount: number;
    dominantLayer: 'state' | 'matter' | 'movement' | 'balanced';
};

export type ClusterEditorData = {
    clusterId: string;
    label: string;
    signals: EditorSignal[];
    nodes: EditorNode[];
    metrics: ClusterMetrics;
};
