'use client'

import { useState } from 'react'
import { Check, X, RotateCcw } from 'lucide-react'
import { submitScanDecision } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ImageItem {
    id: string
    thumb_url: string
}

export function ScanGrid({ images, projectId }: { images: ImageItem[], projectId: string }) {
    const [items, setItems] = useState(images)
    const [history, setHistory] = useState<ImageItem[]>([])

    const handleDecision = async (id: string, decision: 'vibra' | 'nao_vibra') => {
        // Optimistic Update
        const item = items.find(i => i.id === id)
        if (!item) return

        setItems(prev => prev.filter(i => i.id !== id))
        setHistory(prev => [item, ...prev])

        try {
            await submitScanDecision(projectId, id, decision)
        } catch (e) {
            console.error(e)
            // Rollback if needed (simple MVP: alert)
            alert('Failed to save decision')
        }
    }

    const undo = () => {
        if (history.length === 0) return
        const last = history[0]
        setHistory(prev => prev.slice(1))
        setItems(prev => [last, ...prev])
        // Note: We don't revert server state in this simple undo for MVP, 
        // but ideally we should set status back to pending.
        // For now, this is just a client-side visual undo before refresh.
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                <div className="text-zinc-500 mb-2">Tudo limpo!</div>
                <p className="text-zinc-600 text-sm">Você categorizou todas as imagens pendentes.</p>
                <div className="mt-6 flex gap-3">
                    <a href={`/dashboard/project/${projectId}`} className="px-4 py-2 bg-zinc-800 text-white rounded text-sm hover:bg-zinc-700">Voltar ao Projeto</a>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between text-zinc-500 text-sm">
                <span>{items.length} imagens restantes</span>
                <button onClick={() => window.location.reload()} className="hover:text-white flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Atualizar
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <AnimatePresence mode="popLayout">
                    {items.map((img) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                            key={img.id}
                            className="group relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden shadow-xl border border-zinc-800"
                        >
                            <img src={img.thumb_url} className="w-full h-full object-cover" loading="lazy" />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => handleDecision(img.id, 'nao_vibra')}
                                        className="p-3 rounded-full bg-zinc-800/80 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 backdrop-blur-sm transition-all border border-white/5"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDecision(img.id, 'vibra')}
                                        className="p-3 rounded-full bg-zinc-800/80 hover:bg-emerald-500/20 hover:text-emerald-400 text-zinc-400 backdrop-blur-sm transition-all border border-white/5"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
