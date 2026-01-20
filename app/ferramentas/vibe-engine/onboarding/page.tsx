import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './wizard'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role, onboarding_completed').eq('user_id', user.id).single()

    // Redirect if already completed
    if (profile?.onboarding_completed) redirect('/dashboard')

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-black" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" /> {/* Noise texture assumption or fallback to css */}

            <div className="relative z-10 w-full flex justify-center">
                <OnboardingWizard role={profile?.role || 'curator'} userEmail={user.email!} />
            </div>
        </div>
    )
}
