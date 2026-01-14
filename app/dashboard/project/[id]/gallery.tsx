'use client'

import { useState, useMemo } from 'react'
import { Filter, User, Globe } from 'lucide-react'

type Image = {
    id: string
    thumb_url: string
    created_by: string
    ingestions?: {
        visibility: string
    } | null
}

export function ProjectGallery({ images, currentUserId }: { images: Image[], currentUserId: string }) {
    const [filter, setFilter] = useState<'mine' | 'project'>('mine')

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
                    {filteredImages.map((img) => (
                        <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                            <img
                                src={img.thumb_url}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                {img.created_by === currentUserId && (
                                    <span className="text-[10px] text-white/50 font-mono">Enviado por você</span>
                                )}
                            </div>
                        </div>
                    ))}
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
