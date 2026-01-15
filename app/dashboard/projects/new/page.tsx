import { createClient } from '@/lib/supabase/server'
import { createProject } from '../actions'
import { redirect } from 'next/navigation'
import { FolderPlus, Users } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function NewProjectPage() {
    const supabase = await createClient()

    // Verify Admin Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return (
            <div className="p-8 text-center text-zinc-500">
                Apenas administradores podem criar projetos.
            </div>
        )
    }

    // Fetch Potential Curators (All users for now, could filter by role='curator')
    const { data: users } = await supabase
        .from('profiles')
        .select('user_id, email, role')
        .neq('user_id', user.id) // exclude self maybe? or include for self-assignment?
        .order('email')

    return (
        <DashboardShell>
            <div className="max-w-2xl mx-auto space-y-8 py-8">
            <div>
                <h1 className="text-3xl font-light text-white tracking-wide flex items-center gap-3">
                    <FolderPlus className="w-8 h-8 text-zinc-400" />
                    Novo Projeto
                </h1>
                <p className="text-zinc-500 mt-2">
                    Inicie um novo fluxo de curadoria e designe os responsáveis.
                </p>
            </div>

            <form action={createProject} className="space-y-8 bg-zinc-900/30 p-8 rounded-2xl border border-white/5">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Nome do Projeto</label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="Ex: Campanha Verão 2025"
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-zinc-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Descrição (Opcional)</label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Contexto, objetivo e briefing inicial..."
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-zinc-700 resize-none"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <Users className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-medium text-white">Atribuir Curadores</h3>
                    </div>

                    <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {users && users.length > 0 ? (
                            users.map(u => (
                                <label key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 cursor-pointer transition-colors group">
                                    <input type="checkbox" name="members" value={u.user_id} className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500/20 focus:ring-offset-0" />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-zinc-300 group-hover:text-white">{u.email}</span>
                                        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{u.role}</span>
                                    </div>
                                </label>
                            ))
                        ) : (
                            <p className="text-sm text-zinc-600 italic">Nenhum outro usuário encontrado no sistema.</p>
                        )}
                    </div>
                    <p className="text-xs text-zinc-500">
                        Usuários selecionados terão acesso imediato a este projeto.
                    </p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <a href="/dashboard" className="px-6 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        Cancelar
                    </a>
                    <button type="submit" className="px-6 py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        Criar Projeto
                    </button>
                </div>
            </form>
            </div>
        </DashboardShell>
    )
}
