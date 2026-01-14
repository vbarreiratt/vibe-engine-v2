import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Uploader } from './uploader'
import { Sliders, CheckCircle2 } from 'lucide-react'
import { ProjectSettingsDialog } from './project-settings-dialog'
import { ProjectGallery } from './gallery'
import { StartScanButton } from './start-scan-button'
import { ScansGallery } from './scans-gallery'
import { getProjectScans } from './scan/actions'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const projectId = (await params).id

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check membership
    const memberCheck = await supabase.from('project_members').select('role').eq('project_id', projectId).eq('user_id', user.id).maybeSingle()
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()

    if (!memberCheck.data && profile?.role !== 'admin') {
        redirect('/dashboard')
    }

    // Get Project
    const { data: project, error: projError } = await supabase.from('projects').select('*').eq('id', projectId).single()

    if (projError || !project) {
        redirect('/dashboard')
    }

    // Get Images
    const { data: images } = await supabase
        .from('images')
        .select(`
            *,
            ingestions (
                visibility
            )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    // Get Scans (Varreduras)
    const { scans } = await getProjectScans(projectId)

    // Fetch Members for Settings
    const { data: members } = await supabase
        .from('project_members')
        .select(`
            user_id,
            role,
            profiles ( email )
        `)
        .eq('project_id', projectId)

    const isAdmin = profile?.role === 'admin'
    const hasScans = scans && scans.length > 0
    const hasSignals = scans?.some(s => (s.signals_run_count || 0) > 0)

    return (
        <DashboardShell>
            <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2 block">Projeto</span>
                    <h1 className="text-4xl font-light text-white tracking-wide mb-2">{project.name}</h1>
                    <p className="text-zinc-400 max-w-2xl">{project.description}</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <ProjectSettingsDialog project={project} members={members || []} />
                    )}
                    <StartScanButton projectId={projectId} />
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar / Stats */}
                <div className="space-y-6">
                    <div className="p-5 rounded-xl bg-zinc-900/30 border border-white/5 space-y-4">
                        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <Sliders className="w-4 h-4" />
                            Status do Fluxo
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Imagens</span>
                                <span className="text-white font-mono">{images?.length || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Varreduras</span>
                                <span className="text-white font-mono">{scans?.length || 0}</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full transition-all"
                                    style={{ width: `${images?.length ? (hasScans ? (hasSignals ? 75 : 50) : 25) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mode Switcher with Indicators */}
                    <nav className="space-y-1">
                        {[
                            { name: 'Ingestão', path: '', active: true, done: (images?.length || 0) > 0 },
                            { name: 'Varredura', path: '/scan', active: false, done: hasScans },
                            { name: 'Sinais', path: '/signals', active: false, done: hasSignals, enabled: hasScans },
                            { name: 'Ressonância', path: '/resonance', active: false, done: false, enabled: hasSignals }
                        ].map((step, i) => (
                            <a
                                key={step.name}
                                href={step.enabled === false && !step.done ? undefined : `/dashboard/project/${projectId}${step.path}`}
                                className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${step.active
                                    ? 'bg-white/10 text-white'
                                    : step.enabled === false && !step.done
                                        ? 'text-zinc-700 cursor-not-allowed'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span>{i + 1}. {step.name}</span>
                                {step.done && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                )}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Canvas */}
                <div className="lg:col-span-3 space-y-6">
                    <Uploader projectId={projectId} />

                    {/* Scans Gallery Section */}
                    {hasScans && (
                        <div className="mt-8">
                            <h2 className="text-xl font-medium text-white mb-4">Varreduras</h2>
                            <ScansGallery
                                projectId={projectId}
                                scans={scans as any}
                                currentUserId={user.id}
                                isAdmin={isAdmin}
                            />
                        </div>
                    )}

                    {/* Gallery Grid */}
                    <div className="mt-8">
                        <h2 className="text-xl font-medium text-white mb-4">Galeria de Imagens</h2>
                        <ProjectGallery
                            images={images || []}
                            currentUserId={user.id}
                            projectId={projectId}
                            isAdmin={isAdmin}
                        />
                    </div>
                </div>
            </div>
        </div>
        </DashboardShell>
    )
}
