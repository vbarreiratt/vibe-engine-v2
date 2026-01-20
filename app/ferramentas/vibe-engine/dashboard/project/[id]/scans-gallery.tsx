'use client'

import { useState } from 'react'
import { Eye, Trash2, ArrowRight, Globe, Lock, Loader2, User, Calendar, Images, AlertTriangle } from 'lucide-react'
import { deleteScan } from './scan/actions'
import { useRouter } from 'next/navigation'

interface Scan {
    id: string
    name: string
    visibility: 'public' | 'private'
    curator_id: string
    curator: { nickname: string | null, email: string } | null
    image_count: number
    created_at: string
}

interface ScansGalleryProps {
    projectId: string
    scans: Scan[]
    currentUserId: string
    isAdmin: boolean
}

export function ScansGallery({ projectId, scans, currentUserId, isAdmin }: ScansGalleryProps) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleUse = (scanId: string) => {
        router.push(`/dashboard/project/${projectId}/signals?scan=${scanId}`)
    }

    const handleView = (scanId: string) => {
        router.push(`/dashboard/project/${projectId}/scan/view/${scanId}`)
    }

    const handleDelete = async (scanId: string) => {
        setDeletingId(scanId)
        setError(null)

        const result = await deleteScan(scanId)

        setDeletingId(null)
        setConfirmDeleteId(null)

        if (result.error) {
            setError(result.error)
        } else {
            router.refresh()
        }
    }

    const canDelete = (scan: Scan) => {
        return scan.curator_id === currentUserId || isAdmin
    }

    if (scans.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                <Images className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Nenhuma varredura encontrada</p>
                <p className="text-sm">Crie sua primeira varredura selecionando imagens.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="grid gap-4">
                {scans.map((scan) => (
                    <div
                        key={scan.id}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-medium text-white truncate">{scan.name}</h3>
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

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleView(scan.id)}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                                    title="Visualizar"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>

                                {canDelete(scan) && (
                                    confirmDeleteId === scan.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(scan.id)}
                                                disabled={deletingId === scan.id}
                                                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-400 transition-colors flex items-center gap-1"
                                            >
                                                {deletingId === scan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(scan.id)}
                                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => handleUse(scan.id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-400 transition-colors"
                                >
                                    Usar
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
