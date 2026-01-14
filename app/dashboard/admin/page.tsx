import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateUserRole } from './actions'
import { Shield, ShieldAlert, User } from 'lucide-react'
import { CreateUserForm } from './create-user-form'
import { UserAvatar } from '@/components/user-avatar'
import { UserActionsDropdown } from './user-actions'

export default async function AdminPage() {
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
        redirect('/dashboard')
    }

    // Fetch all users
    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-white tracking-wide">Gestão de Acessos</h1>
                    <p className="text-zinc-500 mt-1">
                        Gerencie perfis e permissões de acesso ao sistema.
                    </p>
                </div>
                <CreateUserForm />
            </div>

            {/* <CreateUserForm /> renders a button initially, keeps layout clean */}


            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-zinc-400 font-medium">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Papel (Role)</th>
                            <th className="px-6 py-4">Data de Cadastro</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users?.map((u: any) => (
                            <tr key={u.user_id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {u.avatar_config ? (
                                            <UserAvatar config={u.avatar_config} className="w-10 h-10 rounded-full border border-white/10 shadow-sm shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-white/10 shadow-sm shrink-0">
                                                {u.nickname?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-zinc-200">{u.nickname || u.email}</span>
                                                {u.user_id === user.id && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Você</span>}
                                                {!u.onboarding_completed && <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Onboarding</span>}
                                            </div>
                                            {u.nickname && <span className="text-xs text-zinc-500">{u.email}</span>}
                                        </div>
                                    </div>
                                    {u.bio && (
                                        <div className="mt-2 text-xs text-zinc-600 max-w-xs truncate pl-14 italic">
                                            "{u.bio}"
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                        {u.role === 'admin' ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                        {u.role === 'admin' ? 'Administrador' : 'Curador'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    {u.user_id !== user.id && (
                                        <div className="flex items-center justify-end gap-3">
                                            <form action={async () => {
                                                'use server'
                                                await updateUserRole(u.user_id, u.role === 'admin' ? 'curator' : 'admin')
                                            }}>
                                                <button className="text-xs hover:underline text-zinc-400 hover:text-white transition-colors">
                                                    {u.role === 'admin' ? 'Remover Admin' : 'Promover'}
                                                </button>
                                            </form>
                                            <UserActionsDropdown userId={u.user_id} email={u.email} />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
