import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResonanceLauncher } from './launcher'
import { ArrowLeft, Layers } from 'lucide-react'
import Link from 'next/link'

export default async function ResonancePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const projectId = (await params).id

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Existing Clusters
    // In a real app we'd filter by 'latest run' or active status
    const { data: clusters } = await supabase
        .from('clusters')
        .select('*, cluster_images(count))') // quick count
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    const hasClusters = clusters && clusters.length > 0

    // If we have clusters, we should show them. For MVP Re-generation is allowed via Launcher.
    // Ideally we show the boards here.

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-light text-white">Ressonância Vibe</h1>
                    <p className="text-zinc-500 text-sm">Clusterização automática baseada em vetores semióticos.</p>
                </div>
            </div>

            {!hasClusters ? (
                <ResonanceLauncher projectId={projectId} hasClusters={false} />
            ) : (
                <div className="space-y-8">
                    <div className="flex justify-end">
                        <ResonanceLauncher projectId={projectId} hasClusters={true} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {clusters.map((cluster: any) => (
                            <div key={cluster.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{cluster.name}</h3>
                                            <span className="text-xs text-zinc-500">Cohesion: {Math.round(cluster.cohesion_score * 100)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview of images would go here, fetching cluster_images */}
                                <div className="h-32 bg-zinc-950/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-800 text-zinc-600 text-xs">
                                    Visualização do Cluster
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
