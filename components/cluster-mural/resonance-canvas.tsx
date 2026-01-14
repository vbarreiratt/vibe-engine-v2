'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface Node {
    id: string;
    x: number;
    y: number;
    cluster_index: number;
    is_outlier: boolean;
    image_url?: string;
}

interface Edge {
    source: string;
    target: string;
    weight: number;
    layers: string[];
}

interface Cluster {
    id: string;
    name_suggested: string;
    motor: string;
    items: string[];
}

interface ResonanceCanvasProps {
    nodes: Node[];
    edges: Edge[];
    clusters: Cluster[];
    onNodeMove?: (nodeId: string, x: number, y: number) => void;
    onSave?: () => void;
}

// Paleta de cores VIBRANTES para clusters (HSL para garantir visibilidade)
const CLUSTER_COLORS = [
    'hsl(0, 70%, 60%)',    // Vermelho vibrante
    'hsl(180, 70%, 50%)',  // Ciano
    'hsl(45, 90%, 55%)',   // Amarelo ouro
    'hsl(120, 60%, 50%)',  // Verde
    'hsl(270, 70%, 60%)',  // Roxo
    'hsl(30, 80%, 55%)',   // Laranja
    'hsl(200, 70%, 55%)',  // Azul claro
    'hsl(330, 70%, 55%)',  // Rosa
    'hsl(90, 60%, 50%)',   // Verde limão
    'hsl(300, 70%, 60%)',  // Magenta
];

