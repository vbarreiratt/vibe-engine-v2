'use client'

import { useState } from 'react'
import { Check, Loader2, Layers, RotateCcw, X, Image as ImageIcon } from 'lucide-react'
import { batchSubmitScan } from './actions'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageItem {
    id: string
    thumb_url: string
}

export function ScanGrid({ images, projectId }: { images: ImageItem[], projectId: string }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSelectionMenu, setShowSelectionMenu] = useState(false)

    // To handle optimistic removal after submit involves clearing this list localy
    // But since we use router.refresh in action, it might handle itself.
    // However, for smooth UX, we might want to wait.

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
            // The page will reload/revalidate, showing empty grid ideally
        } catch (e) {
            alert('Erro ao salvar varredura')
            setIsSubmitting(false)
        }
    }

    // Filter images for the "Selected Menu"
    const selectedImages = images.filter(img => selectedIds.has(img.id))

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
                    <span>{images.length} imagens pendentes</span>
                    {selectedIds.size > 0 && (
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
                {images.map(img => {
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

                {/* Toggle Selection Menu */}
                {selectedIds.size > 0 && (
                    <button
                        onClick={() => setShowSelectionMenu(!showSelectionMenu)}
                        className={`p-2 rounded-full transition-colors ${showSelectionMenu ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-400'}`}
                        title="Ver selecionadas"
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

            {/* Selection Menu Drawer */}
            <AnimatePresence>
                {showSelectionMenu && selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 w-[90vw] max-w-3xl max-h-[300px] overflow-hidden z-30 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                            <h4 className="text-sm font-medium text-white">Itens Selecionados ({selectedIds.size})</h4>
                            <button onClick={() => setShowSelectionMenu(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
                            <div className="flex gap-3 h-full">
                                {selectedImages.map(img => (
                                    <div key={img.id} className="relative aspect-square h-full min-h-[100px] rounded-lg overflow-hidden border border-emerald-500/30 flex-shrink-0 group">
                                        <img src={img.thumb_url} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => toggleSelection(img.id)}
                                            className="absolute top-1 right-1 p-1 bg-black/60 text-white/70 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
