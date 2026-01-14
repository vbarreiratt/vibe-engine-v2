'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, ArrowLeft, Save, X } from 'lucide-react';
import { ClusterMural } from '@/components/cluster-mural/mural';

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

export default function ClusterCanvasPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string; // Project ID

    const [view, setView] = useState<'list' | 'create' | 'editor'>('list');

    // Data
    const [runs, setRuns] = useState<ClusterRun[]>([]);
    const [signalsRuns, setSignalsRuns] = useState<SignalsRun[]>([]);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Editor Data
    const [nodes, setNodes] = useState<any[]>([]);
    const [edges, setEdges] = useState<any[]>([]);
    const [clusters, setClusters] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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
            const res = await fetch(`/api/clusters/${runId}`);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();

            if (data.run.status === 'ready') {
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setClusters(data.clusters || []);
            } else {
                // If checking a pending run, maybe poll?
                // For MVP, just show status
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
                    scan_id: '00000000-0000-0000-0000-000000000000', // Placeholder as per logic
                    signals_run_id: signalsRunId,
                    name: `Cluster Run ${new Date().toLocaleTimeString()}`,
                    visibility: 'private'
                })
            });
            const json = await res.json();
            if (json.run) {
                // Trigger Job
                await fetch(`/api/clusters/${json.run.id}/job`, { method: 'POST' });
                // Go to Editor (will prob show loading state initially)
                setActiveRunId(json.run.id);
                setView('editor');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!activeRunId) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/clusters/${activeRunId}/nodes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes }) // Assuming nodes state updated by Mural
            });
            if (!res.ok) throw new Error("Failed to save");
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNodeMove = (nodeId: string, x: number, y: number) => {
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
    };

    // --- VIEWS ---

    if (view === 'editor' && activeRunId) {
        // If loading in editor, maybe show spinner overlay
        return (
            <div className="h-screen flex flex-col bg-neutral-900 text-white">
                <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-4 bg-black">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => { setActiveRunId(null); setView('list'); }}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        <h1 className="font-medium">Editor de Ressonância</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSaving ? (
                            <span className="text-xs text-neutral-500">Salvando...</span>
                        ) : (
                            <Button variant="secondary" size="sm" onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                            </Button>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-hidden relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-lime-500 w-8 h-8" />
                                <span className="text-sm text-neutral-500">Processando campo de ressonância...</span>
                            </div>
                        </div>
                    ) : (
                        nodes.length > 0 ? (
                            <ClusterMural
                                nodes={nodes}
                                edges={edges}
                                clusters={clusters}
                                onNodeMove={handleNodeMove}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                                Run ainda processando ou vazia. Tente recarregar.
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="p-8 max-w-2xl mx-auto text-white">
                <Button variant="ghost" onClick={() => setView('list')} className="mb-4 pl-0 hover:bg-transparent hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <h2 className="text-2xl font-light mb-6">Criar Nova Clusterização</h2>
                <p className="text-neutral-400 mb-8">Selecione uma leitura de sinais (Signals Run) para gerar o campo de ressonância.</p>

                <div className="grid gap-3">
                    {signalsRuns.map(s => (
                        <div key={s.id} onClick={() => handleCreateRun(s.id)} className="p-4 rounded border border-neutral-800 hover:border-lime-500 cursor-pointer bg-neutral-900 flex justify-between items-center group">
                            <div>
                                <h3 className="font-medium group-hover:text-lime-500 transition-colors">{s.name}</h3>
                                <span className="text-xs text-neutral-500">{new Date(s.created_at).toLocaleDateString()}</span>
                            </div>
                            <Plus className="opacity-0 group-hover:opacity-100 transition-opacity text-lime-500" />
                        </div>
                    ))}
                    {signalsRuns.length === 0 && (
                        <div className="p-4 border border-dashed border-neutral-800 text-neutral-500 text-center">
                            Nenhuma leitura de sinais disponível. Faça um Scan e Leitura primeiro.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default: List
    return (
        <div className="p-8 space-y-8 text-neutral-200">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-light tracking-tight text-white">Cluster Canvas (Alpha)</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* New Button */}
                <button
                    onClick={() => setView('create')}
                    className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-800 rounded-xl hover:bg-neutral-900/50 hover:border-neutral-700 transition-all text-neutral-500 hover:text-white gap-2 min-h-[160px]"
                >
                    <Plus />
                    <span>Nova Clusterização</span>
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
                        Nenhuma clusterização criada ainda.
                    </div>
                )}
            </div>
        </div>
    );
}
