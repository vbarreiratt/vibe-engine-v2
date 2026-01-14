import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProfileMenu } from './profile-menu'
import { LayoutGrid, Users } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Enforce Onboarding
    if (profile && !profile.onboarding_completed) {
        redirect('/onboarding')
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans selection:bg-purple-900/50 selection:text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col">
                <div className="p-6">
                    <div className="flex items-center space-x-3 cursor-default select-none mb-8">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
                        <span className="font-bold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Vibe Engine</span>
                    </div>

                    <nav className="space-y-1">
                        <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Menu Principal
                        </div>
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/5 text-zinc-400 hover:text-white group">
                            <LayoutGrid className="w-5 h-5 group-hover:text-white transition-colors" />
                            <span className="font-medium">Projetos</span>
                        </Link>
                        {profile?.role === 'admin' && (
                            <Link href="/dashboard/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/5 text-zinc-400 hover:text-white group">
                                <Users className="w-5 h-5 group-hover:text-white transition-colors" />
                                <span className="font-medium">Gestão</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-white/5 bg-zinc-900/20">
                    <ProfileMenu
                        email={user.email!}
                        nickname={profile?.nickname}
                        role={profile?.role || 'curator'}
                        avatarConfig={profile?.avatar_config}
                    />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-black/20">
                <div className="container max-w-7xl mx-auto px-8 py-10">
                    {children}
                </div>
            </main>
        </div>
    )
}
