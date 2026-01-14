import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutGrid, Users } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

    return (
        <div className="flex min-h-screen flex-col bg-zinc-950 text-white font-sans selection:bg-purple-900/50 selection:text-white">
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <div className="mr-8 flex items-center space-x-2 cursor-default select-none">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
                        <span className="font-bold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Vibe Engine</span>
                    </div>
                    <nav className="flex items-center space-x-1 sm:space-x-4 text-sm font-medium">
                        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md transition-all hover:bg-white/5 text-zinc-400 hover:text-white">
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline-block">Projetos</span>
                        </Link>
                        {profile?.role === 'admin' && (
                            <Link href="/dashboard/admin" className="flex items-center gap-2 px-3 py-2 rounded-md transition-all hover:bg-white/5 text-zinc-400 hover:text-white">
                                <Users className="w-4 h-4" />
                                <span className="hidden sm:inline-block">Gestão</span>
                            </Link>
                        )}
                    </nav>
                    <div className="ml-auto flex items-center space-x-4">
                        <span className="text-xs text-zinc-500 font-mono hidden md:inline-block border border-white/5 px-2 py-1 rounded bg-white/[0.02]">
                            {user.email} <span className="opacity-50">· {profile?.role}</span>
                        </span>
                        <form action="/auth/signout" method="post">
                            <button className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors text-zinc-400">
                                <LogOut className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}
