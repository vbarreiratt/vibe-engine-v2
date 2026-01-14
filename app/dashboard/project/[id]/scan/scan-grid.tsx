'use client'

import { useState } from 'react'
import { Check, Loader2, Layers, RotateCcw } from 'lucide-react'
import { batchSubmitScan } from './actions'

interface ImageItem {
    id: string
    thumb_url: string
}

export function ScanGrid({ images, projectId }: { images: ImageItem[], projectId: string }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filter State
    const [showOnlySelected, setShowOnlySelected] = useState(false)

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }

    const handleFinish = async () => {
        if (images.length === 0) return
        setIsSubmitting(true)

        // Selected = Vibra
        // Others = Nao Vibra
        const decisions = images.map(img => ({
            imageId: img.id,
            status: selectedIds.has(img.id) ? 'vibra' : 'nao_vibra'
        })) as { imageId: string, status: 'vibra' | 'nao_vibra' }[]

        try {
            await batchSubmitScan(projectId, decisions)
        } catch (e) {
            alert('Erro ao salvar varredura')
            setIsSubmitting(false)
        }
    }

    // Determine what to show in grid
    const visibleImages = showOnlySelected
        ? images.filter(img => selectedIds.has(img.id))
        : images

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                    <Check className="w-8 h-8" />
                </div>
                <div className="text-zinc-500 mb-2 font-medium">Tudo Pronto!</div>
                <p className="text-zinc-600 text-sm max-w-xs text-center">
                    Não há mais imagens pendentes para varredura neste escopo.
                </p>
                <div className="mt-6">
                    <a href={`/dashboard/project/${projectId}`} className="px-4 py-2 bg-zinc-800 text-white rounded-md text-sm hover:bg-zinc-700 transition-colors">
                        Voltar ao Projeto
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-[50vh]">
            <div className="flex items-center justify-between text-zinc-500 text-sm mb-6">
                <div className="flex items-center gap-4">
                    <span>{showOnlySelected ? `Visualizando ${visibleImages.length} selecionadas` : `${images.length} imagens totais`}</span>
                    {selectedIds.size > 0 && !showOnlySelected && (
                        <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {selectedIds.size} selecionadas
                        </span>
                    )}
                </div>
                <button onClick={() => window.location.reload()} className="hover:text-white flex items-center gap-1 transition-colors">
                    <RotateCcw className="w-3 h-3" /> <span className="text-xs">Atualizar</span>
                </button>
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-32 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                {visibleImages.map(img => {
                    const isSelected = selectedIds.has(img.id)
                    return (
                        <div
                            key={img.id}
                            onClick={() => toggleSelection(img.id)}
                            className={`
                                group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all duration-200
                                ${isSelected
                                    ? 'ring-4 ring-emerald-500 scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                    : 'ring-1 ring-white/5 hover:ring-white/20 hover:scale-[1.02]'
                                }
                            `}
                        >
                            <img src={img.thumb_url} className="w-full h-full object-cover" loading="lazy" />

                            <div className={`absolute inset-0 bg-emerald-500/20 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'}`} />

                            {/* Check Icon Overlay */}
                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 text-white scale-100' : 'bg-black/40 text-white/20 scale-90 group-hover:scale-100'}`}>
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-white/10 p-2 pl-4 rounded-full shadow-2xl animate-in slide-in-from-bottom-10">
                <span className="text-sm text-zinc-400 mr-2 hidden sm:inline">
                    <span className="text-white font-medium">{selectedIds.size}</span> vibram
                </span>

                {/* Toggle View Mode Button */}
                {selectedIds.size > 0 && (
                    <button
                        onClick={() => setShowOnlySelected(!showOnlySelected)}
                        className={`p-2 rounded-full transition-colors ${showOnlySelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
                        title={showOnlySelected ? "Ver todas" : "Filtrar selecionadas"}
                    >
                        <Layers className="w-5 h-5" />
                    </button>
                )}

                <div className="h-6 w-px bg-white/10 mx-1" />

                <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-sm font-medium transition-colors shadow-lg shadow-white/5 flex items-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Concluir Varredura
                </button>
            </div>
        </div>
    )
}
