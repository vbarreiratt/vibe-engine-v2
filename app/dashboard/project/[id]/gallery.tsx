'use client'

import { useState, useMemo } from 'react'
import { Filter, User, Globe, Trash2, Loader2 } from 'lucide-react'
import { deleteImage } from './actions'

type Image = {
    id: string
    thumb_url: string
    created_by: string
    ingestions?: {
        visibility: string
    } | null
}

export function ProjectGallery({ images, currentUserId, projectId, isAdmin }: { images: Image[], currentUserId: string, projectId: string, isAdmin: boolean }) {
    const [filter, setFilter] = useState<'mine' | 'project'>('mine')
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const filteredImages = useMemo(() => {
        if (filter === 'mine') {
            return images.filter(img => img.created_by === currentUserId)
        } else {
            return images.filter(img => img.ingestions?.visibility === 'public')
        }
    }, [images, filter, currentUserId])

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDeletingId(id)
        setError(null)
        try {
            const result = await deleteImage(projectId, id)
            if (result && 'error' in result && result.error) {
                setError(result.error)
            }
        } catch (e: any) {
            setError(e.message || 'Erro ao deletar imagem')
        } finally {
            setDeletingId(null)
            setConfirmDeleteId(null)
        }
    }

    const cancelDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setConfirmDeleteId(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-light text-white flex items-center gap-2">
                        Galeria
                        <span className="text-zinc-500 text-sm">({filteredImages.length})</span>
                    </h3>
                    {error && (
                        <p className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-in fade-in">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setFilter('mine')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'mine'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <User className="w-3 h-3" />
                        Minhas
                    </button>
                    <button
                        onClick={() => setFilter('project')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'project'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <Globe className="w-3 h-3" />
                        Do Projeto
                    </button>
                </div>
            </div>

            {filteredImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                    {filteredImages.map((img) => {
                        const canDelete = isAdmin || img.created_by === currentUserId
                        const isDeleting = deletingId === img.id
                        const isConfirming = confirmDeleteId === img.id

                        return (
                            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                                <img
                                    src={img.thumb_url}
                                    alt=""
                                    loading="lazy"
                                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100 ${isDeleting ? 'opacity-20 grayscale' : ''}`}
                                />
                                <div className={`absolute inset-0 bg-black/60 transition-opacity flex flex-col items-center justify-center p-3 gap-2 ${isConfirming ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto bg-gradient-to-t from-black/80 via-transparent to-transparent'}`}>
                                    {isConfirming ? (
                                        <>
                                            <p className="text-[10px] text-white font-medium text-center leading-tight mb-1">Apagar esta imagem?</p>
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={(e) => handleDelete(img.id, e)}
                                                    className="flex-1 py-1 px-2 bg-red-500 text-white text-[10px] rounded hover:bg-red-400 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                    Sim
                                                </button>
                                                <button
                                                    onClick={cancelDelete}
                                                    className="flex-1 py-1 px-2 bg-zinc-700 text-white text-[10px] rounded hover:bg-zinc-600 transition-colors"
                                                >
                                                    Não
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {canDelete && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setConfirmDeleteId(img.id)
                                                    }}
                                                    disabled={isDeleting}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white/50 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                                                    title="Remover imagem"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {img.created_by === currentUserId && (
                                                <span className="text-[10px] text-white/50 font-mono mt-auto">Enviado por você</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20 text-zinc-600 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800 font-mono text-sm">
                    {filter === 'mine'
                        ? 'Você ainda não enviou referências.'
                        : 'Nenhuma referência pública encontrada no projeto.'}
                </div>
            )}
        </div>
    )
}
