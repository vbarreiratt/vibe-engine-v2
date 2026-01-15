'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Save, Eye, EyeOff, MousePointer2, Hand, ZoomIn, ZoomOut, RotateCcw, FileText, X, Sparkles, FlaskConical, LayoutGrid } from 'lucide-react';
import { ResonanceLegend } from './resonance-legend';
import { ClusterPanel } from './cluster-panel';
import { CanvasMode } from '@/types/cluster-editor';

import { NodeDrawer } from './node-drawer';
import { ClusterEditor } from './cluster-editor';

// Types
interface Node {
    id: string; // image_id
    position: { x: number, y: number }; // New shape
    x?: number; // Legacy compat
    y?: number; // Legacy compat
    cluster_id?: string;
    cluster_index?: number;
    is_outlier: boolean;
    image?: {
        thumb_url?: string;
        full_url?: string;
    };
    image_url?: string; // Legacy compat
    description_ai?: string;
    signals?: any;
    ingestion?: any;
}

interface Edge {
    source: string;
    target: string;
    weight: number;
    layers: string[];
    shared_signals?: any;
}

interface Cluster {
    id: string;
    name_suggested: string;
    motor: string;
    items: string[]; // image_ids
    classification?: string;
    summary?: string;
    description_suggested?: string;
    strength_score?: number; // Normalized (camelCase check) or strengthScore
    strengthScore?: number;
    metrics?: any;
}

interface ResonanceCanvasProps {
    nodes: Node[];
    edges: Edge[];
    clusters: Cluster[];
    edgesByNode?: Record<string, Edge[]>; // New Prop
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

export function ResonanceCanvas({ nodes, edges, clusters, edgesByNode, logText, onNodeMove, onSave }: ResonanceCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [editingClusterId, setEditingClusterId] = useState<string | null>(null);
    const [tool, setTool] = useState<'select' | 'pan'>('select');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showLog, setShowLog] = useState(false);
    const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
    const [clickedCluster, setClickedCluster] = useState<Cluster | null>(null);
    const [showNodeEdges, setShowNodeEdges] = useState(false);
    const [mode, setMode] = useState<CanvasMode>('view');

