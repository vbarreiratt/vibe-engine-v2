'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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

// Paleta de cores para clusters
const CLUSTER_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#52B788', '#FFB347'
];

export function ResonanceCanvas({ nodes, edges, clusters, onNodeMove, onSave }: ResonanceCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [tool, setTool] = useState<'select' | 'pan'>('select');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Fit to view on mount
    useEffect(() => {
        if (!canvasRef.current || nodes.length === 0) return;

        const bounds = calculateBounds(nodes);
        const { width, height } = canvasRef.current.getBoundingClientRect();

        const padding = 100;
        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;

        const scaleX = availableWidth / bounds.width;
        const scaleY = availableHeight / bounds.height;
        const scale = Math.min(scaleX, scaleY, 1.2);

        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        const x = width / 2 - centerX * scale;
        const y = height / 2 - centerY * scale;

        setTransform({ scale, x, y });
    }, [nodes]);

    const calculateBounds = (nodes: Node[]) => {
        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys)
        };
    };

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.1, transform.scale + delta), 3);
        setTransform(prev => ({ ...prev, scale: newScale }));
    }, [transform.scale]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (tool === 'pan' || e.button === 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isDragging && tool === 'pan') {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-zinc-950">
            {/* TopBar */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-black/80 border-b border-white/10 flex items-center justify-between px-4 z-50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button className="text-zinc-400 hover:text-white transition-colors">
                        ← Voltar
                    </button>
                    <h1 className="text-white font-medium">Editor de Ressonância</h1>
                    <div className="text-xs text-zinc-500">
                        Nodes: {nodes.length} | Clusters: {clusters.length}
                    </div>
                </div>
                <button
                    onClick={onSave}
                    className="px-4 py-2 bg-lime-500 text-black rounded-lg hover:bg-lime-400 transition-colors font-medium text-sm"
                >
                    Salvar Alterações
                </button>
            </div>

            {/* Left Toolbar */}
            <div className="absolute left-4 top-20 flex flex-col gap-2 z-40">
                <button
                    onClick={() => setTool('select')}
                    className={`w-12 h-12 rounded-lg border ${tool === 'select' ? 'bg-lime-500 border-lime-400' : 'bg-zinc-900 border-white/10 text-zinc-400'
                        } hover:bg-lime-500/20 transition-colors flex items-center justify-center`}
                    title="Selecionar"
                >
                    ↖
                </button>
                <button
                    onClick={() => setTool('pan')}
                    className={`w-12 h-12 rounded-lg border ${tool === 'pan' ? 'bg-lime-500 border-lime-400' : 'bg-zinc-900 border-white/10 text-zinc-400'
                        } hover:bg-lime-500/20 transition-colors flex items-center justify-center`}
                    title="Pan"
                >
                    ✋
                </button>
                <button
                    className="w-12 h-12 rounded-lg border bg-zinc-900 border-white/10 text-zinc-400 hover:bg-lime-500/20 transition-colors flex items-center justify-center"
                    title="Zoom +"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }))}
                >
                    +
                </button>
                <button
                    className="w-12 h-12 rounded-lg border bg-zinc-900 border-white/10 text-zinc-400 hover:bg-lime-500/20 transition-colors flex items-center justify-center"
                    title="Zoom -"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }))}
                >
                    −
                </button>
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
            >
                <svg className="w-full h-full">
                    <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
                        {/* Render cluster islands */}
                        {clusters.map((cluster, idx) => {
                            const clusterNodes = nodes.filter(n => n.cluster_index === parseInt(cluster.id));
                            if (clusterNodes.length === 0) return null;

                            const cx = clusterNodes.reduce((sum, n) => sum + n.x, 0) / clusterNodes.length;
                            const cy = clusterNodes.reduce((sum, n) => sum + n.y, 0) / clusterNodes.length;
                            const radius = Math.max(80, clusterNodes.length * 25);

                            const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];

                            return (
                                <g key={cluster.id}>
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={radius}
                                        fill={color}
                                        fillOpacity="0.1"
                                        stroke={color}
                                        strokeWidth="2"
                                        strokeOpacity="0.3"
                                    />
                                    <text
                                        x={cx}
                                        y={cy - radius - 10}
                                        textAnchor="middle"
                                        fill={color}
                                        fontSize="14"
                                        fontWeight="600"
                                    >
                                        {cluster.name_suggested} ({clusterNodes.length})
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
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth={edge.weight * 2}
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
                                    {node.image_url ? (
                                        <image
                                            x={node.x - 30}
                                            y={node.y - 30}
                                            width="60"
                                            height="60"
                                            href={node.image_url}
                                            style={{
                                                border: isSelected ? `3px solid ${color}` : `2px solid ${color}`,
                                                borderRadius: '8px',
                                                filter: node.is_outlier ? 'grayscale(50%)' : 'none'
                                            }}
                                        />
                                    ) : (
                                        <rect
                                            x={node.x - 30}
                                            y={node.y - 30}
                                            width="60"
                                            height="60"
                                            fill={color}
                                            fillOpacity="0.2"
                                            stroke={color}
                                            strokeWidth={isSelected ? 3 : 2}
                                            rx="8"
                                        />
                                    )}
                                    <circle
                                        cx={node.x + 24}
                                        cy={node.y - 24}
                                        r="12"
                                        fill={color}
                                        stroke="black"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={node.x + 24}
                                        y={node.y - 20}
                                        textAnchor="middle"
                                        fill="black"
                                        fontSize="10"
                                        fontWeight="700"
                                    >
                                        C{node.cluster_index}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            {/* Inspector Panel (Right) */}
            {selectedNode && (
                <div className="absolute right-4 top-20 w-80 bg-zinc-900/95 border border-white/10 rounded-xl p-4 z-40 backdrop-blur-sm">
                    <h3 className="text-white font-medium mb-2">Node Selecionado</h3>
                    <div className="text-xs text-zinc-400 space-y-1">
                        <p>ID: {selectedNode}</p>
                        {(() => {
                            const node = nodes.find(n => n.id === selectedNode);
                            if (!node) return null;
                            return (
                                <>
                                    <p>Cluster: {node.cluster_index}</p>
                                    <p>Outlier: {node.is_outlier ? 'Sim' : 'Não'}</p>
                                    <p>Posição: ({node.x.toFixed(0)}, {node.y.toFixed(0)})</p>
                                </>
                            );
                        })()}
                    </div>
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="mt-4 w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            )}
        </div>
    );
}
