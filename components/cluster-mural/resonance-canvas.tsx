'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, Eye, EyeOff, MousePointer2, Hand, ZoomIn, ZoomOut, RotateCcw, FileText, X } from 'lucide-react';

// Types
interface Node {
    id: string;
    x: number;
    y: number;
    cluster_id?: string;
    cluster_index?: number;
    is_outlier: boolean;
    image_url?: string;
    images?: { thumb_url: string }; 
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
    classification?: string;
    summary?: string;
    description_suggested?: string;
}

interface ResonanceCanvasProps {
    nodes: Node[];
    edges: Edge[];
    clusters: Cluster[];
    logText?: string;
    onNodeMove?: (nodeId: string, x: number, y: number) => void;
    onSave?: () => void;
}

// Paleta de cores VIBRANTES para clusters
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

export function ResonanceCanvas({ nodes, edges, clusters, logText, onNodeMove, onSave }: ResonanceCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [tool, setTool] = useState<'select' | 'pan'>('select');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showLog, setShowLog] = useState(false);
    const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);

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
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-zinc-900">
            {/* Floating Topbar */}
            <div
                className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showTopbar ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full px-6 py-2.5 shadow-2xl flex items-center gap-6">
                    <h1 className="text-white font-medium text-sm tracking-wide">Editor de Ressonância</h1>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex gap-4 text-xs font-mono text-zinc-400">
                        <span><strong className="text-white">{nodes.length}</strong> Nodes</span>
                        <span><strong className="text-white">{clusters.length}</strong> Clusters</span>
                    </div>
                </div>
            </div>

            {/* Floating Log Button */}
            {logText && (
                <button
                    onClick={() => setShowLog(true)}
                    className="absolute top-6 right-36 z-50 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-full shadow-lg transition-all flex items-center gap-2 text-sm border border-white/10"
                >
                    <FileText className="w-4 h-4" />
                    Ver Logs
                </button>
            )}

            {/* Floating Save Button */}
            <button
                onClick={onSave}
                className="absolute top-6 right-6 z-50 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-medium rounded-full shadow-lg transition-all flex items-center gap-2 text-sm"
            >
                <Save className="w-4 h-4" />
                Salvar
            </button>

            {/* Toggle Topbar Button */}
            <button
                onClick={() => setShowTopbar(!showTopbar)}
                className="absolute top-6 left-6 z-50 w-10 h-10 bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 rounded-full text-zinc-400 hover:text-white flex items-center justify-center transition-all shadow-lg"
                title="Toggle Info"
            >
                {showTopbar ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Bottom Center Floating Toolbar */}
            <div
                className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 transition-all duration-300 bg-zinc-900/90 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl ${showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
            >
                {/* 
                REMOVIDO POR ENQUANTO (Conforme solicitado)
                <button
                    onClick={() => setTool('select')}
                    className={`p-3 rounded-full transition-all ${tool === 'select'
                            ? 'bg-zinc-800 text-white shadow-inner'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    title="Selecionar"
                >
                    <MousePointer2 className="w-5 h-5" />
                </button> 
                */}
                
                <button
                    onClick={() => setTool('pan')}
                    className={`p-3 rounded-full transition-all ${tool === 'pan'
                            ? 'bg-white text-black shadow-lg'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    title="Pan/Mover (Padrão)"
                >
                    <Hand className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-white/10 mx-1" />

                <button
                    className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Zoom In"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.3, 3) }))}
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Zoom Out"
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.3, 0.1) }))}
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Resetar Vista"
                    onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
                >
                    <RotateCcw className="w-4 h-4" />
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
                             // Robust cluster matching (ID or Index)
                            const clusterNodes = nodes.filter(n => 
                                (n.cluster_id && n.cluster_id === cluster.id) || 
                                (!n.cluster_id && n.cluster_index !== undefined && String(n.cluster_index) === cluster.id)
                            );

                            if (clusterNodes.length === 0) return null;

                            const cx = clusterNodes.reduce((sum, n) => sum + n.x, 0) / clusterNodes.length;
                            const cy = clusterNodes.reduce((sum, n) => sum + n.y, 0) / clusterNodes.length;
                            const radius = Math.max(100, clusterNodes.length * 30);

                            const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
                            
                            const isHovered = hoveredClusterId === cluster.id;
                            const classification = cluster.classification || 'WEAK';
                            
                            // Visual Hierarchy
                            let opacity = 0.15;
                            let strokeDash = "5,5";
                            let strokeWidth = "2";
                            
                            if (classification === 'STRONG') {
                                opacity = 0.25;
                                strokeDash = "none";
                                strokeWidth = "4";
                            } else if (classification === 'NOISE') {
                                opacity = 0.05;
                                strokeDash = "2,2";
                                strokeWidth = "1";
                            }

                            return (
                                <g 
                                    key={cluster.id}
                                    onMouseEnter={() => setHoveredClusterId(cluster.id)}
                                    onMouseLeave={() => setHoveredClusterId(null)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Ilha do cluster (glow) */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={radius + (isHovered ? 30 : 20)}
                                        fill={color}
                                        fillOpacity={isHovered ? opacity * 1.5 : opacity}
                                        stroke="none"
                                        className="transition-all duration-300"
                                    />
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={radius + (isHovered ? 10 : 0)}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={strokeWidth}
                                        fillOpacity="0"
                                        strokeOpacity={classification === 'NOISE' ? 0.3 : 0.6}
                                        strokeDasharray={strokeDash}
                                        className="transition-all duration-300"
                                    />
                                    
                                    {/* Label - Semantic */}
                                    {(classification !== 'NOISE' || isHovered) && (
                                    <>
                                        <text
                                            x={cx}
                                            y={cy - radius - 20}
                                            textAnchor="middle"
                                            fill={color}
                                            fontSize={isHovered ? "22" : "18"}
                                            fontWeight="700"
                                            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                                        >
                                            {cluster.name_suggested}
                                        </text>
                                        
                                        {/* Status Badge */}
                                       <text x={cx} y={cy - radius - 45} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" letterSpacing="1px" opacity="0.8">
                                            {classification}
                                        </text>
                                    </>
                                    )}

                                    {/* Semantic Popover (ForeignObject) */}
                                    {isHovered && (
                                        <foreignObject x={cx - 140} y={cy - radius - 220} width="280" height="200" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                                            <div className="bg-zinc-950/90 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md text-white text-left scale-100 origin-bottom transition-all">
                                                <h4 className="font-bold text-lg mb-1" style={{color}}>{cluster.name_suggested}</h4>
                                                
                                                <div className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 mb-2 border-b border-white/5 pb-2 leading-snug">
                                                    {cluster.summary || 'Análise pendente'}
                                                </div>
                                                
                                                <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                                                    {cluster.description_suggested || 'Sem justificativa.'}
                                                </p>
                                                
                                                {/* Call to Action */}
                                                <div className={`text-[10px] px-2 py-1.5 rounded bg-white/5 border border-white/5`}>
                                                    <span className="text-purple-400 font-bold">➢ Ação: </span>
                                                    {classification === 'STRONG' && "Nomear, tensionar e consolidar."}
                                                    {classification === 'PROTO' && "Decidir: expandir ou fundir?"}
                                                    {classification === 'NOISE' && "Descartar ou manter referência."}
                                                    {classification === 'WEAK' && "Aguardar mais sinais."}
                                                </div>
                                            </div>
                                        </foreignObject>
                                    )}
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
                            let cIndex = node.cluster_index || 0;
                            if (node.cluster_id) {
                                const idx = clusters.findIndex(c => c.id === node.cluster_id);
                                if (idx !== -1) cIndex = idx;
                            }
                            const color = CLUSTER_COLORS[cIndex % CLUSTER_COLORS.length];
                            
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
                                    {node.image_url ? (
                                        <foreignObject
                                            x={node.x - 35}
                                            y={node.y - 35}
                                            width="70"
                                            height="70"
                                            style={{ overflow: 'visible' }}
                                        >
                                            <div
                                                className={`w-full h-full rounded-xl overflow-hidden transition-all border-[3px] ${node.is_outlier ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
                                                style={{
                                                    borderColor: isSelected ? '#fff' : color,
                                                    boxShadow: isSelected ? `0 0 20px ${color}` : 'none'
                                                }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={node.image_url}
                                                    alt="node"
                                                    className="w-full h-full object-cover"
                                                    draggable={false}
                                                />
                                            </div>
                                        </foreignObject>
                                    ) : (
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
                                    )}

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

            {/* Log Modal Overlay */}
            {showLog && logText && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-12">
                     <div className="bg-zinc-900 w-full max-w-4xl h-full max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-lime-400" />
                                Log Cognitivo
                            </h2>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => {
                                        const blob = new Blob([logText], { type: 'text/markdown' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'cluster_log_cognitivo.md';
                                        a.click();
                                    }}
                                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                                >
                                    Download MD
                                </button>
                                <button onClick={() => setShowLog(false)} className="text-white/60 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-8 bg-zinc-950/50 selection:bg-lime-500/30">
                            <pre className="text-zinc-300 text-sm font-mono whitespace-pre-wrap leading-relaxed max-w-3xl mx-auto">
                                {logText}
                            </pre>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
}
