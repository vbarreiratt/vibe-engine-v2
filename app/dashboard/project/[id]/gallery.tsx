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

    const filteredImages = useMemo(() => {
        if (filter === 'mine') {
            return images.filter(img => img.created_by === currentUserId)
        } else {
            // "Project" means explicit Public Ingestions (from everyone)
            // Or should it mean "All I can see"? The user said "referencias do projeto" vs "minhas".
            // Generally "Project" implies shared context.
            // Let's allow All Public images.
            return images.filter(img => img.ingestions?.visibility === 'public')
        }
    }, [images, filter, currentUserId])

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Essa ação não pode ser desfeita.')) return
        setDeletingId(id)
        try {
            await deleteImage(projectId, id)
        } catch (e) {
            alert('Erro ao deletar imagem')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-light text-white flex items-center gap-2">
                    Galeria
                    <span className="text-zinc-500 text-sm">({filteredImages.length})</span>
                </h3>

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

                        return (
                            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                                <img
                                    src={img.thumb_url}
                                    alt=""
                                    loading="lazy"
                                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100 ${isDeleting ? 'opacity-20 grayscale' : ''}`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    {canDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(img.id)
                                            }}
                                            disabled={isDeleting}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white/50 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                                            title="Remover imagem"
                                        >
                                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    )}
                                    {img.created_by === currentUserId && (
                                        <span className="text-[10px] text-white/50 font-mono">Enviado por você</span>
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
