// app/system/page.tsx
// Redirecionamento inteligente: dashboard se autenticado, login se não

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SystemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se usuário estiver autenticado, vai para o dashboard
  // Se não estiver, vai para o login
  redirect(user ? '/dashboard' : '/login')
}
