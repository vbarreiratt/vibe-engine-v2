declare module 'graphology' {
    export default class Graph {
        constructor(options?: any);
        addNode(node: string, attributes?: any): void;
        addEdge(source: string, target: string, attributes?: any): void;
        hasEdge(source: string, target: string): boolean;
        nodes(): string[];
        edges(): string[];
        degree(node: string): number;
        source(edge: string): string;
        target(edge: string): string;
        getNodeAttributes(node: string): any;
        getEdgeAttributes(edge: string): any;
        getEdgeAttribute(source: string, target: string, name: string): any;
        getEdgeAttribute(edge: string, name: string): any;
        forEachNode(callback: (node: string, attributes: any) => void): void;
        forEachEdge(callback: (edge: string, attributes: any, source: string, target: string) => void): void;
    }
}

declare module 'graphology-communities-louvain' {
    import Graph from 'graphology';
    export default function louvain(graph: Graph, options?: any): Record<string, number>;
}

declare module 'graphology-layout-forceatlas2' {
    import Graph from 'graphology';
    export default function forceAtlas2(graph: Graph, options?: any): Record<string, { x: number, y: number }>;
}
