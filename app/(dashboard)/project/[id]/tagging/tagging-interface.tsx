'use client'

import { useState } from 'react'
import { processImageTags, updateImageTags } from './actions'
import { Sparkles, Edit2, X, Plus, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ImageTags {
    state: string[]
    matter: string[]
    movement: string[]
}

interface TaggingItem {
    id: string
    thumb_url: string
    original_url: string
    signals?: ImageTags | null
}

export function TaggingInterface({ images, projectId }: { images: TaggingItem[], projectId: string }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [activeImage, setActiveImage] = useState<TaggingItem | null>(images[0] || null)

    const handleGenerate = async () => {
        if (!activeImage) return
        setIsGenerating(true)
        try {
            const newTags = await processImageTags(projectId, activeImage.id, activeImage.original_url)
            setActiveImage(prev => prev ? ({ ...prev, signals: newTags }) : null)
        } catch (e) {
            console.error(e)
            alert('Erro ao gerar tags.')
        } finally {
            setIsGenerating(false)
        }
    }

    const nextImage = () => {
        if (currentIndex < images.length - 1) {
            const next = currentIndex + 1
            setCurrentIndex(next)
            setActiveImage(images[next])
        }
    }

    if (!activeImage) return <div className="text-zinc-500">Nenhuma imagem aprovada para etiquetagem.</div>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
            {/* Image View */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center group">
                <img src={activeImage.original_url} className="max-w-full max-h-full object-contain" />

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs text-zinc-400 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{currentIndex + 1} / {images.length}</span>
                    <span>ID: {activeImage.id.slice(0, 8)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">

                {/* Actions */}
                <div className="flex gap-4">
                    {!activeImage.signals ? (
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={cn(
                                "flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all",
                                isGenerating ? "bg-zinc-800 text-zinc-500" : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            )}
                        >
                            {isGenerating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {isGenerating ? 'Lendo Sinais...' : 'Gerar Sinais com IA'}
                        </button>
                    ) : (
                        <div className="flex-1 flex gap-2">
                            <button onClick={handleGenerate} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">
                                Regenerar
                            </button>
                            <button onClick={nextImage} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2">
                                <Check className="w-5 h-5" />
                                Aprovar & Próximo
                            </button>
                        </div>
                    )}
                </div>

                {/* Tags Display */}
                {activeImage.signals && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <TagCategory
                            title="Estado"
                            description="Como faz sentir"
                            tags={activeImage.signals.state}
                            color="text-blue-400"
                            borderColor="border-blue-500/20"
                            bgColor="bg-blue-500/10"
                        />
                        <TagCategory
                            title="Matéria"
                            description="Do que parece feito"
                            tags={activeImage.signals.matter}
                            color="text-amber-400"
                            borderColor="border-amber-500/20"
                            bgColor="bg-amber-500/10"
                        />
                        <TagCategory
                            title="Movimento"
                            description="Como se comporta"
                            tags={activeImage.signals.movement}
                            color="text-rose-400"
                            borderColor="border-rose-500/20"
                            bgColor="bg-rose-500/10"
                        />
                    </motion.div>
                )}

                {/* Instructions */}
                {!activeImage.signals && !isGenerating && (
                    <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 text-zinc-500 text-sm space-y-4">
                        <p>O modelo irá ler a imagem em 3 camadas semióticas.</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Estado (sensação)</li>
                            <li>Matéria (textura)</li>
                            <li>Movimento (ação)</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

function TagCategory({ title, description, tags, color, borderColor, bgColor }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                <h3 className={cn("text-sm font-medium uppercase tracking-wider", color)}>{title}</h3>
                <span className="text-xs text-zinc-600">{description}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                    <div key={tag} className={cn("px-3 py-1.5 rounded-md border text-sm flex items-center gap-2 group cursor-default", borderColor, bgColor, color)}>
                        <span>{tag}</span>
                        {/* Edit logic would go here */}
                    </div>
                ))}
            </div>
        </div>
    )
}
