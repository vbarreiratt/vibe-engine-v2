'use client'

import { useRouter } from 'next/navigation'
import { Globe, Lock, User, Calendar, Images, ArrowRight } from 'lucide-react'

interface Scan {
    id: string
    name: string
    visibility: 'public' | 'private'
    curator: { nickname: string | null, email: string } | null
    image_count: number
    created_at: string
}

export function ScanSelector({ scans, projectId }: { scans: Scan[], projectId: string }) {
    const router = useRouter()

    const handleSelect = (scanId: string) => {
        router.push(`/dashboard/project/${projectId}/signals?scan=${scanId}`)
    }

    return (
        <div className="space-y-4">
            <div className="text-center py-8">
                <h2 className="text-xl font-medium text-white mb-2">Selecione uma Varredura</h2>
                <p className="text-zinc-500 text-sm">Escolha qual varredura você quer usar para atribuir sinais</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
                {scans.map((scan) => (
                    <button
                        key={scan.id}
                        onClick={() => handleSelect(scan.id)}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-purple-500/50 transition-all text-left group"
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

                            <div className="ml-4 text-zinc-600 group-hover:text-purple-400 transition-colors">
                                <ArrowRight className="w-6 h-6" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
