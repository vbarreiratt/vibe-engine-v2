import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from './sidebar'

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
        <div className="flex h-screen bg-zinc-950 text-white font-sans selection:bg-purple-900/50 selection:text-white overflow-hidden relative">
            <Sidebar
                email={user.email!}
                nickname={profile?.nickname}
                role={profile?.role || 'curator'}
                avatarConfig={profile?.avatar_config}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col bg-black/20">
                {children}
            </main>
        </div>
    )
}
