import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

    return (
        <DashboardShell>
            <div className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500">
            <h1 className="text-3xl font-light text-white mb-2">Meu Perfil</h1>
            <p className="text-zinc-500 mb-8">Gerencie sua identidade editorial e informações de acesso.</p>
            <ProfileForm profile={profile} userEmail={user.email!} />
            </div>
        </DashboardShell>
    )
}
