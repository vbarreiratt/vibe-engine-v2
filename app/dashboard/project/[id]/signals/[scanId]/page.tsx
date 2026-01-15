import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Plus, Lock, Globe, User } from 'lucide-react'
import { getScanWithImages, getSignalRuns } from '../../scan/actions'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { DeleteRunButton } from '@/components/delete-run-button'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function ScanSignalsGalleryPage({ params }: { params: Promise<{ id: string, scanId: string }> }) {
    const { id: projectId, scanId } = await params
    const supabase = await createClient()

    // 1. Get Scan Details
    const { scan, error: scanError } = await getScanWithImages(scanId)
    if (scanError || !scan) redirect(`/dashboard/project/${projectId}/signals`)

    // 2. Get Runs
    const { runs } = await getSignalRuns(scanId)

    // 3. User Check
    const { data: { user } } = await supabase.auth.getUser()

    // 4. Project Name
    const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
    const projectName = project?.name || 'Projeto'

    const breadcrumbs = [
        { label: projectName, href: `/dashboard/project/${projectId}` },
        { label: 'Varreduras', href: `/dashboard/project/${projectId}/signals` },
        { label: scan.name }
    ]

    return (
        <DashboardShell>
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/project/${projectId}/signals`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <Breadcrumbs items={breadcrumbs} />
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 mt-2">Leituras</div>
                        <h1 className="text-3xl font-light text-white">{scan.name}</h1>
                    </div>
                </div>
                <Link
                    href={`/dashboard/project/${projectId}/signals/${scanId}/run`}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nova Leitura
                </Link>
            </div>

            {/* List */}
            {(!runs || runs.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div className="text-zinc-500 mb-2 font-medium">Nenhuma leitura encontrada</div>
                    <p className="text-zinc-600 text-sm max-w-xs text-center mb-6">
                        Realize a primeira leitura de sinais para esta varredura.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {runs.map((run: any) => (
                        <Link
                            href={`/dashboard/project/${projectId}/signals/${scanId}/run/${run.id}`}
                            key={run.id}
                            className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 flex items-center justify-between hover:border-purple-500/30 hover:bg-zinc-900 transition-all cursor-pointer group"
                        >
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2 group-hover:text-purple-400 transition-colors">{run.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-zinc-500">
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        {run.curator?.nickname || run.curator?.email}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {new Date(run.created_at).toLocaleDateString('pt-BR')} às {new Date(run.created_at).toLocaleTimeString('pt-BR')}
                                    </span>
                                    {run.visibility === 'public' ? (
                                        <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            <Globe className="w-3 h-3" /> Publica
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                                            <Lock className="w-3 h-3" /> Privada
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {user && run.curator_id === user.id && (
                                    <DeleteRunButton runId={run.id} />
                                )}
                                <div className="text-zinc-700 group-hover:text-purple-500 transition-colors">
                                    <ArrowLeft className="w-5 h-5 rotate-180" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            </div>
        </DashboardShell>
    )
}
