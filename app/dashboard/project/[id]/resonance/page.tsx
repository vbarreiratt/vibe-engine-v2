'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import { ResonanceCanvas } from '@/components/cluster-mural/resonance-canvas';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';

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
                // Trigger Job
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

    const handleSave = async () => {
        if (!activeRunId) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/clusters/${activeRunId}/nodes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes })
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
        return loading ? (
            <div className="h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-lime-500 w-8 h-8" />
                    <span className="text-sm text-zinc-500">Carregando ressonância...</span>
                </div>
            </div>
        ) : nodes.length > 0 ? (
            <ResonanceCanvas
                nodes={nodes}
                edges={edges}
                clusters={clusters}
                onNodeMove={handleNodeMove}
                onSave={handleSave}
            />
        ) : (
            <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-500">
                Run ainda processando ou vazia. Tente recarregar.
            </div>
        );
    }

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

    // Default: List
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
                    {/* New Button */}
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
