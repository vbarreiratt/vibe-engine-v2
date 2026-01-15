'use client'
import { useRouter } from 'next/navigation'
import { Globe, Lock, User, Calendar, Images, ArrowRight } from 'lucide-react'
import { deleteScan } from '../scan/actions'
import { DeleteWithConfirmation } from '@/components/delete-with-confirmation'

interface Scan {
    id: string
    name: string
    visibility: 'public' | 'private'
    curator_id: string
    curator: { nickname: string | null, email: string } | null
    image_count: number
    signals_run_count?: number
    created_at: string
}

export function ScanSelector({ scans, projectId, currentUserId }: { scans: Scan[], projectId: string, currentUserId: string }) {
    const router = useRouter()

    const handleSelect = (scanId: string) => {
        router.push(`/dashboard/project/${projectId}/signals/${scanId}`)
    }

    const handleDelete = async (scanId: string) => {
        const result = await deleteScan(scanId)
        if (result && !result.error) {
            router.refresh()
        }
        return result
    }

    return (
        <div className="space-y-4">
            <div className="text-center py-8">
                <h2 className="text-xl font-medium text-white mb-2">Selecione uma Varredura</h2>
                <p className="text-zinc-500 text-sm">Escolha qual varredura você quer usar para atribuir sinais</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
                {scans.map((scan) => (
                    <div
                        key={scan.id}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-purple-500/50 transition-all group relative cursor-pointer"
                        onClick={() => handleSelect(scan.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-medium text-white group-hover:text-purple-400 transition-colors truncate">
                                        {scan.name}
                                    </h3>
                                    {scan.visibility === 'public' ? (
                                        <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            <Globe className="w-3 h-3" />
                                            Pública
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                                            <Lock className="w-3 h-3" />
                                            Privada
                                        </span>
                                    )}
                                    {/* Run Badge */}
                                    {!!scan.signals_run_count && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">
                                            {scan.signals_run_count} leituras
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        {scan.curator?.nickname || scan.curator?.email || 'Desconhecido'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Images className="w-4 h-4" />
                                        {scan.image_count} imagens
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(scan.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>

                            <div className="ml-4 flex items-center gap-3">
                                {/* Delete Button - Only for Curator */}
                                {scan.curator_id === currentUserId && (
                                    <DeleteWithConfirmation
                                        title="Excluir Varredura"
                                        description={<span>Tem certeza que deseja excluir <strong>{scan.name}</strong>?</span>}
                                        warning="Todas as leituras associadas também serão excluídas."
                                        onDelete={() => handleDelete(scan.id)}
                                        triggerClassName="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    />
                                )}
                                <div className="text-zinc-600 group-hover:text-purple-400 transition-colors">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
