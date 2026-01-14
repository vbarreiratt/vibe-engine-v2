import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProjectScans } from '../scan/actions' // Adjust path if needed, this file is in project/[id]/signals/
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ScanSelector } from './scan-selector'

export default async function SignalsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const projectId = (await params).id

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get all available scans
    const { scans } = await getProjectScans(projectId)

    // If no scans exist, show empty state
    if (!scans || scans.length === 0) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-light text-white">Sinais</h1>
                        <p className="text-zinc-500 text-sm">Atribua sinais (Estado, Matéria, Movimento) às imagens</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="text-zinc-500 mb-2 font-medium">Nenhuma Varredura Disponível</div>
                    <p className="text-zinc-600 text-sm max-w-xs text-center mb-6">
                        Você precisa criar uma varredura antes de atribuir sinais às imagens.
                    </p>
                    <Link
                        href={`/dashboard/project/${projectId}/scan`}
                        className="px-6 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400 transition-colors"
                    >
                        Iniciar Varredura
                    </Link>
                </div>
            </div>
        )
    }

    // Show selector
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-light text-white">Sinais</h1>
                    <p className="text-zinc-500 text-sm">Selecione uma varredura para gerenciar sinais</p>
                </div>
            </div>

            <ScanSelector scans={scans as any} projectId={projectId} />
        </div>
    )
}