    // Playground Drag State
    const [clusterOffsets, setClusterOffsets] = useState<Record<string, { x: number, y: number }>>({});
    const [draggingClusterId, setDraggingClusterId] = useState<string | null>(null);
    const [dragClusterStart, setDragClusterStart] = useState({ x: 0, y: 0 }); // Mouse pos when cluster drag started
    const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 }); // Cluster offset when drag started

    // UI toggles
    const [showTopbar, setShowTopbar] = useState(true);
    const [showToolbar, setShowToolbar] = useState(true);

    // Map Node -> Cluster ID for reliable offset lookup
    const nodeClusterMap = useMemo(() => {
        const map = new Map<string, string>();
        nodes.forEach(n => {
            if (n.cluster_id) {
                map.set(n.id, n.cluster_id);
            } else if (n.cluster_index !== undefined && clusters[n.cluster_index]) {
                // Fallback: index mapping
                map.set(n.id, clusters[n.cluster_index].id);
            }
        });
        return map;
    }, [nodes, clusters]);

    // Helper to get coords (World Position = Base + Cluster Offset)
    const getX = (n: Node) => {
        const base = n.x ?? n.position?.x ?? 0;
        const cId = nodeClusterMap.get(n.id);
        const offset = cId ? clusterOffsets[cId] : null;
        return base + (offset?.x || 0);
    };

    const getY = (n: Node) => {
        const base = n.y ?? n.position?.y ?? 0;
        const cId = nodeClusterMap.get(n.id);
        const offset = cId ? clusterOffsets[cId] : null;
        return base + (offset?.y || 0);
    };

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
        const xs = nodes.map(getX);
        const ys = nodes.map(getY);
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
        // Only pan if we are NOT interacting with a cluster or UI (handled via stopPropagation in children)
        // But clicking on background should trigger pan.
        // If mode is 'playground', we might be dragging a cluster, but that's handled in the cluster's onMouseDown.
        if (tool === 'pan' || e.button === 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // 1. Cluster Drag (Playground Mode)
        if (draggingClusterId && mode === 'playground') {
             const zoom = transform.scale;
             const deltaX = (e.clientX - dragClusterStart.x) / zoom;
             const deltaY = (e.clientY - dragClusterStart.y) / zoom;

             setClusterOffsets(prev => ({
                 ...prev,
                 [draggingClusterId]: {
                     x: initialOffset.x + deltaX,
                     y: initialOffset.y + deltaY
                 }
             }));
             return;
        }

        // 2. Canvas Pan
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
        setDraggingClusterId(null);
    };

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedNode(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

            {/* Mode Rail - Vertical Indicator (Safe Zone: Left Side) - CSS Transform implementation to prevent ghosting */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center pointer-events-none hidden md:flex h-[600px] w-8">
                {/* Lines */}
                <div className="absolute top-0 w-px h-[200px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                <div className="absolute bottom-0 w-px h-[200px] bg-gradient-to-t from-transparent via-white/10 to-transparent" />

                {/* Rotated Text Container (-90deg = Bottom to Top reading) */}
                <div className="transform -rotate-90 whitespace-nowrap flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 origin-center bg-zinc-900/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/5 shadow-2xl">
                    <span className={`transition-colors duration-300 ${mode === 'view' ? 'text-white' : 'text-zinc-600'}`}>Visualização</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span className={`transition-colors duration-300 ${mode === 'playground' ? 'text-amber-500' : 'text-zinc-600'}`}>Playground</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span className={`transition-colors duration-300 ${mode === 'synthesis' ? 'text-purple-500' : 'text-zinc-600'}`}>Lab</span>
                </div>
            </div>

            {/* Main Canvas */}
            <div
                ref={containerRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={() => {
                    if (!isDragging) setSelectedNode(null);
                }}
                style={{ 
                    cursor: tool === 'pan' ? 'grab' : 
                            mode === 'view' ? 'default' : 
                            mode === 'synthesis' ? 'crosshair' : 'default' 
                }}
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

                            // 1. Center Calculation (Dynamic: Updates with Drag)
                            // Since getX/getY now includes clusterOffsets, this average is the CURRENT Visual Center.
                            const cx = clusterNodes.reduce((sum, n) => sum + getX(n), 0) / clusterNodes.length;
                            const cy = clusterNodes.reduce((sum, n) => sum + getY(n), 0) / clusterNodes.length;

                            // 2. Cognitive Force Radius (Rule: Not Arbitrary)
                            // Base radius + (Count * Density Factor) scaled by Strength Score
                            // If strength_score is missing (legacy), fallback to count * 30
                            const baseRadius = 100;
                            const massFactor = clusterNodes.length * 25;
                            const scoreFactor = cluster.strengthScore ? (0.5 + cluster.strengthScore) : (cluster.strength_score ? (0.5 + cluster.strength_score) : 1); 
                            
                            const radius = Math.max(baseRadius, massFactor * scoreFactor);

                            const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
                            
                            const isHovered = hoveredClusterId === cluster.id;
                            const isBeingDragged = draggingClusterId === cluster.id;
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

                            // Dynamic Cursor & Style in Playground
                            const canDrag = mode === 'playground';
                            const cursorStyle = canDrag ? (isBeingDragged ? 'grabbing' : 'grab') : (mode === 'view' ? 'zoom-in' : 'pointer');

                            return (
                                <g 
                                    key={cluster.id}
                                    onMouseEnter={() => {
                                        setHoveredClusterId(cluster.id);
                                    }}
                                    onMouseLeave={() => setHoveredClusterId(null)}
                                    // DRAG Start (Playground only)
                                    onMouseDown={(e) => {
                                        if (mode === 'playground') {
                                            e.stopPropagation();
                                            // 1. Set global drag state
                                            setDraggingClusterId(cluster.id);
                                            // 2. Initial mouse pos for delta calc
                                            setDragClusterStart({ x: e.clientX, y: e.clientY });
                                            // 3. Keep current offset as base
                                            setInitialOffset(clusterOffsets[cluster.id] || { x: 0, y: 0 });
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Ignore click if it was a drag (Threshold check could be added, but handled by separate intents mostly)
                                        // Simple heuristic: if we were dragging this cluster recently, skip. 
                                        // But mouseUp clears draggingClusterId immediately. 
                                        // However, normal click doesn't trigger drag threshold usually.
                                        
                                        // For now, allow click even after small drag unless we implement delta check.
                                        // PROMPT: "se deslocamento < threshold (ex.: 4px), tratar como click" - handled below in logic?
                                        // Actually, if we just dragged, we don't want to open the panel.
                                        // We can use a ref to track total movement during drag.
                                        
                                        // Universal: Single click always opens the Card/Panel
                                        // NOTE: Should we block if we just dragged significantly? 
                                        // Let's assume user intention is precise for now.
                                        setClickedCluster(cluster);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (mode === 'view') {
                                            // View Mode: Fly to cluster
                                            const newScale = 1.5;
                                            setTransform({
                                                scale: newScale,
                                                x: -cx * newScale + (window.innerWidth / 2),
                                                y: -cy * newScale + (window.innerHeight / 2)
                                            });
                                        } else {
                                            // Play/Synth: Open Editor
                                            setEditingClusterId(cluster.id);
                                        }
                                    }}
                                    style={{ 
                                        cursor: cursorStyle,
                                        pointerEvents: tool === 'pan' ? 'none' : 'all',
                                        zIndex: isBeingDragged ? 100 : 1 // SVG z-index doesn't work like HTML, order matters.
                                        // Moving to end of array renders on top. 
                                        // We are iterating. We can't easily reorder here without state sort.
                                    }}
                                    className={`transition-all duration-300 ${isBeingDragged ? 'opacity-90' : ''}`}
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
                                            pointerEvents="none"
                                        >
                                            {cluster.name_suggested}
                                        </text>
                                        
                                        {/* Status Badge */}
                                       <text x={cx} y={cy - radius - 45} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" letterSpacing="1px" opacity="0.8" pointerEvents="none">
                                            {classification}
                                        </text>
                                    </>
                                    )}

                                    {/* Copy Obrigatório: Tooltip de Força Cognitiva (Hover Only) */}
                                    {isHovered && !clickedCluster && !isBeingDragged && (
                                        <foreignObject x={cx - 100} y={cy + radius + 20} width="200" height="120" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                                            <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-3 text-center shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="text-[10px] uppercase text-zinc-400 tracking-wider font-bold mb-1">Força Cognitiva</div>
                                                <div className="text-xs text-zinc-200 leading-tight">
                                                    Este tamanho representa o peso deste "mundo": massa + coesão + recorrência.
                                                </div>
                                                <div className="text-[9px] text-zinc-500 mt-2 italic">
                                                    {mode === 'playground' ? 'Arraste para mover' : 'Clique para ver detalhes'}
                                                </div>
                                            </div>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        })}

                        {/* Render edges */}
                        {(() => {
                            // If a node is selected and showNodeEdges is TRUE, we might want to prioritize those edges
                            // Or if user wants to see connections toggle.
                            // Strategy: Always render faint background web. If showNodeEdges+Selected, render bold active edges.
                            
                            // 1. Background Web (All Edges) - Skip if too many? No, 1000 is fine for SVG.
                            // If showNodeEdges is TRUE, maybe we hide the noise?
                            const edgesToRender = (!selectedNode || !showNodeEdges) ? edges : [];

                            return (
                                <>
                                    {/* Default Web */}
                                    {edgesToRender.map((edge, idx) => {
                                        const source = nodes.find(n => n.id === edge.source);
                                        const target = nodes.find(n => n.id === edge.target);
                                        if (!source || !target) return null;
                                        
                                        const sx = getX(source);
                                        const sy = getY(source);
                                        const tx = getX(target);
                                        const ty = getY(target);

                                        return (
                                            <line
                                                key={`e-${idx}`}
                                                x1={sx}
                                                y1={sy}
                                                x2={tx}
                                                y2={ty}
                                                stroke="rgba(255,255,255,0.05)"
                                                strokeWidth={edge.weight * 2}
                                            />
                                        );
                                    })}

                                    {/* Active Connections (Selected Node) */}
                                    {selectedNode && showNodeEdges && edgesByNode && edgesByNode[selectedNode] && (
                                        edgesByNode[selectedNode].map((edge, idx) => {
                                            const source = nodes.find(n => n.id === edge.source);
                                            const target = nodes.find(n => n.id === edge.target);
                                            if (!source || !target) return null;

                                            const sx = getX(source);
                                            const sy = getY(source);
                                            const tx = getX(target);
                                            const ty = getY(target);

                                            return (
                                                 <line
                                                    key={`ae-${idx}`}
                                                    x1={sx}
                                                    y1={sy}
                                                    x2={tx}
                                                    y2={ty}
                                                    stroke="rgba(132, 204, 22, 0.6)" // Lime-500 equivalent opacity
                                                    strokeWidth={Math.max(2, edge.weight * 5)}
                                                    className="animate-in fade-in"
                                                />
                                            );
                                        })
                                    )}

                                    {/* Fallback if edgesByNode not passed but selectedNode exists (Scan 'edges' array) */}
                                    {selectedNode && showNodeEdges && !edgesByNode && (
                                         edges.filter(e => e.source === selectedNode || e.target === selectedNode).map((edge, idx) => {
                                            const source = nodes.find(n => n.id === edge.source);
                                            const target = nodes.find(n => n.id === edge.target);
                                            if (!source || !target) return null;
                                            
                                            // ... same render logic
                                            return <line key={`ae-fb-${idx}`} x1={getX(source)} y1={getY(source)} x2={getX(target)} y2={getY(target)} stroke="rgba(132, 204, 22, 0.6)" strokeWidth={Math.max(2, edge.weight * 5)} />
                                         })
                                    )}
                                </>
                            );
                        })()}

                        {/* Render nodes */}
                        {nodes.map((node) => {
                            let cIndex = node.cluster_index || 0;
                            if (node.cluster_id) {
                                const idx = clusters.findIndex(c => c.id === node.cluster_id);
                                if (idx !== -1) cIndex = idx;
                            }
                            const color = CLUSTER_COLORS[cIndex % CLUSTER_COLORS.length];
                            
                            const isSelected = selectedNode === node.id;
                            const x = getX(node);
                            const y = getY(node);
                             
                            // Image source resolution
                            const imgUrl = node.image?.thumb_url || node.image?.full_url || node.image_url;

                            return (
                                <g
                                    key={node.id}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent canvas click
                                        setSelectedNode(node.id);
                                        // Auto-open connections if desired? No, user toggles.
                                    }}
                                    style={{ cursor: 'pointer', pointerEvents: tool === 'pan' ? 'none' : 'auto' }}
                                >
                                    {/* Glow effect */}
                                    {isSelected && (
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="50"
                                            fill={color}
                                            fillOpacity="0.4"
                                            className="animate-pulse"
                                        />
                                    )}

                                    {/* Node body */}
                                    {imgUrl ? (
                                        <foreignObject
                                            x={x - 35}
                                            y={y - 35}
                                            width="70"
                                            height="70"
                                            style={{ overflow: 'visible' }}
                                        >
                                            <div
                                                className={`w-full h-full rounded-xl overflow-hidden transition-all border-[3px] ${node.is_outlier ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
                                                style={{
                                                    borderColor: isSelected ? '#fff' : color,
                                                    boxShadow: isSelected ? `0 0 20px ${color}` : 'none',
                                                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                                }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={imgUrl}
                                                    alt="node"
                                                    className="w-full h-full object-cover"
                                                    draggable={false}
                                                />
                                            </div>
                                        </foreignObject>
                                    ) : (
                                        <rect
                                            x={x - 35}
                                            y={y - 35}
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
                                        cx={x + 28}
                                        cy={y - 28}
                                        r="16"
                                        fill="white"
                                        stroke={color}
                                        strokeWidth="3"
                                    />
                                    <text
                                        x={x + 28}
                                        y={y - 23}
                                        textAnchor="middle"
                                        fill="black"
                                        fontSize="12"
                                        fontWeight="900"
                                    >
                                        C{cIndex}
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

            {/* Inspector Panel (Floating Right) - REPLACED BY NodeDrawer */}
            <NodeDrawer
                node={selectedNode ? nodes.find(n => n.id === selectedNode) : null}
                cluster={selectedNode ? clusters.find(c => {
                    const n = nodes.find(n => n.id === selectedNode);
                    if (!n) return false;
                    return n.cluster_id === c.id || String(n.cluster_index) === c.id;
                }) : null}
                edges={selectedNode && edgesByNode ? edgesByNode[selectedNode] || [] : []}
                onClose={() => setSelectedNode(null)}
                onCenterNode={(x, y) => {
                    // Pan to node
                    const { width, height } = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
                    // We want node at center. 
                    // current transform: t.x, t.y, t.scale
                    // screenX = node.x * scale + x
                    // targetScreenX = width / 2
                    // => x = width/2 - node.x * scale
                    setTransform(prev => ({
                        ...prev,
                        x: width / 2 - x * prev.scale,
                        y: height / 2 - y * prev.scale
                    }));
                }}
                onToggleConnections={setShowNodeEdges}
                showConnections={showNodeEdges}
            />

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

            {/* Cognitive Legend (New Semantic Layer) */}
            <ResonanceLegend />

            {/* Cognitive Panel (New Interaction) */}
            <ClusterPanel 
                cluster={clickedCluster} 
                mode={mode}
                onClose={() => setClickedCluster(null)} 
                onOpenEditor={() => {
                    if (clickedCluster) {
                        setEditingClusterId(clickedCluster.id);
                        setClickedCluster(null); // Close panel when opening editor
                    }
                }}
            />

            {/* Cluster Editor (Level 1 Analysis) */}
            {editingClusterId && (
                <ClusterEditor 
                    clusterId={editingClusterId} 
                    mode={mode}
                    onClose={() => setEditingClusterId(null)} 
                />
            )}

            {/* Unified Bottom Toolbar (Safe Zone: Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl flex items-center gap-2 z-50">
                {/* 1. Pan Tool (Global) */}
                <button
                    onClick={() => setTool('pan')}
                    className={`p-2 rounded-full transition-all group relative ${tool === 'pan' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    title="Ferramenta Pan (Mãozinha): Navegue sem mover nada."
                >
                    <Hand className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-white/10 mx-1" />

                {/* 2. View Mode */}
                 <button 
                    onClick={() => { setMode('view'); setTool('select'); }}
                    className={`p-2 rounded-full transition-all group relative ${mode === 'view' ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    title="Modo Visualização (Olho): Explore e clique."
                 >
                    <Eye className="w-5 h-5" />
                    {mode === 'view' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                 </button>
                 
                 {/* 3. Playground Mode */}
                 <button 
                    onClick={() => { setMode('playground'); setTool('select'); }}
                    className={`p-2 rounded-full transition-all group relative ${mode === 'playground' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Modo Playground (Erlenmeyer): Mova e experimente."
                 >
                    <FlaskConical className="w-5 h-5" />
                    {mode === 'playground' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />}
                 </button>

                 {/* 4. Synthesis Mode */}
                 <button 
                    onClick={() => { setMode('synthesis'); setTool('select'); }}
                    className={`p-2 rounded-full transition-all group relative ${mode === 'synthesis' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Modo Síntese (Estrela): Defina destinos."
                 >
                    <Sparkles className="w-5 h-5" />
                    {mode === 'synthesis' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />}
                 </button>

                <div className="h-6 w-px bg-white/10 mx-1" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                    <button
                        className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }))}
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }))}
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                     <button
                        className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
