"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock3,
    Loader2,
    Pen,
    SkipForward,
    AlertCircle,
    Wand2,
    X,
    Plus,
    PanelRightOpen,
    PanelRightClose,
    Maximize2,
    Minimize2
} from 'lucide-react'

// Common types
type SectionKey = 'estado' | 'materia' | 'movimento'

type TagSection = {
    label: string
    helper: string
    key: SectionKey
}

type ImageSignalState = {
    status: 'pending' | 'loading' | 'ready' | 'error'
    review: 'unreviewed' | 'approved' | 'later' | 'skipped'
    signals: Record<SectionKey, string[]>
}

interface TaggingItem {
    id: string
    thumb_url?: string | null
    original_url?: string | null
    title?: string | null
    signals?: any
}

const SECTION_CONFIG: TagSection[] = [
    {
        key: 'estado',
        label: 'Estado',
        helper: 'Como essa imagem faz você se sentir?',
    },
    {
        key: 'materia',
        label: 'Matéria',
        helper: 'Do que essa imagem parece feita?',
    },
    {
        key: 'movimento',
        label: 'Movimento',
        helper: 'Como essa imagem se comporta?',
    },
]

const BASE_SUGGESTIONS: Record<SectionKey, string[]> = {
    estado: ['intenso', 'sereno', 'hipnótico', 'tenso', 'íntimo', 'distante'],
    materia: ['neblina', 'vidro', 'metal', 'granulado', 'veludo', 'luz fria'],
    movimento: ['pulsar', 'flutuar', 'repetir', 'cortar', 'escorrer', 'vibrar'],
}

function buildMockSignals(index: number): Record<SectionKey, string[]> {
    const offset = index % 3
    return {
        estado: BASE_SUGGESTIONS.estado.slice(offset, offset + 3),
        materia: BASE_SUGGESTIONS.materia.slice(offset, offset + 3),
        movimento: BASE_SUGGESTIONS.movimento.slice(offset, offset + 3),
    }
}

