import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProjectScans, getScanWithImages } from '../scan/actions'
import { ArrowLeft, Images, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ScanSelector } from './scan-selector'

export default async function SignalsPage({ params, searchParams }: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ scan?: string }>
}) {
    const supabase = await createClient()
    const projectId = (await params).id
    const selectedScanId = (await searchParams).scan

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

    // If no scan selected, show selector
    if (!selectedScanId) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-light text-white">Sinais</h1>
                        <p className="text-zinc-500 text-sm">Selecione uma varredura para atribuir sinais</p>
                    </div>
                </div>

                <ScanSelector scans={scans as any} projectId={projectId} />
            </div>
        )
    }

    // Get scan images
    const scanResult = await getScanWithImages(selectedScanId)

    if (scanResult.error) {
        redirect(`/dashboard/project/${projectId}/signals`)
    }

    const { scan, images } = scanResult

    // Audit: using scan for signals
    await supabase.from('audit_log').insert({
        project_id: projectId,
        entity_type: 'scan',
        entity_id: selectedScanId,
        action_type: 'use_scan_for_signals',
        actor_user_id: user.id
    })

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-light text-white">Sinais: {scan?.name}</h1>
                        <p className="text-zinc-500 text-sm flex items-center gap-2">
                            <Images className="w-4 h-4" />
                            {images?.length || 0} imagens nesta varredura
                        </p>
                    </div>
                </div>
                <Link
                    href={`/dashboard/project/${projectId}/signals`}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                    Trocar varredura
                </Link>
            </div>

            {/* TODO: Signal tagging interface */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images?.map((img: any) => (
                    <div
                        key={img.id}
                        className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/50 transition-colors cursor-pointer group"
                    >
                        <img
                            src={img.thumb_url || img.original_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        />
                    </div>
                ))}
            </div>

            <div className="text-center py-8 text-zinc-600">
                <p>Interface de atribuição de sinais em construção...</p>
            </div>
        </div>
    )
}
