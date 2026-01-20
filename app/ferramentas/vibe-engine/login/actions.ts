'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error(error)
        return { error: 'Email ou senha incorretos. Por favor, tente novamente.' }
    }

    revalidatePath('/', 'layout')
    redirect('/ferramentas/vibe-engine/dashboard')
}

// Signup Disabled per user requirement
// export async function signup(formData: FormData) { ... }
