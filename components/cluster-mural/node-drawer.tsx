import { X, Copy, MapPin, Activity, Layers, Network, maximize, Maximize2, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NodeDrawerProps {
    node: any; // Using any for flexibility with the new payload shape
    cluster: any;
    edges: any[];
    onClose: () => void;
    onCenterNode?: (x: number, y: number) => void;
    onToggleConnections?: (show: boolean) => void;
    showConnections?: boolean;
}

export function NodeDrawer({ 
    node, 
    cluster, 
    edges, 
    onClose, 
    onCenterNode,
    onToggleConnections,
    showConnections = false
}: NodeDrawerProps) {
    const [copied, setCopied] = useState(false);

    if (!node) return null;

    // Destructure Node Data
    // Expecting the shape defined in the prompt
    const { 
        id, 
        image, 
        description_ai, 
        signals, 
        ingestion 
    } = node;

    const shortId = id.slice(0, 8);

    const handleCopyId = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="absolute right-0 top-0 h-full w-[420px] bg-zinc-950 border-l border-white/10 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
            {/* 1. Header & Image */}
            <div className="relative group min-h-[300px] bg-zinc-900 overflow-hidden">
                {image?.full_url ? (
                    <img 
                        src={image.full_url} 
                        alt="Reference" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        No Image
                    </div>
                )}
                
                {/* Overlay Header Actions */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-black/50 backdrop-blur px-2 py-1 rounded text-zinc-400 border border-white/10">
                            {shortId}
                        </span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-zinc-400 hover:text-white"
                            onClick={handleCopyId}
                        >
                            <Copy className="w-3 h-3" />
                        </Button>
                        {copied && <span className="text-[10px] text-lime-400 animate-in fade-in">Copiado</span>}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose}
                        className="text-white bg-black/20 hover:bg-black/40"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Origin Badge */}
                {ingestion && (
                    <div className="absolute bottom-4 left-4">
                         <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-300 bg-black/60 backdrop-blur px-2 py-1 rounded-full border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                            {ingestion.scan_name || "Varredura Desconhecida"}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Description */}
                <section>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Descrição da Peça
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        {description_ai || (
                            <span className="text-zinc-500 italic">
                                Sem descrição ainda. Esta referência pode ser descrita na etapa de Sinais.
                            </span>
                        )}
                    </p>
                </section>

                {/* Signals */}
                <section className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        <Layers className="w-3 h-3" />
                        Sinais (Frequências)
                    </h4>
                    
                    <div className="space-y-3">
                        <SignalGroup label="Estado" color="text-red-400" signals={signals?.state} />
                        <SignalGroup label="Matéria" color="text-amber-400" signals={signals?.matter} />
                        <SignalGroup label="Movimento" color="text-blue-400" signals={signals?.movement} />
                    </div>
                </section>

                {/* Cluster Context */}
                {cluster && (
                    <section className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            <MapPin className="w-3 h-3" />
                            No Cluster
                        </h4>
                        
                        <div>
                            <div className="text-lg text-white font-light">{cluster.label || cluster.name_suggested}</div>
                            <div className="text-xs text-lime-400 font-mono mt-1">
                                {cluster.status} · Força Cognitiva {(cluster.strengthScore * 100).toFixed(0)}%
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-2 border-white/10 bg-black/20 hover:bg-white/5" onClick={() => onCenterNode?.(node.position?.x, node.position?.y)}>
                                <Crosshair className="w-3 h-3" />
                                Centralizar
                            </Button>
                            
                            <Button 
                                variant={showConnections ? "default" : "outline"} 
                                size="sm" 
                                className={`h-8 text-xs gap-2 border-white/10 ${showConnections ? 'bg-lime-500/20 text-lime-400 hover:bg-lime-500/30' : 'bg-black/20 hover:bg-white/5'}`}
                                onClick={() => onToggleConnections?.(!showConnections)}
                            >
                                <Network className="w-3 h-3" />
                                {showConnections ? 'Ocultar Conexões' : 'Ver Conexões'}
                            </Button>
                        </div>
                    </section>
                )}

                {/* Edges List (Visible only if toggle ON) */}
                {showConnections && edges.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                            Conexões Ativas ({edges.length})
                        </h4>
                        <div className="space-y-2">
                            {edges.map((edge, idx) => (
                                <div key={idx} className="p-3 rounded bg-zinc-900 border border-white/5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-mono text-zinc-400">Peso {(edge.weight * 100).toFixed(0)}%</span>
                                        <div className="flex gap-1">
                                            {/* Layers indicators */}
                                            {edge.layers?.map((l: string) => (
                                                <div key={l} className="w-1.5 h-1.5 rounded-full bg-zinc-600" title={l} />
                                            ))}
                                        </div>
                                    </div>
                                    {edge.shared_signals && Object.keys(edge.shared_signals).length > 0 && (
                                        <div className="text-[10px] text-zinc-500">
                                            Compartilha: {Object.values(edge.shared_signals).flat().join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function SignalGroup({ label, color, signals }: { label: string, color: string, signals?: string[] }) {
    if (!signals || signals.length === 0) return null;
    return (
        <div className="flex items-baseline gap-2">
            <span className={`text-[10px] w-14 font-medium uppercase tracking-wider ${color} opacity-80`}>{label}</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
                {signals.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-xs text-zinc-300">
                        {s}
                    </span>
                ))}
            </div>
        </div>
    );
}
