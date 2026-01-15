'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Layers, RotateCcw, Maximize2, X, ChevronLeft, ChevronRight, Keyboard, Save } from 'lucide-react'
import { batchSubmitScan } from './actions'
import { SaveScanModal } from './save-scan-modal'

interface ImageItem {
    id: string
    thumb_url: string
}

export function ScanGrid({ images, projectId }: { images: ImageItem[], projectId: string }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filter State
    const [showOnlySelected, setShowOnlySelected] = useState(false)

    // Stage Mode State
    const [isStageMode, setIsStageMode] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    // Save Modal State
    const [showSaveModal, setShowSaveModal] = useState(false)

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }

    const setSelection = (id: string, vibra: boolean) => {
        const next = new Set(selectedIds)
        if (vibra) next.add(id)
        else next.delete(id)
        setSelectedIds(next)
    }

    const handleFinish = () => {
        if (selectedIds.size === 0) {
            alert('Selecione ao menos uma imagem que vibra')
            return
        }
        setShowSaveModal(true)
    }

    // Keyboard Handler
    useEffect(() => {
        if (!isStageMode) return

        const handleKeyDown = (e: KeyboardEvent) => {
            const currentImg = images[currentIndex]
            if (!currentImg) return

            if (e.key.toLowerCase() === 'v') {
                setSelection(currentImg.id, true)
                if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1)
            }
            if (e.key.toLowerCase() === 'n') {
                setSelection(currentImg.id, false)
                if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1)
            }
            if (e.key === 'ArrowRight') {
                if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1)
            }
            if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
            }
            if (e.key === 'Escape') setIsStageMode(false)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isStageMode, currentIndex, images, setSelection]) // selectedIds not strictly needed in dep array for setter function form if used, but direct set needs it? No, setSelection reads state properly if updated. Actually closure might be stale.
    // Including selectedIds in deps means effect re-binds on every selection. Acceptable for this scale.

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

    // STAGE MODE RENDER
    if (isStageMode && images[currentIndex]) {
        const currentImg = images[currentIndex]
        const isSelected = selectedIds.has(currentImg.id)

        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-zinc-900/50 backdrop-blur border-b border-white/5">
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span className="font-mono text-white">{currentIndex + 1} / {images.length}</span>
                        <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded hidden md:flex">
                            <Keyboard className="w-3 h-3" />
                            <span>V = Vibra, N = Não, Setas = Navegar, Esc = Sair</span>
                        </div>
                    </div>
                    <button onClick={() => setIsStageMode(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                    <div className="relative h-full w-full flex items-center justify-center">
                        <img
                            src={currentImg.thumb_url}
                            className={`max-h-full max-w-full object-contain shadow-2xl rounded-lg transition-all duration-200 ${isSelected ? 'ring-4 ring-emerald-500' : ''}`}
                        />
                        {isSelected && (
                            <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full font-medium shadow-xl flex items-center gap-2 animate-in zoom-in">
                                <Check className="w-4 h-4" /> Vibra
                            </div>
                        )}
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={() => currentIndex > 0 && setCurrentIndex(curr => curr - 1)}
                        className="absolute left-4 p-4 rounded-full bg-black/50 hover:bg-white/10 text-white transition-colors disabled:opacity-0"
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={() => currentIndex < images.length - 1 && setCurrentIndex(curr => curr + 1)}
                        className="absolute right-4 p-4 rounded-full bg-black/50 hover:bg-white/10 text-white transition-colors disabled:opacity-0"
                        disabled={currentIndex === images.length - 1}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </div>

                {/* Controls Footer */}
                <div className="p-6 bg-zinc-900 border-t border-white/5 flex justify-center gap-6">
                    <button
                        onClick={() => {
                            setSelection(currentImg.id, false)
                            if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1)
                        }}
                        className={`min-w-[140px] px-6 py-3 rounded-lg font-medium border transition-all ${!isSelected ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white'}`}
                    >
                        (N) Não Vibra
                    </button>
                    <button
                        onClick={() => {
                            setSelection(currentImg.id, true)
                            if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1)
                        }}
                        className={`min-w-[140px] px-6 py-3 rounded-lg font-medium border transition-all ${isSelected ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-zinc-800 text-white border-zinc-700 hover:bg-emerald-500/20 hover:border-emerald-500/50'}`}
                    >
                        (V) Vibra!
                    </button>
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

                {/* Stage Mode Toggle */}
                {images.length > 0 && !showOnlySelected && (
                    <button
                        onClick={() => {
                            setIsStageMode(true)
                            setCurrentIndex(0)
                        }}
                        className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                        title="Modo Palco (Teclado)"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                )}

                <div className="h-6 w-px bg-white/10 mx-1" />

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

                {(selectedIds.size > 0 || isStageMode) && <div className="h-6 w-px bg-white/10 mx-1" />}

                <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-sm font-medium transition-colors shadow-lg shadow-white/5 flex items-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Concluir
                </button>
            </div>

            {/* Save Scan Modal */}
            {showSaveModal && (
                <SaveScanModal
                    projectId={projectId}
                    selectedImageIds={Array.from(selectedIds)}
                    onClose={() => setShowSaveModal(false)}
                />
            )}
        </div>
    )
}
