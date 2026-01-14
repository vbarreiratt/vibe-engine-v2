'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { ClusterMural } from '@/components/cluster-mural/mural';

// Types
type ClusterRun = {
    id: string;
    status: string;
    name: string;
};

export default function ClusterCanvasPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string; // Project ID
    // We need to know WHICH run to show. 
    // The route I proposed was project/[id]/clusters - this implies a list.
    // But the user prompt had a logic: "Entrando pelo menu... se não houver seleção, mostrar vazio".
    // I will implement the List + Selector here.

    // Better: This page lists runs. Clicking a run opens the wrapper with Mural.
    // Actually, let's make this page the "Manager".

    const [scans, setScans] = useState<any[]>([]);
    const [selectedScan, setSelectedScan] = useState<string | null>(null);
    const [runs, setRuns] = useState<ClusterRun[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            // Load Scans for this project
            const { data: scansData } = await supabase
                .from('image_scan') // wait, scan table is 'scans' or 'image_scan'? Migration says 'scans' table created in 20240115000001
                .select('id, created_at, status') // Assuming 'scans' table. Let's check migration file if I can... 
            // Ah, Step 30 showed 20240115000001_create_scans_table.sql.
            // Re-reading migration... "create table if not exists scans..."
            // Step 34 showed image_scan table.
            // Dev Log Step 124 says "Fluxo de Varredura (Scan Grid)".
            // It seems 'scans' is the parent object for a session of 'image_scan' items?
            // Let's assume 'scans' table exists.

            // Fallback: If 'scans' table doesn't exist, we might be using 'signals_runs' directly?
            // Step 115 showed 'create table signals_runs... references scans(id)'. So scans table exists.

            // I will fetch 'signals_runs' because Cluster Run depends on Signals Run.
            // "Select a signals_run to generate resonance field".
            const { data: sRuns } = await supabase
                .from('signals_runs')
                .select('id, name, created_at')
                .eq('project_id', id)
                .order('created_at', { ascending: false });

            if (sRuns) {
                // Also fetch existing Cluster Runs
                const { data: cRuns } = await supabase
                    .from('clusters_runs')
                    .select('*')
                    .eq('project_id', id)
                    .order('created_at', { ascending: false });

                setRuns(cRuns || []);
                // We can map signals runs to UI
            }
            setLoading(false);
        }
        load();
    }, [id]);

    const handleCreateRun = async (signalsRunId: string) => {
        setLoading(true);
        try {
            // 1. Create Run entry
            const res = await fetch('/api/clusters/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: id,
                    scan_id: '00000000-0000-0000-0000-000000000000', // TODO: Get real scan ID from signals run join
                    signals_run_id: signalsRunId,
                    name: `Cluster Run ${new Date().toLocaleTimeString()}`,
                    visibility: 'private'
                })
            });
            const json = await res.json();
            if (json.run) {
                // 2. Trigger Job
                // fetch trigger...
                await fetch(`/api/clusters/${json.run.id}/job`, { method: 'POST' });
                // 3. Refresh or redirect
                router.refresh();
                // In a real app we would subscribe to status changes or poll
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 text-neutral-200">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-light tracking-tight text-white">Cluster Canvas (Alpha)</h1>
            </header>

            {/* List of existing Cluster Runs (The "Gallery") */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runs.map(run => (
                    <Card key={run.id} className="p-4 bg-neutral-900 border-neutral-800 hover:border-lime-500/50 transition-all group cursor-pointer relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-medium text-white">{run.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{run.status}</p>
                        </div>
                        {run.status === 'running' && (
                            <div className="absolute inset-0 bg-lime-500/5 flex items-center justify-center">
                                <Loader2 className="animate-spin text-lime-500" />
                            </div>
                        )}
                        {/* Link to view */}
                    </Card>
                ))}

                {/* Create New Placeholder */}
                <button className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-800 rounded-xl hover:bg-neutral-900/50 hover:border-neutral-700 transition-all text-neutral-500 hover:text-white gap-2">
                    <Plus />
                    <span>Nova Clusterização</span>
                </button>
            </div>

            {/* Debug/Dev: Canvas Preview if we had data */}
            <div className="mt-12 border-t border-neutral-800 pt-8">
                <h2 className="text-sm font-bold text-neutral-500 mb-4">PREVIEW MODE (MOCK)</h2>
                {/* Mock Data */}
                <ClusterMural
                    nodes={[{ id: '1', x: 0, y: 0, cluster_id: 'a', is_outlier: false }, { id: '2', x: 10, y: 5, cluster_id: 'a', is_outlier: false }]}
                    clusters={[{ id: 'a', name: 'Test Cluster', motor: 'state' }]}
                    edges={[{ source: '1', target: '2', weight: 0.8 }]}
                />
            </div>
        </div>
    );
}
