'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Activity, Layers, Play, AlertTriangle, ShieldCheck, Zap, Lock, Unlock, Crown, Trash2, RotateCcw, Save, MoreHorizontal, Check, Flame, Plus, CloudFog, Ban, Undo2, Eye, Info, Map as MapIcon, Archive, Split, Sparkles, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClusterEditorData, EditorSignal, EditorNode, SignalRole, NodeCurationStatus, SynthesisRole, CanvasMode } from '@/types/cluster-editor';
import { getClusterEditorData, logClusterEditorAction, setSignalRole, setNodeCuration, updateClusterSynthesis } from '@/app/actions/cluster-editor';

interface ClusterEditorProps {
    clusterId: string;
    onClose: () => void;
    mode: CanvasMode;
}

export function ClusterEditor({ clusterId, onClose, mode }: ClusterEditorProps) {
    const [data, setData] = useState<ClusterEditorData | null>(null);
    const [loading, setLoading] = useState(true);

    // Synthesis State
    const [synthesisName, setSynthesisName] = useState('');
    const [synthesisDesc, setSynthesisDesc] = useState('');
    const [synthesisRole, setSynthesisRole] = useState<SynthesisRole>(null);
    const [isSavingSynthesis, setIsSavingSynthesis] = useState(false);

    // Context for optimistic role updates
    const handleSynthesisUpdate = (updates: { name?: string, description?: string, role?: SynthesisRole }) => {
        if (!data) return;

        // Optimistic State Update
        if (updates.name !== undefined) setSynthesisName(updates.name);
        if (updates.description !== undefined) setSynthesisDesc(updates.description);
        if (updates.role !== undefined) setSynthesisRole(updates.role);

        // Async Save
        setIsSavingSynthesis(true);
        updateClusterSynthesis(data.clusterId, {
            name: updates.name ?? synthesisName, // use passed or current (be careful with closures, using ref or just assuming immediate call)
            description: updates.description ?? synthesisDesc,
            role: (updates.role !== undefined ? updates.role : synthesisRole) || undefined
        }).then(() => {
            setFeedback({ message: "Síntese salva", type: 'success' });
        }).catch(() => {
            setFeedback({ message: "Erro ao salvar", type: 'warning' });
        }).finally(() => {
            setIsSavingSynthesis(false);
        });
    };

    // Local Simulation State
    const [disabledSignals, setDisabledSignals] = useState<Set<string>>(new Set());
    const [highlightedSignal, setHighlightedSignal] = useState<string | null>(null);
    const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set()); // Formerly lockedSignals (Tension)
    const [activeMenuSignal, setActiveMenuSignal] = useState<string | null>(null); // For the 3-dots menu
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [hoveredRole, setHoveredRole] = useState<string | null>(null); // For rich tooltips in menu

    // Feedback State
    const [feedback, setFeedback] = useState<{ message: string, type: 'neutral' | 'success' | 'warning' } | null>(null);
    const [pulseCluster, setPulseCluster] = useState(false);

    // Clear feedback timer
    useEffect(() => {
        if (feedback) {
            const t = setTimeout(() => setFeedback(null), 2500);
            return () => clearTimeout(t);
        }
    }, [feedback]);

    // Initial Fetch
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const result = await getClusterEditorData(clusterId);
                if (mounted) {
                    setData(result);
                    if (result?.synthesis) {
                        setSynthesisName(result.synthesis.name || '');
                        setSynthesisDesc(result.synthesis.description || '');
                        setSynthesisRole(result.synthesis.role || null);
                    }
                }
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

        // Feedback Logic
        if (role === 'structural') {
            setFeedback({ message: `Sinal "${signal.term}" definido como MOTOR — Estabilidade recalculada`, type: 'success' });
            setPulseCluster(true);
            setTimeout(() => setPulseCluster(false), 800);
        } else if (role === 'support') {
            setFeedback({ message: `Sinal "${signal.term}" definido como APOIO`, type: 'neutral' });
        } else if (role === 'noise') {
            setFeedback({ message: `Sinal "${signal.term}" removido da estrutura (RUÍDO)`, type: 'warning' });
        } else {
            setFeedback({ message: `Papel do sinal "${signal.term}" resetado`, type: 'neutral' });
        }

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

        // Feedback
        if (status === 'pillar') setFeedback({ message: "Referência marcada como PILAR CANÔNICO", type: 'success' });
        if (status === 'removed') setFeedback({ message: "Referência marcada como REMOVIDA", type: 'warning' });

        // Optimistic
        const updatedNodes = data.nodes.map(n => n.nodeId === nodeId ? { ...n, curationStatus: status } : n);
        setData({ ...data, nodes: updatedNodes });

        await setNodeCuration(clusterId, nodeId, status);
    };

    // Calculate Simulated Metrics
    const simulatedState = useMemo(() => {
        if (!data) return null;

        // Active signals are those NOT disabled AND NOT marked as noise
        const activeSignals = data.signals.filter(s => !disabledSignals.has(s.term) && s.role !== 'noise');

        // Recalculate average recurrence considering only active signals
        const avgRecurrence = activeSignals.length > 0
            ? activeSignals.reduce((acc, s) => acc + s.recurrence, 0) / activeSignals.length
            : 0;

        // Classification Proxy (FOR READING HEALTH ONLY)
        let classification = data.metrics.classification;
        if (avgRecurrence < 0.3) classification = 'WEAK';
        if (avgRecurrence < 0.1) classification = 'WEAK'; // Was NOISE, now avoids that term.

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
        <div className={cn(
            "fixed inset-0 z-[150] flex flex-col bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300 transition-all",
            pulseCluster && "scale-[1.005] ring-2 ring-lime-500/50 shadow-[0_0_50px_rgba(132,204,22,0.2)]"
        )}>

            {/* HERADER */}
            <header className="flex h-16 items-center justify-between px-6 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-white tracking-wide">{data.label}</h2>
                        <span className="text-[10px] uppercase text-zinc-500 tracking-widest">
                            {data.metrics.nodeCount} Referências · {data.signals.length} Sinais
                        </span>
                    </div>

                    {/* 1. Structural Status (Immutable) */}
                    <div className="flex flex-col border-l border-white/10 pl-4 h-full justify-center relative group cursor-help">
                        {/* TOOLTIP: STRUCTURAL STATUS */}
                        <div className="absolute left-0 top-full mt-2 w-64 bg-zinc-950/95 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                            <h4 className="font-bold text-xs text-zinc-300 uppercase mb-2">Status Estrutural</h4>
                            <div className="space-y-2">
                                <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    Definido pelo Motor de Clusterização (Vibe Engine). É imutável dentro deste run.
                                </p>
                                <ul className="text-[10px] text-zinc-500 space-y-1 list-disc list-inside">
                                    <li><span className="text-lime-500 font-bold">STRONG</span>: Consolidado e denso.</li>
                                    <li><span className="text-amber-500 font-bold">PROTO</span>: Em formação, instável.</li>
                                    <li><span className="text-red-500 font-bold">WEAK</span>: Difuso, baixo sinal (Latente).</li>
                                </ul>
                            </div>
                        </div>

                        <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest mb-0.5">Status Estrutural</span>
                        <div className={cn(
                            "text-xs font-mono font-bold",
                            data.metrics.classification === 'STRONG' ? "text-lime-500" :
                                data.metrics.classification === 'PROTO' ? "text-amber-500" : "text-zinc-500"
                        )}>
                            {data.metrics.classification}
                        </div>
                    </div>

                    {/* 2. Reading Health (Dynamic) */}
                    <div className="flex flex-col border-l border-white/10 pl-4 h-full justify-center relative group cursor-help">
                        {/* TOOLTIP: READING HEALTH */}
                        <div className="absolute left-0 top-full mt-2 w-64 bg-zinc-950/95 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                            <h4 className="font-bold text-xs text-zinc-300 uppercase mb-2">Saúde da Leitura</h4>
                            <div className="space-y-2">
                                <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    Indica a qualidade da sua curadoria atual. Se você desativar muitos sinais motores, a leitura fica "FRÁGIL", mesmo que o cluster seja estruturalmente forte.
                                </p>
                                <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded">
                                    <p className="text-[10px] text-blue-400 font-bold mb-1">COMO MELHORAR?</p>
                                    <p className="text-[10px] text-zinc-400 leading-snug">
                                        Ative sinais ou defina novos motores para estabilizar a leitura.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest mb-0.5">Saúde da Leitura</span>
                        <div className="flex items-center gap-2">
                            {(() => {
                                const drop = parseFloat(simulatedState.drop);
                                let healthLabel = 'ESTÁVEL';
                                let healthColor = 'text-lime-400';

                                // "Fragile" if significant drop or if active signals count is low
                                if (drop > 50 || simulatedState.activeSignals.length < 3) { healthLabel = 'CRÍTICA'; healthColor = 'text-red-400'; }
                                else if (drop > 15 || simulatedState.activeSignals.length < 5) { healthLabel = 'FRÁGIL'; healthColor = 'text-amber-400'; }

                                return (
                                    <>
                                        <span className={cn("text-xs font-bold", healthColor)}>{healthLabel}</span>
                                        {drop > 0 ? (
                                            <span className="text-[10px] text-zinc-500 font-mono">(-{drop}%)</span>
                                        ) : (
                                            <Check className="w-3 h-3 text-lime-500/50" />
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    </div>
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
                                        disabled={mode === 'view'}
                                        onClick={(e) => { e.stopPropagation(); toggleSignalActive(signal.term); }}
                                        title={mode === 'view' ? "Modo Visualização (somente leitura)" : "Desativar temporariamente este sinal para testar sua influência."}
                                        className={cn(
                                            "check-area w-5 h-5 rounded border flex items-center justify-center transition-colors z-20 shrink-0",
                                            mode === 'view' && "opacity-50 cursor-not-allowed pointer-events-none", // Strict Read-Only
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
                                                    {/* Internal role is noise, but semantically we call it 'Excluído' or handle it differently? Project prompt says: NOISE -> BOLHA LATENTE. But here in Editor it refers to signals being noise. Let's keep as Ruído for signal context or update? Prompt context was about Canvas Clusters. This is Signal Role inside Editor. Let's stick to 'Ruído' for signals to avoid confusion, or 'Irrelevante'. Let's keep 'Ruído' for signal noise, but maybe 'Latente' is better? The prompt says "O termo NOISE deixa de existir no nível do canvas". This is the Editor. Let's start with canvas. */}
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
                                    <div className="shrink-0 w-4 flex justify-center" title="Sinal travado como decisão humana.">
                                        {isLocked && (
                                            <Lock
                                                className="w-3 h-3 text-zinc-600"
                                            />
                                        )}
                                    </div>

                                    {/* 4. Menu Trigger (Interactive Modes Only) */}
                                    {mode !== 'view' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeMenuSignal === signal.term) {
                                                    setActiveMenuSignal(null);
                                                } else {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setMenuPosition({ x: rect.right + 8, y: rect.top });
                                                    setActiveMenuSignal(signal.term);
                                                }
                                            }}
                                            className={cn("p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors z-20", isMenuOpen && "bg-white/10 text-white")}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Background Role Hint */}
                                    {role === 'structural' && !isDisabled && (
                                        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* MODE FOOTER */}
                    <div className="p-4 border-t border-white/10 bg-zinc-900/30 backdrop-blur-sm mt-auto">
                        {mode === 'view' ? (
                            <div className="flex items-center gap-2 mb-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                <Eye className="w-3 h-3" />
                                Visualização
                            </div>
                        ) : mode === 'playground' ? (
                            <div className="flex items-center gap-2 mb-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                                <FlaskConical className="w-3 h-3" />
                                Playground Ativo
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mb-1.5 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                                <Sparkles className="w-3 h-3" />
                                Modo Síntese
                            </div>
                        )}

                        <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
                            {mode === 'view' && "Todas as ferramentas de edição estão desabilitadas."}
                            {mode === 'playground' && "Suas edições de sinal alteram a leitura, mas não o motor original."}
                            {mode === 'synthesis' && "Conclua sua análise definindo o papel deste cluster no sistema."}
                        </p>
                        <Button onClick={onClose} size="sm" className="w-full text-xs h-8 bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-white">
                            {mode === 'view' ? "Fechar Visualização" : "Encerrar e Salvar"}
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
                                        "relative aspect-square rounded-lg border transition-all duration-300 group",
                                        isHighlighted ? "ring-2 ring-lime-400 scale-105 z-10 border-transparent shadow-2xl" : "border-white/5",
                                        isDimmed ? "opacity-20 grayscale scale-95" : "hover:border-white/20",
                                        node.curationStatus === 'pillar' && "ring-1 ring-amber-400"
                                    )}
                                >
                                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                                        {node.url ? (
                                            <img src={node.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 text-xs">NO IMG</div>
                                        )}
                                    </div>

                                    {/* Curation Overlays (Level 2) - Visible on Group Hover (Interactive Modes Only) */}
                                    {mode !== 'view' && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <div className="relative group/btn">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleNodeCuration(node.nodeId, node.curationStatus === 'pillar' ? 'active' : 'pillar'); }}
                                                    className={cn("p-1.5 rounded backdrop-blur-md transition-colors", node.curationStatus === 'pillar' ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-black/50 text-white hover:bg-amber-500 hover:text-black")}
                                                >
                                                    <Crown className="w-3 h-3" />
                                                </button>
                                                {/* PILLAR TOOLTIP */}
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900/95 border border-amber-500/20 p-3 rounded shadow-2xl backdrop-blur-xl pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
                                                    <h5 className="text-amber-400 font-bold text-[10px] mb-1 uppercase tracking-wider flex items-center gap-1">
                                                        <Crown className="w-3 h-3" /> Definir como Pilar
                                                    </h5>
                                                    <p className="text-zinc-300 text-[10px] leading-relaxed mb-1.5">
                                                        Esta referência é um exemplo canônico da vibe.
                                                    </p>
                                                    <ul className="text-[9px] text-zinc-500 space-y-0.5 list-disc list-inside">
                                                        <li>Ajuda humanos a entenderem o cluster</li>
                                                        <li>Estabiliza sinais motores</li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleNodeCuration(node.nodeId, node.curationStatus === 'removed' ? 'active' : 'removed'); }}
                                                className={cn("p-1.5 rounded backdrop-blur-md transition-colors", node.curationStatus === 'removed' ? "bg-red-500 text-white" : "bg-black/50 text-white hover:bg-red-500")}
                                                title="Remover do Cluster (Ruído)"
                                            >
                                                {node.curationStatus === 'removed' ? <RotateCcw className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    )}

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
                    <div className="space-y-2 relative group cursor-help">
                        {/* TOOLTIP: STABILITY */}
                        <div className="absolute right-full top-0 mr-4 w-64 bg-zinc-950/95 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                            <h4 className="font-bold text-xs text-zinc-300 uppercase mb-2">Estabilidade</h4>
                            <div className="space-y-2">
                                <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    O "chão" do cluster. O quanto ele é firme. Se for baixo, o cluster é uma "nuvem" vaga que pode se desfazer na próxima regeneração.
                                </p>
                                <div className="bg-lime-500/10 border border-lime-500/20 p-2 rounded">
                                    <p className="text-[10px] text-lime-400 font-bold mb-1">COMO INFLUENCIAR?</p>
                                    <p className="text-[10px] text-zinc-400 leading-snug">
                                        Adicione imagens que repitam a mesma Matéria ou Estado. Repetição cria gravidade.
                                    </p>
                                </div>
                            </div>
                        </div>
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
                    <div className="space-y-2 relative group cursor-help">
                        {/* TOOLTIP: DOMINANCE */}
                        <div className="absolute right-full top-0 mr-4 w-64 bg-zinc-950/95 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                            <h4 className="font-bold text-xs text-zinc-300 uppercase mb-2">Camada Dominante</h4>
                            <div className="space-y-2">
                                <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    A dimensão que mais atrai este cluster (Matéria, Estado ou Movimento). Ela define o "sabor" principal da vibração.
                                </p>
                                <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded">
                                    <p className="text-[10px] text-blue-400 font-bold mb-1">COMO INFLUENCIAR?</p>
                                    <p className="text-[10px] text-zinc-400 leading-snug">
                                        Adicione sinais fortes de outras camadas se quiser equilibrar a composição.
                                    </p>
                                </div>
                            </div>
                        </div>
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
                    <div className="space-y-2 pt-4 border-t border-white/5 relative group cursor-help">
                        {/* TOOLTIP: CURATION */}
                        <div className="absolute right-full top-4 mr-4 w-64 bg-zinc-950/95 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                            <h4 className="font-bold text-xs text-zinc-300 uppercase mb-2">Índice de Curadoria</h4>
                            <div className="space-y-2">
                                <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    O nível de intervenção humana (HIL). Quanto mais pilares você define, mais o sistema entende a intenção subjetiva.
                                </p>
                                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded">
                                    <p className="text-[10px] text-amber-500 font-bold mb-1">COMO INFLUENCIAR?</p>
                                    <p className="text-[10px] text-zinc-400 leading-snug">
                                        Use a coroa (Pilar) para travar exemplos perfeitos e a lixeira para limpar ruídos.
                                    </p>
                                </div>
                            </div>
                        </div>
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

                    {/* Synthesis & Decision Panel (ONLY IN SYNTHESIS MODE) */}
                    {mode === 'synthesis' && (
                        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded mb-2">
                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                    <Sparkles className="w-4 h-4" /> Modo Síntese
                                </h4>
                                <p className="text-[10px] text-zinc-400 leading-snug">
                                    Defina o destino deste mundo. As alterações aqui não afetam o motor.
                                </p>
                            </div>

                            {/* 1. Name */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 font-medium">Nome da Vibe (Consciente)</label>
                                <input
                                    type="text"
                                    value={synthesisName}
                                    onChange={(e) => setSynthesisName(e.target.value)}
                                    onBlur={() => handleSynthesisUpdate({ name: synthesisName })}
                                    placeholder="Ex: Urgência Elétrica..."
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-purple-100 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                            </div>

                            {/* 2. Role Decision */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 font-medium">Papel no Sistema</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'territory', label: 'Território', icon: MapIcon, color: 'text-purple-400', border: 'border-purple-500/30' },
                                        { value: 'pillar', label: 'Pilar', icon: Crown, color: 'text-amber-400', border: 'border-amber-500/30' },
                                        { value: 'counterpoint', label: 'Contraponto', icon: Zap, color: 'text-pink-400', border: 'border-pink-500/30' },
                                        { value: 'archive', label: 'Arquivo', icon: Archive, color: 'text-zinc-400', border: 'border-zinc-500/30' },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleSynthesisUpdate({ role: option.value as any })}
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-2 rounded border text-[10px] transition-all text-left",
                                                synthesisRole === option.value
                                                    ? `bg-white/5 ${option.border} ${option.color}`
                                                    : "bg-transparent border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                                            )}
                                        >
                                            <option.icon className="w-3 h-3 shrink-0" />
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Description */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 font-medium">Manifesto / Descrição</label>
                                <textarea
                                    value={synthesisDesc}
                                    onChange={(e) => setSynthesisDesc(e.target.value)}
                                    onBlur={() => handleSynthesisUpdate({ description: synthesisDesc })}
                                    placeholder="Para onde vai este mundo?"
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 min-h-[60px] focus:outline-none focus:border-purple-500/50 transition-colors resize-none leading-relaxed scrollbar-hide"
                                />
                            </div>

                            {/* Save Feedback */}
                            {isSavingSynthesis && (
                                <div className="text-[10px] text-zinc-500 flex items-center gap-1 animate-pulse justify-end">
                                    <Save className="w-3 h-3" /> Salvando síntese...
                                </div>
                            )}
                        </div>
                    )}

                    {/* Insights Box (Legacy / Playground Mode) */}
                    {mode === 'playground' && (
                        <div className="mt-auto p-4 rounded bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-2">
                                <FlaskConical className="w-3 h-3" />
                                Modo Playground
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                                Você está interpretando o cluster. Suas decisões não alteram o motor, apenas a leitura.
                            </p>
                        </div>
                    )}

                    {/* Visualization Mode Info */}
                    {mode === 'view' && (
                        <div className="mt-auto p-4 rounded bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold mb-2">
                                <Eye className="w-3 h-3" />
                                Modo Visualização
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                                Explore os mundos detectados. Entre no Playground para editar a leitura.
                            </p>
                        </div>
                    )}

                </aside>
            </div>

            {/* 6. Feedback Toast */}
            {feedback && (
                <div className={cn(
                    "fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border flex items-center gap-3 z-[200] animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200",
                    feedback.type === 'success' ? "bg-lime-950/90 border-lime-500/20 text-lime-400" :
                        feedback.type === 'warning' ? "bg-red-950/90 border-red-500/20 text-red-400" :
                            "bg-zinc-900/90 border-white/10 text-zinc-200"
                )}>
                    {feedback.type === 'success' && <Check className="w-4 h-4" />}
                    {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                    {feedback.type === 'neutral' && <Info className="w-4 h-4 text-blue-400" />}
                    <span className="text-xs font-medium tracking-wide">{feedback.message}</span>
                </div>
            )}

            {/* 7. Global Floating Menu (Overlay) */}
            {activeMenuSignal && menuPosition && (() => {
                const signal = data?.signals.find(s => s.term === activeMenuSignal);
                if (!signal) return null;
                const role = signal.role;

                return (
                    <div
                        style={{ top: menuPosition.y, left: menuPosition.x }}
                        className="fixed w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-[200] flex flex-col p-1 animate-in fade-in zoom-in-95 overflow-visible"
                    >
                        {/* RICH TOOLTIP SIDE PANEL (Now positioned relative to this FIXED container) */}
                        {hoveredRole && (
                            <div className="absolute left-full top-0 ml-2 w-64 bg-zinc-950/95 border border-white/20 p-4 rounded-lg shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-left-2 pointer-events-none z-[210]">
                                <h4 className={cn("font-bold text-xs uppercase mb-2",
                                    hoveredRole === 'structural' ? "text-lime-400" :
                                        hoveredRole === 'support' ? "text-blue-400" : "text-red-400"
                                )}>
                                    {hoveredRole === 'structural' ? "Tornar sinal MOTOR" :
                                        hoveredRole === 'support' ? "Tornar sinal APOIO" : "Marcar como RUÍDO"}
                                </h4>
                                <p className="text-zinc-300 text-[11px] leading-relaxed mb-2">
                                    {hoveredRole === 'structural' ? "Este sinal passa a ser estrutural para a vibe. Sem ele, o cluster perde identidade." :
                                        hoveredRole === 'support' ? "Este sinal reforça a vibe, mas não a define." :
                                            "Este sinal aparece, mas não pertence à vibe."}
                                </p>
                                <div className="bg-white/5 p-2 rounded mb-2">
                                    <p className="text-[10px] text-zinc-400 italic">
                                        {hoveredRole === 'structural' ? 'Ex: "pulsar" como motor define uma vibe energética contínua.' :
                                            hoveredRole === 'support' ? 'Ex: "tinta vibrante" adiciona textura, mas não sustenta o cluster sozinha.' :
                                                'Ex: um efeito visual recorrente, mas acidental.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 border-t border-white/10 pt-2">
                                    <Activity className="w-3 h-3" />
                                    <span>
                                        {hoveredRole === 'structural' ? "O sinal ancora a estabilidade." :
                                            hoveredRole === 'support' ? "Contribui para densidade/recorrência." :
                                                "Removido da simulação de estabilidade."}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="px-2 py-1.5 bg-black/20 text-[10px] text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
                            Definir Papel
                        </div>

                        <button
                            onMouseEnter={() => setHoveredRole('structural')}
                            onMouseLeave={() => setHoveredRole(null)}
                            onClick={() => { handleSetRole(signal, 'structural'); setActiveMenuSignal(null); }}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left group"
                        >
                            <Flame className="w-3 h-3 text-lime-400 group-hover:scale-110 transition-transform" />
                            <span>Tornar Motor</span>
                        </button>
                        <button
                            onMouseEnter={() => setHoveredRole('support')}
                            onMouseLeave={() => setHoveredRole(null)}
                            onClick={() => { handleSetRole(signal, 'support'); setActiveMenuSignal(null); }}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left group"
                        >
                            <Plus className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span>Tornar Apoio</span>
                        </button>
                        <button
                            onMouseEnter={() => setHoveredRole('noise')}
                            onMouseLeave={() => setHoveredRole(null)}
                            onClick={() => { handleSetRole(signal, 'noise'); setActiveMenuSignal(null); }}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left group"
                        >
                            <CloudFog className="w-3 h-3 text-red-400 group-hover:scale-110 transition-transform" />
                            <span>Marcar como Ruído</span>
                        </button>

                        <div className="h-px bg-white/5 my-1" />

                        <button onClick={() => { setHighlightedSignal(signal.term); setActiveMenuSignal(null); }} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 rounded text-left">
                            <Eye className="w-3 h-3 text-zinc-500" />
                            <span>Ver impacto visual</span>
                        </button>

                        {/* Reset / Unlock */}
                        {role && (
                            <button onClick={() => { handleSetRole(signal, null as any); setActiveMenuSignal(null); }} className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded text-left mt-1">
                                <Undo2 className="w-3 h-3" />
                                <span>Resetar papel</span>
                            </button>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}
