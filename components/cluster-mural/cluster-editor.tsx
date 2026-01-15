'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Activity, Layers, Play, AlertTriangle, ShieldCheck, Zap, Lock, Unlock, Crown, Trash2, RotateCcw, Save, MoreHorizontal, Check, Flame, Plus, CloudFog, Ban, Undo2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClusterEditorData, EditorSignal, EditorNode, SignalRole, NodeCurationStatus } from '@/types/cluster-editor';
import { getClusterEditorData, logClusterEditorAction, setSignalRole, setNodeCuration } from '@/app/actions/cluster-editor';

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
    const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set()); // Formerly lockedSignals (Tension)
    const [activeMenuSignal, setActiveMenuSignal] = useState<string | null>(null); // For the 3-dots menu

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

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuSignal(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Handle Signal Toggle (Simulation) - Checkbox Logic
    const toggleSignalActive = (term: string) => {
        const newDisabled = new Set(disabledSignals);
        if (newDisabled.has(term)) newDisabled.delete(term);
        else newDisabled.add(term);
        setDisabledSignals(newDisabled);
    };

    // Handle Signal Selection (Level 3 - Tension) - Row Click
    const toggleSignalSelection = (term: string, multi: boolean) => {
        const newSelected = new Set(multi ? selectedSignals : []);
        if (newSelected.has(term)) newSelected.delete(term);
        else newSelected.add(term);
        setSelectedSignals(newSelected);
    };

    // Handle Semantic Role Update (Level 1)
    const handleSetRole = async (signal: EditorSignal, role: SignalRole) => {
        if (!data) return;

        // Optimistic Update
        const updatedSignals = data.signals.map(s => {
             // Enforce One Motor Per Layer rule locally
            if (role === 'structural' && s.layer === signal.layer && s.term !== signal.term && s.role === 'structural') {
                return { ...s, role: 'support' as SignalRole };
            }
            if (s.term === signal.term) {
                return { ...s, role };
            }
            return s;
        });

        setData({ ...data, signals: updatedSignals });
        await setSignalRole(clusterId, signal.term, role, signal.layer);
        setActiveMenuSignal(null); // Close menu
    };
    
    // Handle Node Curation (Level 2)
    const handleNodeCuration = async (nodeId: string, status: NodeCurationStatus) => {
        if (!data) return;
        
        // Optimistic
        const updatedNodes = data.nodes.map(n => n.nodeId === nodeId ? { ...n, curationStatus: status } : n);
        setData({ ...data, nodes: updatedNodes });

        await setNodeCuration(clusterId, nodeId, status);
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

    // Intersection Logic (Level 3)
    const intersectionNodes = useMemo(() => {
        if (!data || selectedSignals.size === 0) return null;
        
        const selectedTerms = Array.from(selectedSignals);
        
        // Find nodes that have ALL selected signals (Intersection)
        const intersection = data.nodes.filter(node => 
            selectedTerms.every(term => node.signals.includes(term))
        );
        
        // Find nodes that have SOME selected signals
        const partial = data.nodes.filter(node => 
            selectedTerms.some(term => node.signals.includes(term)) && !intersection.includes(node)
        );

        return { intersection, partial };
    }, [data, selectedSignals]);



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
                <aside className="w-[450px] border-r border-white/10 flex flex-col bg-black/20">
                     <div className="p-4 border-b border-white/5 flex flex-col gap-2">
                         <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                             <div className="flex items-center gap-2">
                                <span>DNA de Sinais</span>
                                {selectedSignals.size > 0 && <span className="text-lime-400">({selectedSignals.size})</span>}
                             </div>
                             <Layers className="w-4 h-4 ml-auto" />
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                            {selectedSignals.size > 0 
                                ? `Explorando intersecção de ${selectedSignals.size} vetores de força.` 
                                : "Os sinais são os vetores que sustentam este cluster."}
                        </p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-1 pb-20">
                        {data.signals.map(signal => {
                            const isDisabled = disabledSignals.has(signal.term);
                            const isSelected = selectedSignals.has(signal.term);
                            const role = signal.role;
                            const isMenuOpen = activeMenuSignal === signal.term;
                            
                            // "Locked" visual if role is 'structural' or manually set (we assume defined role = locked for now)
                            const isLocked = !!role; 

                            return (
                                <div 
                                    key={signal.term}
                                    onMouseEnter={() => setHighlightedSignal(signal.term)}
                                    onMouseLeave={() => setHighlightedSignal(null)}
                                    // Row click: Select for Tension (unless clicking interactive elements)
                                    onClick={(e) => {
                                        if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('.check-area')) {
                                            toggleSignalSelection(signal.term, e.metaKey || e.ctrlKey || true); // Always multi-select friendly or toggle
                                        }
                                    }}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-md transition-all cursor-pointer border relative",
                                        isSelected ? "bg-zinc-800 border-lime-500/30" : "border-transparent",
                                        isDisabled 
                                            ? "bg-red-500/5 border-red-500/10 opacity-60 grayscale" 
                                            : !isSelected && "bg-zinc-900/50 hover:bg-zinc-800 hover:border-white/10"
                                    )}
                                >
                                    {/* 1. Checkbox: Activate/Deactivate */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleSignalActive(signal.term); }}
                                        title="Desativar temporariamente este sinal para testar sua influência."
                                        className={cn(
                                            "check-area w-5 h-5 rounded border flex items-center justify-center transition-colors z-20 shrink-0",
                                            isDisabled 
                                                ? "border-zinc-700 bg-transparent text-transparent" 
                                                : "border-lime-500/50 bg-lime-500/10 text-lime-400 hover:bg-lime-500/20"
                                        )}
                                    >
                                        {!isDisabled && <Check className="w-3 h-3" />}
                                    </button>

                                    {/* 2. Content */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1 z-10">
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-sm font-medium truncate", isDisabled ? "text-zinc-500 line-through" : "text-zinc-200")}>
                                                {signal.term}
                                            </span>
                                            
                                            {/* Role Badge (if set) */}
                                            {role && (
                                                <div className={cn("text-[8px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
                                                    role === 'structural' ? "bg-lime-400/10 text-lime-400 border border-lime-400/20" :
                                                    role === 'support' ? "bg-blue-400/10 text-blue-400 border border-blue-400/20" :
                                                    "bg-red-400/10 text-red-400 border border-red-400/20"
                                                )}>
                                                    {role === 'structural' && <Flame className="w-2 h-2" />}
                                                    {role === 'support' && <Plus className="w-2 h-2" />}
                                                    {role === 'noise' && <Ban className="w-2 h-2" />}
                                                    {role === 'structural' ? 'Motor' : role === 'support' ? 'Apoio' : 'Ruído'}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Frequency Bar */}
                                        <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                            <div 
                                                className={cn("h-full transition-all", 
                                                    signal.layer === 'state' ? 'bg-red-400' : 
                                                    signal.layer === 'matter' ? 'bg-amber-400' : 'bg-blue-400'
                                                )} 
                                                style={{ width: `${signal.recurrence * 100}%` }} 
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Lock Icon (Indicator) */}
                                    <div className="shrink-0 w-4 flex justify-center">
                                       {isLocked && (
                                           <Lock 
                                              className="w-3 h-3 text-zinc-600" 
                                              title="Sinal travado como decisão humana."
                                           />
                                       )}
                                    </div>

                                    {/* 4. Menu Trigger */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveMenuSignal(isMenuOpen ? null : signal.term); }}
                                        className={cn("p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors z-20", isMenuOpen && "bg-white/10 text-white")}
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {/* 5. Dropdown Menu */}
                                    {isMenuOpen && (
                                        <div className="absolute right-2 top-10 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 flex flex-col p-1 animate-in fade-in zoom-in-95 overflow-hidden">
                                           <div className="px-2 py-1.5 bg-black/20 text-[10px] text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
                                               Definir Papel
                                           </div>
                                           
                                           <button onClick={() => handleSetRole(signal, 'structural')} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left">
                                               <Flame className="w-3 h-3 text-lime-400" />
                                               <span>Tornar Motor</span>
                                           </button>
                                           <button onClick={() => handleSetRole(signal, 'support')} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left">
                                               <Plus className="w-3 h-3 text-blue-400" />
                                               <span>Tornar Apoio</span>
                                           </button>
                                           <button onClick={() => handleSetRole(signal, 'noise')} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left">
                                               <CloudFog className="w-3 h-3 text-red-400" />
                                               <span>Marcar como Ruído</span>
                                           </button>
                                           
                                           <div className="h-px bg-white/5 my-1" />
                                           
                                           <button onClick={() => { setHighlightedSignal(signal.term); setActiveMenuSignal(null); }} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left">
                                               <Eye className="w-3 h-3 text-zinc-500" />
                                               <span>Ver impacto visual</span>
                                           </button>

                                           {/* Reset / Unlock */}
                                           {role && (
                                               <button onClick={() => handleSetRole(signal, null as any)} className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded text-left mt-1">
                                                   <Undo2 className="w-3 h-3" />
                                                   <span>Resetar papel</span>
                                               </button>
                                           )}
                                        </div>
                                    )}

                                    {/* Background Role Hint */}
                                    {role === 'structural' && !isDisabled && (
                                        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* CURATION MODE FOOTER */}
                    <div className="p-4 border-t border-white/10 bg-zinc-900/30 backdrop-blur-sm mt-auto">
                         <div className="flex items-center gap-2 mb-1.5 text-lime-400 text-[10px] font-bold uppercase tracking-widest">
                            <Save className="w-3 h-3" />
                            Modo de Curadoria Ativo
                        </div>
                        <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
                            Você está interpretando o cluster. Suas decisões não alteram o motor, apenas a leitura.
                        </p>
                        <Button onClick={onClose} size="sm" className="w-full text-xs h-8 bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-white">
                            Encerrar e Salvar
                        </Button>
                    </div>
                </aside>


                {/* B) REFERENCE GRID (Level 2 & 3) */}
                <main className="flex-1 bg-zinc-950 p-6 overflow-y-auto scrollbar-hide relative">
                    
                    {/* Header Context */}
                    <div className="flex items-center justify-between mb-6 sticky top-0 z-20 bg-zinc-950/80 backdrop-blur pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Activity className="w-4 h-4" />
                            <span>
                                {selectedSignals.size > 0 
                                    ? `Mostrando ${intersectionNodes?.intersection.length} imagens em tensão`
                                    : "Todas as referências"
                                }
                            </span>
                        </div>
                        {selectedSignals.size > 1 && (
                            <div className="px-2 py-1 bg-lime-500/10 text-lime-400 text-xs rounded border border-lime-500/20 flex gap-2 items-center">
                                <Zap className="w-3 h-3" />
                                Tensão Estrutural Detectada
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {data.nodes.map(node => {
                            // Filter Logic
                            const isHoverMatch = highlightedSignal ? node.signals.includes(highlightedSignal) : false;
                            
                            let isDimmed = false;
                            let isHighlighted = false;

                           if (selectedSignals.size > 0 && intersectionNodes) {
                                // In Locked Mode
                                const isIntersection = intersectionNodes.intersection.includes(node);
                                isHighlighted = isIntersection;
                                isDimmed = !isIntersection; // Dim everything else
                                
                                // Specific Case: Highlighting active Hover even in locked mode
                                if (highlightedSignal && node.signals.includes(highlightedSignal)) {
                                    isDimmed = false; // Undim if matches hover
                                }
                           } else {
                                // In Locked Mode
                                const isIntersection = intersectionNodes.intersection.includes(node);
                                isHighlighted = isIntersection;
                                isDimmed = !isIntersection; // Dim everything else
                                
                                // Specific Case: Highlighting active Hover even in locked mode
                                if (highlightedSignal && node.signals.includes(highlightedSignal)) {
                                    isDimmed = false; // Undim if matches hover
                                }
                           } else {
                                // Normal Mode
                                isHighlighted = isHoverMatch;
                                isDimmed = highlightedSignal && !isHoverMatch ? true : false;
                           }
                           
                           // Curation State
                           if (node.curationStatus === 'removed') isDimmed = true;
                           
                            return (
                                <div 
                                    key={node.id} 
                                    className={cn(
                                        "relative aspect-square rounded-lg overflow-hidden border transition-all duration-300 group",
                                        isHighlighted ? "ring-2 ring-lime-400 scale-105 z-10 border-transparent shadow-2xl" : "border-white/5",
                                        isDimmed ? "opacity-20 grayscale scale-95" : "hover:border-white/20",
                                        node.curationStatus === 'pillar' && "ring-1 ring-amber-400"
                                    )}
                                >
                                    {node.url ? (
                                        <img src={node.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 text-xs">NO IMG</div>
                                    )}

                                    {/* Curation Overlays (Level 2) - Visible on Group Hover */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleNodeCuration(node.nodeId, node.curationStatus === 'pillar' ? 'active' : 'pillar'); }}
                                            className={cn("p-1.5 rounded backdrop-blur-md", node.curationStatus === 'pillar' ? "bg-amber-500 text-black" : "bg-black/50 text-white hover:bg-amber-500 hover:text-black")}
                                            title="Marcar como Pilar"
                                         >
                                            <Crown className="w-3 h-3" />
                                         </button>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleNodeCuration(node.nodeId, node.curationStatus === 'removed' ? 'active' : 'removed'); }}
                                            className={cn("p-1.5 rounded backdrop-blur-md", node.curationStatus === 'removed' ? "bg-red-500 text-white" : "bg-black/50 text-white hover:bg-red-500")}
                                             title="Remover do Cluster"
                                         >
                                            {node.curationStatus === 'removed' ? <RotateCcw className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                                         </button>
                                    </div>

                                    {/* Info Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        {node.curationStatus === 'pillar' && (
                                            <div className="text-[10px] text-amber-400 font-bold mb-1 flex items-center gap-1">
                                                <Crown className="w-3 h-3" /> PILAR
                                            </div>
                                        )}
                                        {node.curationStatus === 'removed' && (
                                            <div className="text-[10px] text-red-400 font-bold mb-1 flex items-center gap-1">
                                                <Trash2 className="w-3 h-3" /> REMOVIDO
                                            </div>
                                        )}
                                    </div>
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

                    {/* Metric 1: Stability (Simulated) */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <ShieldCheck className="w-4 h-4" />
                            Estabilidade {disabledSignals.size > 0 && <span className="text-xs text-amber-500 font-bold">(Simulada)</span>}
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <div className={cn("text-2xl font-light", disabledSignals.size > 0 ? "text-amber-400" : "text-white")}>
                                {(() => {
                                    // Basic simulation: Stability drops if structural signals are removed
                                    const totalWeight = data.signals.reduce((acc, s) => acc + s.recurrence, 0);
                                    const activeWeight = data.signals
                                        .filter(s => !disabledSignals.has(s.term))
                                        .reduce((acc, s) => acc + s.recurrence, 0);
                                    
                                    const ratio = totalWeight > 0 ? activeWeight / totalWeight : 0;
                                    const simulated = data.metrics.stability * ratio;
                                    return (simulated * 100).toFixed(0) + "%";
                                })()}
                            </div>
                            {disabledSignals.size > 0 && (
                                <div className="text-sm text-zinc-600 line-through decoration-zinc-600">
                                    {(data.metrics.stability * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>

                        <p className="text-[10px] text-zinc-600 leading-snug">
                            {disabledSignals.size > 0 
                                ? "O desligamento de sinais estruturais afeta a coesão magnética do cluster."
                                : data.metrics.stability > 0.7 ? "Cluster altamente coeso. Difícil de dissolver." : "Cluster frágil. Depende de poucos sinais."}
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

                    {/* Metric 3: Curation Stats */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Crown className="w-4 h-4 text-amber-500" />
                            Curadoria
                        </div>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                             <div className="bg-zinc-900/50 p-2 rounded border border-white/5">
                                 <span className="block text-zinc-500 mb-1">Pilares</span>
                                 <span className="text-white font-mono text-lg">
                                     {data.nodes.filter(n => n.curationStatus === 'pillar').length}
                                 </span>
                             </div>
                             <div className="bg-zinc-900/50 p-2 rounded border border-white/5">
                                 <span className="block text-zinc-500 mb-1">Removidos</span>
                                 <span className="text-white font-mono text-lg">
                                     {data.nodes.filter(n => n.curationStatus === 'removed').length}
                                 </span>
                             </div>
                         </div>
                    </div>

                     {/* Insights Box */}
                     <div className="mt-auto p-4 rounded bg-zinc-900/50 border border-white/5">
                        <div className="flex items-center gap-2 text-xs text-lime-400 font-bold mb-2">
                            <Save className="w-3 h-3" />
                            Modo de Curadoria
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                            Suas alterações de Papel (Motor/Apoio) e Curadoria (Pilar/Lixo) são salvas automaticamente e influenciarão o próximo ciclo de regeneração.
                        </p>
                     </div>

                </aside>
            </div>
        </div>
    );
}
