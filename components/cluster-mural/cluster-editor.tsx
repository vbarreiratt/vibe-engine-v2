'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Activity, Layers, Play, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClusterEditorData, EditorSignal, EditorNode } from '@/types/cluster-editor';
import { getClusterEditorData, logClusterEditorAction } from '@/app/actions/cluster-editor';

interface ClusterEditorProps {
    clusterId: string;
    onClose: () => void;
}

export function ClusterEditor({ clusterId, onClose }: ClusterEditorProps) {
    const [data, setData] = useState<ClusterEditorData | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Local Simulation State
    const [disabledSignals, setDisabledSignals] = useState<Set<string>>(new Set());
    const [highlightedSignal, setHighlightedSignal] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const result = await getClusterEditorData(clusterId);
                if (mounted) setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [clusterId]);

    // Handle Simulation Logic
    const toggleSignal = async (term: string) => {
        const newDisabled = new Set(disabledSignals);
        const isDisabling = !newDisabled.has(term);

        if (isDisabling) {
            newDisabled.add(term);
        } else {
            newDisabled.delete(term);
        }
        
        setDisabledSignals(newDisabled);

        // Audit Log
        if (isDisabling) {
            await logClusterEditorAction(clusterId, 'deactivate_signal_simulation', { signal: term });
        }
    };

    // Calculate Simulated Metrics
    const simulatedState = useMemo(() => {
        if (!data) return null;

        const activeSignals = data.signals.filter(s => !disabledSignals.has(s.term));
        
        // Recalculate average recurrence considering only active signals
        const avgRecurrence = activeSignals.length > 0
            ? activeSignals.reduce((acc, s) => acc + s.recurrence, 0) / activeSignals.length
            : 0;

        // Classification Proxy
        let classification = data.metrics.classification;
        if (avgRecurrence < 0.3) classification = 'WEAK';
        if (avgRecurrence < 0.1) classification = 'NOISE';

        return {
            activeSignals,
            avgRecurrence,
            classification,
            drop: ((data.metrics.avgRecurrence - avgRecurrence) / data.metrics.avgRecurrence * 100).toFixed(0)
        };

    }, [data, disabledSignals]);

    if (loading) return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="flex flex-col items-center gap-3">
                <Activity className="w-8 h-8 text-lime-400 animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-zinc-500">Inspecionando Causalidade...</span>
            </div>
        </div>
    );

    if (!data || !simulatedState) return (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-900 p-8 rounded-xl border border-white/10 flex flex-col items-center gap-4 max-w-md text-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
                <h3 className="text-lg font-bold text-white">Falha na Inspeção</h3>
                <p className="text-sm text-zinc-400">Não foi possível recuperar os dados estruturais deste cluster. Ele pode estar obsoleto ou vazio.</p>
                <Button onClick={onClose} variant="secondary">Fechar</Button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[150] flex flex-col bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300">
            
            {/* HERADER */}
            <header className="flex h-16 items-center justify-between px-6 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-white tracking-wide">{data.label}</h2>
                        <span className="text-[10px] uppercase text-zinc-500 tracking-widest">
                            {data.metrics.nodeCount} Referências · {data.signals.length} Sinais
                        </span>
                    </div>
                    {/* Status Badge */}
                    <div className={cn(
                        "px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all duration-500",
                        simulatedState.classification === 'STRONG' ? "bg-lime-500/10 border-lime-500/30 text-lime-400" :
                        simulatedState.classification === 'PROTO' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                        "bg-red-500/10 border-red-500/30 text-red-400"
                    )}>
                        {simulatedState.classification}
                    </div>
                    {/* Simulation Warning */}
                    {disabledSignals.size > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-xs animate-pulse border border-blue-500/20">
                            <Activity className="w-3 h-3" />
                            Simulando queda de -{simulatedState.drop}%
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-white/10" onClick={onClose}>
                        <X className="w-5 h-5 text-zinc-400 block" />
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT - 3 PANELS */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* A) SIGNAL DNA LIST */}
                <aside className="w-[400px] border-r border-white/10 flex flex-col bg-black/20">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                         <span>DNA de Sinais</span>
                         <Layers className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-1">
                        {data.signals.map(signal => {
                            const isDisabled = disabledSignals.has(signal.term);
                            const isStruct = signal.role === 'structural';
                            
                            return (
                                <div 
                                    key={signal.term}
                                    onMouseEnter={() => setHighlightedSignal(signal.term)}
                                    onMouseLeave={() => setHighlightedSignal(null)}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-md transition-all cursor-pointer border",
                                        isDisabled 
                                            ? "bg-red-500/5 border-red-500/10 opacity-60 grayscale" 
                                            : "bg-zinc-900/50 hover:bg-zinc-800 border-transparent hover:border-white/10"
                                    )}
                                >
                                    {/* Toggle Switch (Simulated Checkbox) */}
                                    <button 
                                        onClick={() => toggleSignal(signal.term)}
                                        className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            isDisabled ? "border-red-500 bg-transparent" : "border-lime-500/50 bg-lime-500/10"
                                        )}
                                    >
                                        {!isDisabled && <div className="w-2 h-2 bg-lime-400 rounded-sm" />}
                                    </button>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={cn("text-sm font-medium", isDisabled ? "text-zinc-500 line-through" : "text-zinc-200")}>
                                                {signal.term}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                                isStruct ? "text-lime-400 bg-lime-400/10" : "text-zinc-500 bg-zinc-800"
                                            )}>
                                                {signal.role === 'structural' ? 'Pilastra' : 'Apoio'}
                                            </span>
                                        </div>
                                        
                                        {/* Frequency Bar */}
                                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden flex">
                                            <div 
                                                className={cn("h-full", 
                                                    signal.layer === 'state' ? 'bg-red-400' : 
                                                    signal.layer === 'matter' ? 'bg-amber-400' : 'bg-blue-400'
                                                )} 
                                                style={{ width: `${signal.recurrence * 100}%` }} 
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
                                            <span className="capitalize">{signal.layer}</span>
                                            <span>{(signal.recurrence * 100).toFixed(0)}% Recorrência</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* B) REFERENCE GRID */}
                <main className="flex-1 bg-zinc-950 p-6 overflow-y-auto scrollbar-hide">
                    <div className="flex items-center gap-2 mb-6 text-xs text-zinc-500">
                        <Activity className="w-4 h-4" />
                        <span>Referências que sustentam este cluster</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {data.nodes.map(node => {
                            const hasSignal = highlightedSignal ? node.signals.includes(highlightedSignal) : false;
                            const isDimmed = highlightedSignal && !hasSignal;

                            return (
                                <div 
                                    key={node.id} 
                                    className={cn(
                                        "relative aspect-square rounded-lg overflow-hidden border transition-all duration-300 group",
                                        hasSignal ? "ring-2 ring-lime-400 scale-105 z-10 border-transparent shadow-2xl" : "border-white/5",
                                        isDimmed ? "opacity-20 grayscale scale-95" : "hover:border-white/20"
                                    )}
                                >
                                    {node.url ? (
                                        <img src={node.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 text-xs">NO IMG</div>
                                    )}

                                    {/* Overlay Info */}
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="text-[10px] text-white/80 font-mono truncate">
                                            {node.id.slice(0,6)}...
                                        </div>
                                    </div>

                                    {/* Highlight Badge */}
                                    {hasSignal && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-lime-500 text-black text-[10px] font-bold rounded shadow-lg animate-in zoom-in">
                                            MATCH
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* C) METRICS PANEL */}
                <aside className="w-[300px] border-l border-white/10 bg-black/40 p-6 flex flex-col gap-6">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4">
                        Saúde do Cluster
                    </div>

                    {/* Metric 1: Density */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <ShieldCheck className="w-4 h-4" />
                            Estabilidade
                        </div>
                        <div className="text-2xl font-light text-white">
                            {(data.metrics.stability * 100).toFixed(0)}%
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-snug">
                            {data.metrics.stability > 0.7 ? "Cluster altamente coeso. Difícil de dissolver." : "Cluster frágil. Depende de poucos sinais."}
                        </p>
                    </div>

                    {/* Metric 2: Dominance */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Zap className="w-4 h-4" />
                            Camada Dominante
                        </div>
                        <div className="text-xl font-light text-white capitalize">
                            {data.metrics.dominantLayer}
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-snug">
                            A maior parte da gravidade deste cluster vem da camada de {data.metrics.dominantLayer}.
                        </p>
                    </div>

                     {/* Insights Box */}
                     <div className="mt-auto p-4 rounded bg-zinc-900/50 border border-white/5">
                        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-2">
                            <AlertTriangle className="w-3 h-3" />
                            Insight Metodológico
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                            O Cluster Editor é uma ferramenta de inspeção. Para alterar este cluster permanentemente, refine os sinais na etapa de tagging ou altere os parâmetros de clusterização global.
                        </p>
                     </div>

                </aside>
            </div>
        </div>
    );
}
