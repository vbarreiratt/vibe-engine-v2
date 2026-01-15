
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const email = process.argv[2]

if (!email) {
    console.error('Please provide an email as argument')
    process.exit(1)
}

async function promote() {
    console.log(`Searching for auth user: ${email}...`)

    // 1. Find User in Auth Admin API
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error('Error listing auth users:', authError)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error(`User ${email} not found in Supabase Auth. Did you sign up?`)
        console.log('Registered users:', users.map(u => u.email).join(', '))
        return
    }

    console.log(`Found Auth UID: ${user.id}`)

    // 2. Upsert Profile
    const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
            user_id: user.id,
            email: user.email,
            role: 'admin'
        })

    if (upsertError) {
        console.error('Failed to upsert profile:', upsertError)
    } else {
        console.log(`\n✅ SUCCESSO!`)
        console.log(`Usuário ${email} agora é ADMIN e tem perfil confirmado.`)
        console.log(`Pode recarregar o Dashboard.`)
    }
}

promote()
