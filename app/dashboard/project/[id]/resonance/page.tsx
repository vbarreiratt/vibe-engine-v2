'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, ArrowLeft, Save, History, RotateCcw, AlertTriangle } from 'lucide-react';
import { ResonanceCanvas } from '@/components/cluster-mural/resonance-canvas';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { saveSnapshot, getSnapshots } from '@/app/actions/cluster-editor';
import { CanvasSnapshot, CanvasMode } from '@/types/cluster-editor';

// Types
type ClusterRun = {
    id: string;
    status: string;
    name: string;
    signals_run_id: string;
};

type SignalsRun = {
    id: string;
    name: string;
    created_at: string;
};

export default function ResonancePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string; // Project ID

    const [view, setView] = useState<'list' | 'create' | 'editor'>('list');

    // Data
    const [runs, setRuns] = useState<ClusterRun[]>([]);
    const [signalsRuns, setSignalsRuns] = useState<SignalsRun[]>([]);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 3-Layer Architecture State
    const [canvasMode, setCanvasMode] = useState<CanvasMode>('view');
    const [selectedVersionId, setSelectedVersionId] = useState<string>('base');

    // Base Layer (Immutable from DB)
    const [baseNodes, setBaseNodes] = useState<any[]>([]);
    const [baseClusters, setBaseClusters] = useState<any[]>([]);
    const [baseEdges, setBaseEdges] = useState<any[]>([]);
    const [baseEdgesByNode, setBaseEdgesByNode] = useState<Record<string, any[]>>({});

    // Draft Layer (Mutable Local)
    const [draftNodes, setDraftNodes] = useState<any[]>([]);
    const [draftClusters, setDraftClusters] = useState<any[]>([]);

    // Snapshots Layer
    const [snapshots, setSnapshots] = useState<CanvasSnapshot[]>([]);

    const [logText, setLogText] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    // Modal States
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const supabase = createClient();

    // 1. Load List
    useEffect(() => {
        if (view === 'list') {
            loadList();
        }
    }, [id, view]);

    // 2. Load Editor content when activeRunId changes
    useEffect(() => {
        if (activeRunId && view === 'editor') {
            loadRunData(activeRunId);
        }
    }, [activeRunId, view]);

    async function loadList() {
        setLoading(true);
        const { data: sRuns } = await supabase
            .from('signals_runs')
            .select('id, name, created_at')
            .eq('project_id', id)
            .order('created_at', { ascending: false });

        const { data: cRuns } = await supabase
            .from('clusters_runs')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false });

        setSignalsRuns(sRuns || []);
        setRuns(cRuns || []);
        setLoading(false);
    }

    async function loadRunData(runId: string) {
        setLoading(true);
        try {
            // 1. Load Base Data
            const res = await fetch(`/api/clusters/${runId}`);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();

            if (data.run.status === 'ready') {
                const bNodes = data.nodes || [];
                const bClusters = data.clusters || [];

                setBaseNodes(bNodes);
                setBaseEdges(data.edges || []);
                setBaseEdgesByNode(data.edgesByNode || {});
                setBaseClusters(bClusters);
                setLogText(data.run.log_text);

                // 2. Load Snapshots
                const snapRes = await getSnapshots(runId);
                if (snapRes.success) {
                    setSnapshots(snapRes.snapshots);
                }

                // 3. Initialize Draft (Local First)
                const savedDraft = localStorage.getItem(`draft_${runId}`);
                if (savedDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft);
                        setDraftNodes(parsed.nodes || bNodes);
                        setDraftClusters(parsed.clusters || bClusters);
                    } catch (e) {
                        setDraftNodes(bNodes);
                        setDraftClusters(bClusters);
                    }
                } else {
                    setDraftNodes(bNodes);
                    setDraftClusters(bClusters);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateRun = async (signalsRunId: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/clusters/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: id,
                    signals_run_id: signalsRunId,
                    name: `Ressonância ${new Date().toLocaleString()}`,
                    visibility: 'private'
                })
            });
            const json = await res.json();
            if (json.run) {
                await fetch(`/api/clusters/${json.run.id}/job`, { method: 'POST' });
                setActiveRunId(json.run.id);
                setView('editor');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Local Draft Persistence ---
    const persistDraft = (newNodes: any[], newClusters: any[]) => {
        setDraftNodes(newNodes);
        setDraftClusters(newClusters);
        if (activeRunId) {
            localStorage.setItem(`draft_${activeRunId}`, JSON.stringify({ nodes: newNodes, clusters: newClusters }));
        }
    };

    const handleNodeMove = (nodeId: string, x: number, y: number) => {
        if (canvasMode !== 'playground') return;

        const newNodes = draftNodes.map(n => n.id === nodeId ? { ...n, x, y, position: { x, y } } : n);
        persistDraft(newNodes, draftClusters);
    };

    const handleMergeClusters = async (targetId: string, sourceId: string) => {
        if (canvasMode !== 'playground') return;

        console.log(`[Draft] Merging ${sourceId} into ${targetId}`);

        const nodesToMerge = draftNodes.filter(n => n.cluster_id === sourceId || n.cluster_id === targetId);

        let avgX = 0, avgY = 0;
        if (nodesToMerge.length > 0) {
            avgX = nodesToMerge.reduce((sum, n) => sum + (n.x || 0), 0) / nodesToMerge.length;
            avgY = nodesToMerge.reduce((sum, n) => sum + (n.y || 0), 0) / nodesToMerge.length;
        }

        const layoutMap = new Map();
        const count = nodesToMerge.length;
        nodesToMerge.forEach((n, i) => {
            let ox = 0, oy = 0;
            if (count === 2) {
                ox = i === 0 ? -40 : 40;
            } else {
                const r = 50 + (count * 5);
                const a = (i / count) * Math.PI * 2;
                ox = Math.cos(a) * r;
                oy = Math.sin(a) * r;
            }
            layoutMap.set(n.id, { x: avgX + ox, y: avgY + oy });
        });

        const newNodes = draftNodes.map(n => {
            if (n.cluster_id === sourceId) {
                const pos = layoutMap.get(n.id) || { x: avgX, y: avgY };
                return { ...n, cluster_id: targetId, x: pos.x, y: pos.y, position: pos };
            }
            if (n.cluster_id === targetId && layoutMap.has(n.id)) {
                const pos = layoutMap.get(n.id)!;
                return { ...n, x: pos.x, y: pos.y, position: pos };
            }
            return n;
        });

        const newClusters = draftClusters.filter(c => c.id !== sourceId);
        persistDraft(newNodes, newClusters);
    };

    const handleAttachNode = async (nodeId: string, targetClusterId: string) => {
        if (canvasMode !== 'playground') return;

        console.log(`[Draft] Attaching ${nodeId} to ${targetClusterId}`);

        const node = draftNodes.find(n => n.id === nodeId);
        const sourceClusterId = node?.cluster_id;

        const targetNodes = draftNodes.filter(n => n.cluster_id === targetClusterId);

        // Simple center based Attach
        let cx = 0, cy = 0;
        if (targetNodes.length > 0) {
            cx = targetNodes.reduce((s, n) => s + (n.x || 0), 0) / targetNodes.length;
            cy = targetNodes.reduce((s, n) => s + (n.y || 0), 0) / targetNodes.length;
        } else {
            cx = node?.x || 0;
            cy = node?.y || 0;
        }

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 40;

        const newNodes = draftNodes.map(n => {
            if (n.id === nodeId) {
                return {
                    ...n,
                    cluster_id: targetClusterId,
                    x: cx + Math.cos(angle) * dist,
                    y: cy + Math.sin(angle) * dist
                };
            }
            return n;
        });

        let newClusters = [...draftClusters];
        if (sourceClusterId) {
            const remaining = newNodes.filter(n => n.cluster_id === sourceClusterId).length;
            if (remaining === 0) {
                newClusters = newClusters.filter(c => c.id !== sourceClusterId);
            }
        }

        persistDraft(newNodes, newClusters);
    };

    const handleDetachNode = async (nodeId: string, currentClusterId: string, position: { x: number, y: number }) => {
        if (canvasMode !== 'playground') return;

        console.log(`[Draft] Detaching ${nodeId}`);

        const newBubbleId = crypto.randomUUID();
        const newCluster = {
            id: newBubbleId,
            name_suggested: "Nova Bolha",
            classification: 'NOISE',
            metrics: {},
            items: [nodeId]
        };

        const newClusters = [...draftClusters, newCluster];

        const newNodes = draftNodes.map(n => {
            if (n.id === nodeId) {
                return { ...n, cluster_id: newBubbleId, x: position.x, y: position.y, position };
            }
            return n;
        });

        const remaining = newNodes.filter(n => n.cluster_id === currentClusterId).length;
        const finalClusters = remaining === 0 ? newClusters.filter(c => c.id !== currentClusterId) : newClusters;

        persistDraft(newNodes, finalClusters);
    };

    // --- Modal Handlers ---

    const openSaveModal = () => {
        setSaveName(`Leitura ${snapshots.length + 1}`);
        setIsSaveModalOpen(true);
    };

    const confirmSaveSnapshot = async () => {
        if (!activeRunId || !saveName.trim()) return;

        setIsSaving(true);
        try {
            // Include clusters in snapshot for better fidelity
            const res = await saveSnapshot(activeRunId, saveName, { nodes: draftNodes, clusters: draftClusters, edges: baseEdges });
            if (res.success) {
                const snapRes = await getSnapshots(activeRunId);
                if (snapRes.success) setSnapshots(snapRes.snapshots);
                setIsSaveModalOpen(false);
                // Success feedback? Could use toast, but modal closing is feedback enough for now
            } else {
                alert("Erro ao salvar: " + res.error); // Fallback alert for error
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const openResetModal = () => {
        setIsResetModalOpen(true);
    };

    const confirmResetDraft = () => {
        persistDraft(baseNodes, baseClusters);
        setIsResetModalOpen(false);
    };

    // derived displayed data
    const displayedData = useMemo(() => {
        if (canvasMode === 'playground') {
            return { nodes: draftNodes, clusters: draftClusters };
        }
        if (selectedVersionId === 'base') {
            return { nodes: baseNodes, clusters: baseClusters };
        }
        const snap = snapshots.find(s => s.id === selectedVersionId);
        if (snap && snap.graph_json) {
            return {
                nodes: snap.graph_json.nodes || [],
                clusters: snap.graph_json.clusters || baseClusters
            };
        }
        return { nodes: baseNodes, clusters: baseClusters };
    }, [canvasMode, selectedVersionId, draftNodes, draftClusters, baseNodes, baseClusters, snapshots]);


    // --- VIEWS ---

    if (view === 'editor' && activeRunId) {
        return loading ? (
            <div className="h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="animate-spin text-lime-500 w-8 h-8" />
            </div>
        ) : (
            <div className="relative w-full h-full">
                {/* Header/Controls Overlay - TOP CENTER */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">

                    {/* Version Selector (View Mode Only) */}
                    {canvasMode === 'view' && (
                        <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-xl">
                            <History className="w-4 h-4 text-zinc-500" />
                            <select
                                value={selectedVersionId}
                                onChange={(e) => setSelectedVersionId(e.target.value)}
                                className="bg-transparent text-sm text-white focus:outline-none appearance-none cursor-pointer pr-4 hover:text-lime-400 transition-colors"
                            >
                                <option value="base" className="bg-zinc-900">Base (Motor)</option>
                                {snapshots.map(s => (
                                    <option key={s.id} value={s.id} className="bg-zinc-900">{s.label} ({new Date(s.created_at).toLocaleDateString()})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Playground Controls */}
                    {canvasMode === 'playground' && (
                        <div className="flex gap-2">
                            <button
                                onClick={openSaveModal}
                                className="bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Salvar Leitura
                            </button>
                            <button
                                onClick={openResetModal}
                                className="bg-zinc-900 border border-red-900/50 text-red-500 hover:bg-red-900/20 px-3 py-2 rounded-full transition-colors"
                                title="Resetar Draft"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* MODALS OVERLAY */}
                {(isSaveModalOpen || isResetModalOpen) && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        {/* Save Modal */}
                        {isSaveModalOpen && (
                            <div className="bg-zinc-900 border border-zinc-700/50 p-6 rounded-2xl w-full max-w-md shadow-2xl scale-in-95 zoom-in-95 animate-in duration-200">
                                <h3 className="text-xl font-light text-white mb-2">Salvar Leitura</h3>
                                <p className="text-zinc-500 text-sm mb-6">Crie um snapshot do estado atual para referência futura.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase text-zinc-500 font-bold tracking-wider mb-2">Nome da Leitura</label>
                                        <input
                                            value={saveName}
                                            onChange={e => setSaveName(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-lime-500 outline-none transition-colors"
                                            autoFocus
                                            placeholder="Ex: Análise Inicial..."
                                            onKeyDown={e => e.key === 'Enter' && confirmSaveSnapshot()}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            onClick={() => setIsSaveModalOpen(false)}
                                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmSaveSnapshot}
                                            disabled={isSaving}
                                            className="bg-lime-500 text-black px-6 py-2 rounded-full font-medium hover:bg-lime-400 disabled:opacity-50 transition-colors flex items-center gap-2"
                                        >
                                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reset Modal */}
                        {isResetModalOpen && (
                            <div className="bg-zinc-900 border border-red-900/30 p-6 rounded-2xl w-full max-w-md shadow-2xl scale-in-95 zoom-in-95 animate-in duration-200">
                                <div className="flex items-center gap-3 mb-4 text-red-500">
                                    <AlertTriangle className="w-6 h-6" />
                                    <h3 className="text-xl font-light text-white">Resetar Draft?</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                                    Isso descartará <strong>todas as alterações não salvas</strong> no modo Playground e reverterá para o estado original do motor. Essa ação não pode ser desfeita.
                                </p>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsResetModalOpen(false)}
                                        className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmResetDraft}
                                        className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-500 transition-colors"
                                    >
                                        Confirmar Reset
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <ResonanceCanvas
                    nodes={displayedData.nodes}
                    edges={baseEdges}
                    edgesByNode={baseEdgesByNode}
                    clusters={displayedData.clusters}
                    logText={logText}
                    onNodeMove={handleNodeMove}
                    onSave={() => { }}
                    onMergeClusters={handleMergeClusters}
                    onNodeDetach={handleDetachNode}
                    onAttachNode={handleAttachNode}
                    mode={canvasMode}
                    onModeChange={setCanvasMode}
                />
            </div>
        );
    }

    // ... create/list/shell ...
    if (view === 'create') {
        return (
            <DashboardShell>
                <div className="max-w-2xl mx-auto text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href={`/dashboard/project/${id}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-light text-white">Criar Nova Ressonância</h1>
                            <p className="text-zinc-500 text-sm">Selecione uma leitura de sinais para gerar o campo de ressonância.</p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {signalsRuns.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleCreateRun(s.id)}
                                className="p-4 rounded border border-neutral-800 hover:border-lime-500 cursor-pointer bg-neutral-900 flex justify-between items-center group text-left w-full"
                            >
                                <div>
                                    <h3 className="font-medium group-hover:text-lime-500 transition-colors">{s.name}</h3>
                                    <span className="text-xs text-neutral-500">{new Date(s.created_at).toLocaleDateString()}</span>
                                </div>
                                <Plus className="opacity-0 group-hover:opacity-100 transition-opacity text-lime-500" />
                            </button>
                        ))}
                        {signalsRuns.length === 0 && !loading && (
                            <div className="p-4 border border-dashed border-neutral-800 text-neutral-500 text-center">
                                Nenhuma leitura de sinais disponível. Faça um Scan e Leitura primeiro.
                            </div>
                        )}
                    </div>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <div className="space-y-8 text-neutral-200">
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/project/${id}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-light tracking-tight text-white">Ressonância Vibe</h1>
                            <p className="text-zinc-500 text-sm">Clusterização automática baseada em vetores semióticos.</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                        onClick={() => setView('create')}
                        className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-800 rounded-xl hover:bg-neutral-900/50 hover:border-neutral-700 transition-all text-neutral-500 hover:text-white gap-2 min-h-[160px]"
                    >
                        <Plus />
                        <span>Nova Ressonância</span>
                    </button>

                    {runs.map(run => (
                        <Card
                            key={run.id}
                            onClick={() => { setActiveRunId(run.id); setView('editor'); }}
                            className="p-6 bg-neutral-900 border-neutral-800 hover:border-lime-500/50 transition-all group cursor-pointer relative overflow-hidden min-h-[160px] flex flex-col justify-between"
                        >
                            <div className="relative z-10">
                                <h3 className="font-medium text-white group-hover:text-lime-400 transition-colors">{run.name}</h3>
                                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{run.status}</p>
                            </div>
                            {run.status === 'running' && (
                                <div className="absolute inset-0 bg-lime-500/5 flex items-center justify-center pointer-events-none">
                                    <Loader2 className="animate-spin text-lime-500" />
                                </div>
                            )}
                            <div className="text-xs text-neutral-600 self-end mt-4">
                                Clique para abrir
                            </div>
                        </Card>
                    ))}
                    {runs.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 text-neutral-600 italic">
                            Nenhuma ressonância criada ainda.
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