export function TaggingInterface({ images, projectId }: { images: TaggingItem[], projectId: string }) {
    const router = useRouter()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [initialLoading, setInitialLoading] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Initialize state
    const [imageStates, setImageStates] = useState<Record<string, ImageSignalState>>(() => {
        const map: Record<string, ImageSignalState> = {}
        images.forEach((img, idx) => {
            map[img.id] = {
                status: 'pending',
                review: 'unreviewed',
                signals: buildMockSignals(idx),
            }
        })
        return map
    })

    // Simulate batch loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false)
            setImageStates((prev) => {
                const next = { ...prev }
                // Set first 3 to ready
                images.slice(0, 3).forEach((img) => {
                    if (next[img.id]) next[img.id].status = 'ready'
                })
                return next
            })
        }, 2000)
        return () => clearTimeout(timer)
    }, [images])

    const currentImage = images[currentIndex]
    const currentState = currentImage ? imageStates[currentImage.id] : null

    // Handlers
    const goNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex((p) => p + 1)
        }
    }, [currentIndex, images.length])

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((p) => p - 1)
        }
    }, [currentIndex])

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (e.key === 'ArrowRight') goNext()
            if (e.key === 'ArrowLeft') goPrev()
            if (e.key === ']') setIsSidebarOpen(prev => !prev) // Shortcut to toggle sidebar
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [goNext, goPrev])

    // Tag Operations
    const updateTag = (section: SectionKey, idx: number, value: string) => {
        if (!currentImage) return
        setImageStates((prev) => {
            const current = prev[currentImage.id]
            const newTags = [...current.signals[section]]
            newTags[idx] = value
            return {
                ...prev,
                [currentImage.id]: {
                    ...current,
                    signals: {
                        ...current.signals,
                        [section]: newTags,
                    },
                },
            }
        })
    }

    const removeTag = (section: SectionKey, idx: number) => {
        if (!currentImage) return
        setImageStates((prev) => {
            const current = prev[currentImage.id]
            const newTags = current.signals[section].filter((_, i) => i !== idx)
            return {
                ...prev,
                [currentImage.id]: {
                    ...current,
                    signals: {
                        ...current.signals,
                        [section]: newTags,
                    },
                },
            }
        })
    }

    const addTag = (section: SectionKey) => {
        if (!currentImage) return
        setImageStates((prev) => {
            const current = prev[currentImage.id]
            const next = {
                ...prev,
                [currentImage.id]: {
                    ...current,
                    signals: {
                        ...current.signals,
                        [section]: [...current.signals[section], ''],
                    },
                },
            }
            return next
        })
    }

    if (!currentImage) {
        return (
            <div className="text-white text-center py-10">Nenhuma imagem disponível.</div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black text-black z-[100]">
            {/* Absolute Fullscreen Image Layer */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-950">
                <img
                    src={currentImage.original_url || currentImage.thumb_url || ''} // Prefer original for fullscreen detail
                    alt={currentImage.title || ''}
                    className="w-full h-full object-contain"
                />
                
                {/* Loader Overlay */}
                {(initialLoading || currentState?.status !== 'ready') && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur z-10 flex flex-col items-center justify-center text-center px-6">
                        <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                        <h2 className="text-2xl text-white font-semibold mb-2">Lendo camada semiótica...</h2>
                    </div>
                )}
            </div>

            {/* Top Bar (Overlay) */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
                <button 
                    onClick={() => router.back()} 
                    className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur text-white rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center gap-2 pointer-events-auto">
                    <div className="px-4 py-1.5 bg-black/50 backdrop-blur rounded-full text-white text-sm font-medium border border-white/10">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>

                {/* Sidebar Toggle Button (if sidebar closed) */}
                {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="pointer-events-auto px-4 py-2 bg-white text-black rounded-full font-medium shadow-lg hover:bg-zinc-100 transition-colors flex items-center gap-2"
                    >
                        <PanelRightOpen className="w-5 h-5" />
                        Abrir Sinais
                    </button>
                )}
            </div>

            {/* Bottom Nav (Overlay) */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 pointer-events-none z-10">
                 <button 
                    onClick={goPrev}
                    className="pointer-events-auto px-6 py-3 bg-black/50 hover:bg-black/70 backdrop-blur text-white rounded-full flex items-center gap-2 transition-colors border border-white/10"
                >
                    <ArrowLeft className="w-4 h-4" /> Anterior
                </button>
                <button 
                    onClick={goNext}
                    className="pointer-events-auto px-6 py-3 bg-white hover:bg-zinc-200 text-black font-medium rounded-full flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                >
                    Próximo <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Right Sidebar (Floating) */}
            <div className={`
                absolute top-0 right-0 bottom-0 w-[480px] bg-white shadow-2xl z-20 
                transform transition-transform duration-300 ease-in-out border-l border-zinc-1000/5
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="h-full flex flex-col overflow-y-auto">
                    {/* Sidebar Header */}
                    <div className="px-8 pt-8 pb-4 flex justify-between items-start">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 w-fit rounded-full">
                                <Wand2 className="w-3 h-3 text-purple-600" />
                                <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">AI Analysis</span>
                            </div>
                            <h2 className="text-3xl font-bold text-zinc-900 leading-tight">
                                {currentImage.title || 'Imagem Sem Título'}
                            </h2>
                            <p className="text-zinc-500 font-medium">ID: {currentImage.id.slice(0, 8)}</p>
                        </div>
                        
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-900"
                        >
                            <PanelRightClose className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="h-px bg-zinc-100 mx-8 my-2" />

                    {/* Tags Sections */}
                    <div className="px-8 py-6 space-y-10 flex-1">
                         {SECTION_CONFIG.map((section) => {
                            const disabled = currentState?.status !== 'ready'
                            const tags = currentState?.signals[section.key] || []

                            return (
                                <div key={section.key} className="space-y-4">
                                    <div className="flex items-baseline justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-zinc-900">{section.label}</h3>
                                            <p className="text-sm text-zinc-500 font-medium mt-0.5">{section.helper}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {tags.map((tag, idx) => (
                                            <div
                                                key={`${section.key}-${idx}`}
                                                className="group relative"
                                            >
                                                <div className="absolute inset-0 bg-zinc-900 rounded-xl transform transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                                                <div className="relative bg-white border-2 border-zinc-900 text-zinc-900 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-lg transform transition-transform group-hover:-translate-y-0.5 group-active:translate-x-0 group-active:translate-y-0">
                                                    <input
                                                        value={tag}
                                                        onChange={(e) => updateTag(section.key, idx, e.target.value)}
                                                        disabled={disabled}
                                                        className="bg-transparent border-none focus:outline-none w-auto min-w-[20px] p-0 font-bold" 
                                                        style={{ width: `${Math.max(tag.length, 1) + 1}ch` }}
                                                    />
                                                    <button
                                                        onClick={() => removeTag(section.key, idx)}
                                                        className="opacity-20 hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {!disabled && (
                                            <button
                                                onClick={() => addTag(section.key)}
                                                className="px-4 py-2 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors font-bold text-lg flex items-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer - Raw Data View Toggle or similar */}
                    <div className="p-8 bg-zinc-50 border-t border-zinc-100">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                            <Clock3 className="w-4 h-4" />
                            <span>Tempo de leitura: 0.8s</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