export function ResonanceCanvas({ nodes, edges, clusters, onNodeMove, onSave }: ResonanceCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [tool, setTool] = useState<'select' | 'pan'>('select');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // UI toggles
    const [showTopbar, setShowTopbar] = useState(true);
    const [showToolbar, setShowToolbar] = useState(true);

    // Fit to view on mount
    useEffect(() => {
        if (!containerRef.current || nodes.length === 0) return;

        const bounds = calculateBounds(nodes);
        const { width, height } = containerRef.current.getBoundingClientRect();

        const padding = 150;
        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;

        const scaleX = availableWidth / (bounds.width || 1);
        const scaleY = availableHeight / (bounds.height || 1);
        const scale = Math.min(scaleX, scaleY, 1.5);

        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        const x = width / 2 - centerX * scale;
        const y = height / 2 - centerY * scale;

        setTransform({ scale, x, y });
    }, [nodes]);

    const calculateBounds = (nodes: Node[]) => {
        if (nodes.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    };

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.1, transform.scale + delta), 3);
        setTransform(prev => ({ ...prev, scale: newScale }));
    }, [transform.scale]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (tool === 'pan' || e.button === 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && tool === 'pan') {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-zinc-900">
            {/* Floating Topbar */}
            <div
                className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showTopbar ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div className="bg-black/90 backdrop-blur-md border border-lime-500/30 rounded-2xl px-6 py-3 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <h1 className="text-white font-medium text-lg">Editor de Ressonância</h1>
                        <div className="text-sm text-lime-400 font-mono">
                            Nodes: {nodes.length} | Clusters: {clusters.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Save Button */}
            <button
                onClick={onSave}
                className="absolute top-4 right-4 z-50 px-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl shadow-2xl transition-all hover:scale-105"
            >
                💾 Salvar Alterações
            </button>

            {/* Toggle Topbar Button */}
            <button
                onClick={() => setShowTopbar(!showTopbar)}
                className="absolute top-4 left-4 z-50 w-10 h-10 bg-black/80 hover:bg-black border border-white/20 rounded-lg text-white flex items-center justify-center transition-all"
                title="Toggle Info"
            >
                {showTopbar ? '👁' : '👁‍🗨'}
            </button>

            {/* Left Floating Toolbar */}
            <div
                className={`absolute left-4 top-20 flex flex-col gap-2 z-40 transition-all duration-300 ${showToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <button
                    onClick={() => setTool('select')}
                    className={`w-14 h-14 rounded-xl border-2 transition-all ${tool === 'select'
                            ? 'bg-lime-500 border-lime-400 text-black scale-110'
                            : 'bg-black/80 border-white/30 text-white hover:border-lime-500/50'
                        }`}
                    title="Selecionar"
                >
                    <div className="text-2xl">↖</div>
                </button>
                <button
                    onClick={() => setTool('pan')}
                    className={`w-14 h-14 rounded-xl border-2 transition-all ${tool === 'pan'
                            ? 'bg-lime-500 border-lime-400 text-black scale-110'
                            : 'bg-black/80 border-white/30 text-white hover:border-lime-500/50'
                        }`}
                    title="Pan (Arrastar)"
                >
                    <div className="text-2xl">✋</div>
                </button>
                <div className="h-px bg-white/20 my-2" />
                <button
                    className="w-14 h-14 rounded-xl border-2 bg-black/80 border-white/30 text-white hover:border-lime-500/50 transition-all text-2xl font-bold"
                    title="Zoom +"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.3, 3) }))}
                >
                    +
                </button>
                <button
                    className="w-14 h-14 rounded-xl border-2 bg-black/80 border-white/30 text-white hover:border-lime-500/50 transition-all text-2xl font-bold"
                    title="Zoom −"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.3, 0.1) }))}
                >
                    −
                </button>
                <button
                    className="w-14 h-14 rounded-xl border-2 bg-black/80 border-white/30 text-white hover:border-lime-500/50 transition-all text-lg"
                    title="Resetar Zoom"
                    onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
                >
                    ⟲
                </button>
            </div>

            {/* Main Canvas */}
            <div
                ref={containerRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: tool === 'pan' ? 'grab' : 'default' }}
            >
                <svg className="w-full h-full">
                    <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
                        {/* Render cluster islands */}
                        {clusters.map((cluster, idx) => {
                            const clusterNodes = nodes.filter(n => n.cluster_index === parseInt(cluster.id));
                            if (clusterNodes.length === 0) return null;

                            const cx = clusterNodes.reduce((sum, n) => sum + n.x, 0) / clusterNodes.length;
                            const cy = clusterNodes.reduce((sum, n) => sum + n.y, 0) / clusterNodes.length;
                            const radius = Math.max(100, clusterNodes.length * 30);

                            const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];

                            return (
                                <g key={cluster.id}>
                                    {/* Ilha do cluster (glow) */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={radius + 20}
                                        fill={color}
                                        fillOpacity="0.05"
                                        stroke="none"
                                    />
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={radius}
                                        fill={color}
                                        fillOpacity="0.15"
                                        stroke={color}
                                        strokeWidth="3"
                                        strokeOpacity="0.6"
                                        strokeDasharray="5,5"
                                    />
                                    {/* Label do cluster */}
                                    <text
                                        x={cx}
                                        y={cy - radius - 20}
                                        textAnchor="middle"
                                        fill={color}
                                        fontSize="18"
                                        fontWeight="700"
                                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                                    >
                                        {cluster.name_suggested}
                                    </text>
                                    <text
                                        x={cx}
                                        y={cy - radius - 2}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize="12"
                                        fontWeight="500"
                                        fillOpacity="0.7"
                                    >
                                        {clusterNodes.length} nodes
                                    </text>
                                </g>
                            );
                        })}

                        {/* Render edges */}
                        {edges.map((edge, idx) => {
                            const source = nodes.find(n => n.id === edge.source);
                            const target = nodes.find(n => n.id === edge.target);
                            if (!source || !target) return null;

                            return (
                                <line
                                    key={idx}
                                    x1={source.x}
                                    y1={source.y}
                                    x2={target.x}
                                    y2={target.y}
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth={edge.weight * 3}
                                />
                            );
                        })}

                        {/* Render nodes */}
                        {nodes.map((node) => {
                            const color = CLUSTER_COLORS[node.cluster_index % CLUSTER_COLORS.length];
                            const isSelected = selectedNode === node.id;

                            return (
                                <g
                                    key={node.id}
                                    onClick={() => setSelectedNode(node.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Glow effect */}
                                    {isSelected && (
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r="50"
                                            fill={color}
                                            fillOpacity="0.2"
                                        />
                                    )}

                                    {/* Node body */}
                                    <rect
                                        x={node.x - 35}
                                        y={node.y - 35}
                                        width="70"
                                        height="70"
                                        fill={color}
                                        fillOpacity={node.is_outlier ? "0.3" : "0.8"}
                                        stroke={isSelected ? 'white' : color}
                                        strokeWidth={isSelected ? 4 : 3}
                                        rx="12"
                                        filter={isSelected ? 'url(#glow)' : 'none'}
                                    />

                                    {/* Cluster badge */}
                                    <circle
                                        cx={node.x + 28}
                                        cy={node.y - 28}
                                        r="16"
                                        fill="white"
                                        stroke={color}
                                        strokeWidth="3"
                                    />
                                    <text
                                        x={node.x + 28}
                                        y={node.y - 23}
                                        textAnchor="middle"
                                        fill="black"
                                        fontSize="12"
                                        fontWeight="900"
                                    >
                                        C{node.cluster_index}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {/* SVG Filters */}
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                </svg>
            </div>

            {/* Inspector Panel (Floating Right) */}
            {selectedNode && (
                <div className="absolute right-4 top-24 w-80 bg-black/90 backdrop-blur-md border border-lime-500/30 rounded-2xl p-6 z-40 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold text-lg">Node Selecionado</h3>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-white/60 hover:text-white transition-colors text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <div className="text-sm text-lime-400 space-y-2 font-mono">
                        <p>ID: <span className="text-white">{selectedNode.slice(0, 8)}...</span></p>
                        {(() => {
                            const node = nodes.find(n => n.id === selectedNode);
                            if (!node) return null;
                            const color = CLUSTER_COLORS[node.cluster_index % CLUSTER_COLORS.length];
                            return (
                                <>
                                    <p>Cluster: <span className="text-white font-bold">{node.cluster_index}</span></p>
                                    <p>Cor: <span style={{ color }}>{color}</span></p>
                                    <p>Outlier: <span className="text-white">{node.is_outlier ? 'Sim' : 'Não'}</span></p>
                                    <p>Posição: <span className="text-white">({node.x.toFixed(0)}, {node.y.toFixed(0)})</span></p>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
