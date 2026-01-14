import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Uploader } from './uploader' // We'll make this next
import { Play, Download, Settings, Sliders } from 'lucide-react'

// MVP: Only Ingestion Phase implemented visually for now
export default async function ProjectPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const projectId = params.id

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check membership
    const memberCheck = await supabase.from('project_members').select('role').eq('project_id', projectId).eq('user_id', user.id).single()
    const adminCheck = await supabase.from('profiles').select('role').eq('user_id', user.id).single()

    if (!memberCheck.data && adminCheck.data?.role !== 'admin') {
        redirect('/dashboard') // Forbidden
    }

    // Get Data
    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single()
    const { data: images } = await supabase.from('images').select('*').eq('project_id', projectId).order('created_at', { ascending: false })

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2 block">Projeto</span>
                    <h1 className="text-4xl font-light text-white tracking-wide mb-2">{project.name}</h1>
                    <p className="text-zinc-400 max-w-2xl">{project.description}</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20">
                        <Play className="w-4 h-4 fill-current" />
                        <span className="font-medium">Iniciar Varredura</span>
                    </button>
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
                                <span className="text-zinc-500">Varridas</span>
                                <span className="text-white font-mono">0</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full w-[0%]" />
                            </div>
                        </div>
                    </div>

                    {/* Mode Switcher */}
                    <nav className="space-y-1">
                        {[
                            { name: 'Ingestão', path: '' },
                            { name: 'Varredura', path: '/scan' },
                            { name: 'Sinais', path: '/tagging' },
                            { name: 'Ressonância', path: '/resonance' }
                        ].map((step, i) => (
                            <a
                                key={step.name}
                                href={`/dashboard/project/${projectId}${step.path}`}
                                className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${i === 0 ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <span>{i + 1}. {step.name}</span>
                                {i === 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Canvas */}
                <div className="lg:col-span-3 space-y-6">
                    <Uploader projectId={projectId} />

                    {/* Gallery Grid */}
                    <div className="mt-8">
                        <h3 className="text-lg font-light text-white mb-4">Galeria <span className="text-zinc-500 text-sm ml-2">({images?.length})</span></h3>

                        {images && images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((img: any) => (
                                    <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                                        <img src={img.thumb_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            {/* Actions */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-zinc-600 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800 font-mono text-sm">
                                Aguardando input visual...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
