'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Maximize2, Minimize2, Move } from 'lucide-react';

interface NodeRef {
    id: string;
    x: number;
    y: number;
    cluster_id: string | null;
    is_outlier: boolean;
    image_url?: string; // from join, passed down
    state?: string[];
}

interface ClusterRef {
    id: string;
    name: string;
    motor: string;
    x?: number; // Calculated center
    y?: number;
}

interface MuralProps {
    nodes: NodeRef[];
    clusters: ClusterRef[];
    edges: any[];
    onNodeMove?: (id: string, x: number, y: number) => void;
    readOnly?: boolean;
}

export function ClusterMural({ nodes, clusters, edges, onNodeMove, readOnly = false }: MuralProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Node Dragging
    const [draggingNode, setDraggingNode] = useState<string | null>(null);

    // Zoom handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const s = Math.exp(-e.deltaY * 0.001);
            setScale(prev => Math.min(Math.max(0.1, prev * s), 5));
        } else {
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    // calculate cluster centers if not provided (they are virtual for now unless persisted)
    // For rendering, we can draw a hull or just label near centroid.

    // Normalize coordinates to center in view initially?
    // Assume implementation handles that or (0,0) is center.

    return (
        <div
            ref={containerRef}
            className="w-full h-[80vh] bg-neutral-900 overflow-hidden relative border border-neutral-800 rounded-xl"
            onWheel={handleWheel}
            onMouseDown={(e) => {
                if (e.target === containerRef.current) {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
                }
            }}
            onMouseMove={(e) => {
                if (isDragging) {
                    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                }
                // Handle node drag logic here (simplified)
            }}
            onMouseUp={() => {
                setIsDragging(false);
                setDraggingNode(null);
            }}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <motion.div
                className="absolute top-1/2 left-1/2 origin-center"
                style={{
                    x: offset.x,
                    y: offset.y,
                    scale: scale,
                }}
            >
                {/* Render Edges */}
                <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
                    {edges.map((e, i) => {
                        const source = nodes.find(n => n.id === e.source_image_id || n.id === e.source);
                        const target = nodes.find(n => n.id === e.target_image_id || n.id === e.target);
                        if (!source || !target) return null;

                        return (
                            <line
                                key={i}
                                x1={source.x * 10} // Scaling factor for vis
                                y1={source.y * 10}
                                x2={target.x * 10}
                                y2={target.y * 10}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={Math.max(0.5, e.weight * 2)}
                            />
                        );
                    })}
                </svg>

                {/* Render Nodes */}
                {nodes.map(node => (
                    <div
                        key={node.id}
                        className={cn(
                            "absolute w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-lime-500 hover:z-10 transition-colors flex items-center justify-center overflow-hidden group",
                            node.is_outlier && "opacity-50 grayscale"
                        )}
                        style={{
                            left: node.x * 10, // Scaling 
                            top: node.y * 10,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {node.image_url ? (
                            <img src={node.image_url} alt="" className="w-full h-full object-cover" draggable={false} />
                        ) : (
                            <ImageIcon className="w-4 h-4 text-neutral-500" />
                        )}

                        {/* Tooltip on Hover */}
                        <div className="hidden group-hover:block absolute bottom-full mb-2 bg-black text-xs text-white p-1 rounded whitespace-nowrap z-50 pointer-events-none">
                            {node.state?.slice(0, 2).join(', ')}
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={() => setScale(s => s * 1.2)} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 text-white"><Maximize2 size={16} /></button>
                <button onClick={() => setScale(s => s / 1.2)} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 text-white"><Minimize2 size={16} /></button>
            </div>

            <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-neutral-400 font-mono">
                Nodes: {nodes.length} | Clusters: {clusters.length}
            </div>
        </div>
    );
}
