import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Folder } from 'lucide-react';
import { DeleteProjectButton } from './delete-project-button';
import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
    const supabase = await createClient()

    // RLS will filter projects automatically
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    return (
        <DashboardShell>
            <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-white tracking-wide">
                        {isAdmin ? 'Todos os Projetos' : 'Meus Projetos'}
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        {isAdmin ? 'Gerencie e monitore todos os fluxos de vibe.' : 'Acesse seus projetos designados.'}
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/projects/new" className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <Plus className="w-4 h-4" />
                        Novo Projeto
                    </Link>
                )}
            </div>

            {!projects || projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                        <Folder className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">Nenhum projeto encontrado</h3>
                    <p className="text-zinc-500 mb-6 max-w-xs text-center">
                        {isAdmin ? 'Crie um projeto para começar a curadoria.' : 'Você ainda não foi designado a nenhum projeto.'}
                    </p>
                    {isAdmin && (
                        <Link href="/dashboard/projects/new" className="text-sm font-medium text-white px-4 py-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors">
                            Criar Projeto
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                        <Link key={project.id} href={`/dashboard/project/${project.id}`} className="group relative block p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                            <div className="relative space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${project.status === 'active' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-zinc-700 text-zinc-500 bg-zinc-800/50'}`}>
                                        {project.status === 'active' ? 'Ativo' : 'Arquivado'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-600 font-mono tracking-tight opacity-50 group-hover:opacity-100 transition-opacity">
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </span>
                                        {isAdmin && (
                                            <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DeleteProjectButton projectId={project.id} projectName={project.name} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-white mb-2 group-hover:text-purple-300 transition-colors">{project.name}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                                        {project.description || "Sem descrição definida."}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center text-xs text-zinc-500 gap-2">
                                    <div className="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-purple-500 transition-colors" />
                                    <span>Entrar no fluxo</span>
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
