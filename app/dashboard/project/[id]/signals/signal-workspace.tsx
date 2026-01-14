'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2, Check, X, Plus, AlertTriangle } from 'lucide-react'
import { createSignalRun, updateSignalRun } from '../scan/actions'
import { generateImageSignals } from './ai-actions'

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

interface SignalWorkspaceProps {
    images: Array<{
        id: string
        thumb_url?: string | null
        original_url?: string | null
        title?: string | null
        signals?: {
            state?: string[],
            matter?: string[],
            movement?: string[],
            ai_description?: string,
            raw_reasoning?: string,
            model_name?: string,
            run_id?: string
        }
    }>
    projectId: string
    scanName: string
    scanId: string
    initialRunName?: string
    initialRunId?: string
}

type SectionKey = 'state' | 'matter' | 'movement'

type TagSection = {
    label: string
    helper: string
    key: SectionKey
    placeholder: string
}

type ImageSignalState = {
    status: 'pending' | 'loading' | 'ready' | 'error'
    signals: Record<SectionKey, string[]>
    ai: {
        description: string | null
        reasoning: string | null
        model: string | null
        runId: string | null
    }
    isDirty: boolean
}

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const SECTION_CONFIG: TagSection[] = [
    {
        key: 'state',
        label: 'Estado',
        helper: 'Como essa imagem faz você se sentir?',
        placeholder: 'ex: tenso, etéreo...'
    },
    {
        key: 'matter',
        label: 'Matéria',
        helper: 'Do que isso parece feito? Que textura evoca?',
        placeholder: 'ex: vidro, areia...'
    },
    {
        key: 'movement',
        label: 'Movimento',
        helper: 'Se isso se movesse, como se comportaria?',
        placeholder: 'ex: flutuar, explodir...'
    },
]

const INITIAL_BATCH_SIZE = 3
const SUBSEQUENT_BATCH_SIZE = 5

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function SignalWorkspace({ images, projectId, scanName, scanId, initialRunName, initialRunId }: SignalWorkspaceProps) {
    const router = useRouter()

    // -- STATE --
    const [currentIndex, setCurrentIndex] = useState(0)
    const [initialLoading, setInitialLoading] = useState(true)
    const [isSidebarVisible, setSidebarVisible] = useState(true)
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)

    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [showExitDialog, setShowExitDialog] = useState(false)
    const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null)
    const [runName, setRunName] = useState(initialRunName || '')
    const [visibility, setVisibility] = useState<'public' | 'private'>('private')
    const [isSavingRun, setIsSavingRun] = useState(false)
    const [saveDestination, setSaveDestination] = useState<'gallery' | 'next'>('gallery')
    const [saveOption, setSaveOption] = useState<'overwrite' | 'copy'>('overwrite')

    // Local Signals State
    const [imageStates, setImageStates] = useState<Record<string, ImageSignalState>>(() => {
        const map: Record<string, ImageSignalState> = {}
        images.forEach((img) => {
            const existing = img.signals || {}
            // Start empty if no existing AI data
            const aiData = existing.ai_description ? {
                description: existing.ai_description,
                reasoning: existing.raw_reasoning || null,
                model: existing.model_name || null,
                runId: existing.run_id || null
            } : {
                description: null,
                reasoning: null,
                model: null,
                runId: null
            }

            map[img.id] = {
                status: 'pending',
                signals: {
                    state: existing.state || [],
                    matter: existing.matter || [],
                    movement: existing.movement || []
                },
                ai: aiData,
                isDirty: false
            }
        })
        return map
    })

    const currentImage = images[currentIndex]
    const currentState = imageStates[currentImage?.id]

    // -- AI GENERATION HANDLER --
    const handleGenerateAI = async () => {
        if (!currentImage?.original_url) return

        setIsGeneratingAI(true)
        try {
            const result = await generateImageSignals(currentImage.original_url)

            if (result.error || !result.data) {
                alert('Erro na geração AI: ' + result.error)
                return
            }

            const aiData = result.data

            // Update State with AI Data and Signals
            setImageStates(prev => {
                const curr = prev[currentImage.id]
                return {
                    ...prev,
                    [currentImage.id]: {
                        ...curr,
                        isDirty: true,
                        signals: {
                            state: [...new Set([...curr.signals.state, ...(aiData.state || [])])],
                            matter: [...new Set([...curr.signals.matter, ...(aiData.matter || [])])],
                            movement: [...new Set([...curr.signals.movement, ...(aiData.movement || [])])],
                        },
                        ai: {
                            description: aiData.description,
                            reasoning: aiData.reasoning,
                            model: 'gemini-1.5-flash', // Track model
                            runId: null
                        }
                    }
                }
            })

            setSidebarVisible(true) // Ensure sidebar is visible to see results

        } catch (e) {
            console.error(e)
            alert('Falha na comunicação com AI')
        } finally {
            setIsGeneratingAI(false)
        }
    }

    // -- AUTO AI PIPELINE --
    useEffect(() => {
        // If viewing existing run, skip auto-generation
        if (initialRunId) {
            setInitialLoading(false)
            return
        }

        let isMounted = true

        const processImage = async (img: any) => {
            if (!img.original_url || !isMounted) return

            // Mark as loading
            setImageStates(prev => ({ ...prev, [img.id]: { ...prev[img.id], status: 'loading' } }))

            const result = await generateImageSignals(img.original_url)

            if (!isMounted) return

            if (result.data) {
                const aiData = result.data
                setImageStates(prev => {
                    const curr = prev[img.id]
                    return {
                        ...prev,
                        [img.id]: {
                            ...curr,
                            status: 'ready',
                            isDirty: true,
                            signals: {
                                state: aiData.state || [],
                                matter: aiData.matter || [],
                                movement: aiData.movement || []
                            },
                            ai: {
                                description: aiData.description,
                                reasoning: aiData.reasoning,
                                model: 'gemini-2.5-flash-lite',
                                runId: null
                            }
                        }
                    }
                })
            } else {
                setImageStates(prev => ({ ...prev, [img.id]: { ...prev[img.id], status: 'error' } }))
            }
        }

        const runPipeline = async () => {
            // Safety: Unblock after 45s regardless (Vertex AI cold start can be slow)
            const safetyTimer = setTimeout(() => {
                if (isMounted) setInitialLoading(false)
            }, 45000)

            // 1. First Batch (3 images) - Blocking UI
            const firstBatch = images.slice(0, 3)

            // Run in parallel for speed
            await Promise.all(firstBatch.map(img => processImage(img)))

            clearTimeout(safetyTimer)

            if (!isMounted) return
            setInitialLoading(false) // Unblock UI

            // 2. Remaining Batches - Background
            const rest = images.slice(3)
            const BATCH_SIZE = 3

            for (let i = 0; i < rest.length; i += BATCH_SIZE) {
                if (!isMounted) break
                const batch = rest.slice(i, i + BATCH_SIZE)
                await Promise.all(batch.map(img => processImage(img)))
                // Optional small delay to be nice
                await new Promise(r => setTimeout(r, 500))
            }
        }

        const startupTimer = setTimeout(() => {
            if (isMounted) runPipeline()
        }, 500)

        return () => {
            isMounted = false
            clearTimeout(startupTimer)
        }
    }, [initialRunId]) // Images stable

    // Check Global Dirty State
    const hasUnsavedChanges = useMemo(() => {
        return Object.values(imageStates).some(s => s.isDirty)
    }, [imageStates])


    // -- EXIT INTERCEPTION --
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    const handleExitAttempt = (url: string) => {
        if (hasUnsavedChanges) {
            setPendingExitUrl(url)
            setShowExitDialog(true)
        } else {
            router.push(url)
        }
    }

    const confirmExit = () => {
        if (pendingExitUrl) router.push(pendingExitUrl)
    }

    // -- SAVE RUN HANDLER --
    const handleSaveRun = async () => {
        // Validation for Copy/New
        if (!initialRunId || saveOption === 'copy') {
            if (!runName.trim()) return
        }

        setIsSavingRun(true)
        try {
            if (initialRunId && saveOption === 'overwrite') {
                await updateSignalRun(initialRunId, imageStates)
            } else {
                await createSignalRun(
                    projectId,
                    scanId,
                    runName,
                    visibility,
                    imageStates
                )
            }

            setIsSavingRun(false)
            setShowSaveDialog(false)

            // Redirect based on intent
            if (saveDestination === 'gallery') {
                router.push(`/dashboard/project/${projectId}/signals/${scanId}`)
            } else {
                router.push(`/dashboard/project/${projectId}/resonance`)
            }

        } catch (e) {
            console.error(e)
            setIsSavingRun(false)
            alert('Erro ao salvar. Verifique o console.')
        }
    }

    const openSaveDialog = (dest: 'gallery' | 'next') => {
        setSaveDestination(dest)
        setShowSaveDialog(true)
    }

    // -- HANDLERS --
    const goNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }, [currentIndex, images.length])

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }, [currentIndex])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return // Don't hijack input

            if (e.key === 'ArrowRight') goNext()
            if (e.key === 'ArrowLeft') goPrev()
            if (e.key === 'Escape') handleExitAttempt(`/dashboard/project/${projectId}`)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [goNext, goPrev, projectId, router, hasUnsavedChanges])

    // Tag management
    const addTag = (section: SectionKey, val: string) => {
        const value = val.trim()
        if (!value || !currentImage) return
        if (currentState.signals[section].includes(value)) return

        setImageStates(prev => {
            const curr = prev[currentImage.id]
            return {
                ...prev,
                [currentImage.id]: {
                    ...curr,
                    isDirty: true,
                    signals: {
                        ...curr.signals,
                        [section]: [...curr.signals[section], value]
                    }
                }
            }
        })
    }

    const removeTag = (section: SectionKey, tagIndex: number) => {
        if (!currentImage) return
        setImageStates(prev => {
            const curr = prev[currentImage.id]
            const newTags = curr.signals[section].filter((_, i) => i !== tagIndex)
            return {
                ...prev,
                [currentImage.id]: {
                    ...curr,
                    isDirty: true,
                    signals: {
                        ...curr.signals,
                        [section]: newTags
                    }
                }
            }
        })
    }

    const editTag = (section: SectionKey, tagIndex: number, newValue: string) => {
        if (!currentImage || !newValue.trim()) return
        setImageStates(prev => {
            const curr = prev[currentImage.id]
            const oldTags = curr.signals[section]
            // check duplicates (excluding self)
            if (oldTags.some((t, i) => i !== tagIndex && t === newValue)) return prev

            const newTags = [...oldTags]
            newTags[tagIndex] = newValue

            return {
                ...prev,
                [currentImage.id]: {
                    ...curr,
                    isDirty: true,
                    signals: {
                        ...curr.signals,
                        [section]: newTags
                    }
                }
            }
        })
    }


    /* -------------------------------------------------------------------------- */
    /*                                   RENDER                                   */
    /* -------------------------------------------------------------------------- */

    if (!currentImage) return <div className="bg-zinc-950 h-screen w-screen" />

    // -- LOADING SCREEN --
    if (initialLoading) {
        return (
            <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50">
                <div className="relative">
                    <div className="w-16 h-16 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-purple-500 animate-pulse" />
                    </div>
                </div>
                <h2 className="mt-6 text-xl text-white font-light tracking-wide">Inicializando Agente de Marcação...</h2>
                <p className="text-zinc-500 text-sm mt-2">Preparando pistas sensoriais...</p>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-zinc-950 text-white overflow-hidden flex font-sans">

            {/* 1. IMAGE AREA (Dominant) */}
            <div className={`
                relative h-full transition-all duration-500 ease-out flex items-center justify-center p-8
                ${isSidebarVisible ? 'w-[75%]' : 'w-full'}
            `}>
                {/* Image Container */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={currentImage.original_url || currentImage.thumb_url || ''}
                        alt="Reference"
                        className="max-w-full max-h-full object-contain shadow-2xl shadow-black/50 select-none animate-in fade-in zoom-in-95 duration-500"
                        key={currentImage.id} // force animation on change
                    />
                    {hasUnsavedChanges && (
                        <div className="absolute top-4 right-4 bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs border border-orange-500/20 backdrop-blur-md flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                            Não salvo
                        </div>
                    )}
                </div>

                {/* Floating Navigation Controls (Bottom Center) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 text-zinc-500 transition-opacity duration-300 hover:text-white group">
                    <button
                        onClick={goPrev} disabled={currentIndex === 0}
                        className="p-3 hover:bg-white/10 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-mono text-xs opacity-50 group-hover:opacity-100">{currentIndex + 1} / {images.length}</span>
                    <button
                        onClick={goNext} disabled={currentIndex === images.length - 1}
                        className="p-3 hover:bg-white/10 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Back Button (Top Left) */}
                <button
                    onClick={() => handleExitAttempt(`/dashboard/project/${projectId}/signals/${scanId}`)}
                    className="absolute top-6 left-6 p-2 text-zinc-500 hover:text-white transition-colors z-20"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Toggle Sidebar Button (Top Right when hidden) */}
                {!isSidebarVisible && (
                    <button
                        onClick={() => setSidebarVisible(true)}
                        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors z-20"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. TAGS PANEL (Floating/Secondary) */}
            <div className={`
                h-full border-l border-white/5 bg-zinc-900/40 backdrop-blur-xl relative flex flex-col
                transition-all duration-500 ease-in-out
                ${isSidebarVisible ? 'w-[25%] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 overflow-hidden'}
            `}>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-48">

                    {/* Header: Actions */}
                    <div className="flex items-center justify-end mb-8">
                        <button
                            onClick={() => setSidebarVisible(false)}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div key={currentImage?.id} className="relative space-y-12 animate-in fade-in slide-in-from-right-4 duration-300 min-h-[500px]">
                        {/* AI Loading/Error Overlay */}
                        {currentState?.status === 'loading' && (
                            <div className="absolute inset-0 z-20 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-lg">
                                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                <span className="text-xs text-zinc-500 font-mono animate-pulse">Analisando...</span>
                            </div>
                        )}
                        {currentState?.status === 'error' && (
                            <div className="absolute inset-0 z-20 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-lg border border-red-900/20">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <span className="text-xs text-red-500 font-mono">Falha ao processar</span>
                                <button onClick={handleGenerateAI} className="text-[10px] underline text-zinc-500 hover:text-white mt-1">
                                    Tentar novamente
                                </button>
                            </div>
                        )}
                        {/* Sections */}
                        {SECTION_CONFIG.map((section) => (
                            <TagSectionRenderer
                                key={section.key}
                                section={section}
                                tags={currentState?.signals[section.key] || []}
                                onAddTag={(val) => addTag(section.key, val)}
                                onRemoveTag={(idx) => removeTag(section.key, idx)}
                                onEditTag={(idx, val) => editTag(section.key, idx, val)}
                            />
                        ))}

                        <div className="pt-8 border-t border-white/5">
                            <CollapsibleSection
                                title={<span className="font-serif italic text-zinc-600 hover:text-zinc-400 transition-colors lowercase">serendipity</span>}
                                defaultOpen={false}
                            >
                                <div className="space-y-6 pt-2">
                                    {/* Description */}
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Descrição</h4>
                                        <p className="text-zinc-400 text-xs leading-relaxed">
                                            {currentState?.ai.description || (currentState?.status === 'error' ? "Não foi possível gerar a descrição." : "Gerando descrição...")}
                                        </p>
                                    </div>

                                    {/* Reasoning */}
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Raciocínio</h4>
                                        <div className="bg-zinc-950/50 p-3 rounded-lg border border-white/5">
                                            <p className="text-[10px] text-zinc-500 font-mono whitespace-pre-wrap leading-tight">
                                                {currentState?.ai.reasoning || (currentState?.status === 'error' ? "Erro na análise." : "Aguardando processamento...")}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Model Meta */}
                                    <div className="pt-4 border-t border-white/5 flex flex-col gap-1 text-[10px] font-mono text-zinc-600">
                                        <div>Modelo: {currentState?.ai.model || "N/A"}</div>
                                        {currentState?.ai.runId && (
                                            <div>Run: {currentState.ai.runId}</div>
                                        )}
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </div>
                    </div>


                </div>

                {/* Footer with 2 buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent flex flex-col gap-3">
                    <button
                        onClick={() => openSaveDialog('next')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                    >
                        <span>Salvar e Continuar</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => openSaveDialog('gallery')}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5"
                    >
                        <span>Salvar</span>
                        <Check className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* --- DIALOGS (Custom Implementation) --- */}

            {/* SAVE DIALOG */}
            {/* SAVE DIALOG */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-[400px] shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-medium text-white mb-1">Salvar Leitura de Sinais</h3>

                        {initialRunId ? (
                            <div className="mb-6">
                                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-4">
                                    <button
                                        onClick={() => setSaveOption('overwrite')}
                                        className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${saveOption === 'overwrite' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Sobreescrever
                                    </button>
                                    <button
                                        onClick={() => setSaveOption('copy')}
                                        className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${saveOption === 'copy' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Salvar Cópia
                                    </button>
                                </div>
                                {saveOption === 'overwrite' ? (
                                    <p className="text-zinc-400 text-xs bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                        As alterações serão salvas na leitura atual <strong>"{initialRunName}"</strong>.
                                    </p>
                                ) : (
                                    <p className="text-zinc-500 text-xs">Crie uma nova leitura com base nas alterações atuais.</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-xs mb-6">Dê um nome para esta sessão de análise.</p>
                        )}

                        {(!initialRunId || saveOption === 'copy') && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Nome</label>
                                    <input
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700"
                                        placeholder="Ex: Análise Inicial, Cores Vibrantes..."
                                        value={runName}
                                        onChange={e => setRunName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Visibilidade</label>
                                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                                        <button
                                            onClick={() => setVisibility('private')}
                                            className={`flex-1 text-xs py-2 rounded-md transition-colors ${visibility === 'private' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            Privada
                                        </button>
                                        <button
                                            onClick={() => setVisibility('public')}
                                            className={`flex-1 text-xs py-2 rounded-md transition-colors ${visibility === 'public' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            Pública
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRun}
                                disabled={isSavingRun || ((!initialRunId || saveOption === 'copy') && !runName.trim())}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSavingRun && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EXIT DIALOG */}
            {showExitDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-[400px] shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-2 text-orange-500">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="text-lg font-medium">Descartar alterações?</h3>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-8 pl-8">
                            Esta leitura de sinais ainda não foi salva.<br />
                            Se você sair agora, <strong className="text-white font-medium">todas as marcações serão perdidas.</strong>
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowExitDialog(false)}
                                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={confirmExit}
                                className="px-4 py-2 bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 text-red-200 text-sm rounded-lg transition-colors"
                            >
                                Sair sem salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs w-full text-left"
            >
                <ChevronRight className={`w-3 h-3 text-zinc-600 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                {title}
            </button>
            {isOpen && (
                <div className="pl-5 animate-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    )
}

function TagSectionRenderer({
    section,
    tags,
    onAddTag,
    onRemoveTag,
    onEditTag
}: {
    section: TagSection
    tags: string[]
    onAddTag: (val: string) => void
    onRemoveTag: (idx: number) => void
    onEditTag: (idx: number, val: string) => void
}) {
    const [inputValue, setInputValue] = useState('')
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState('')

    // Add Input Handlers
    const handleAddBlur = () => {
        if (inputValue.trim()) {
            onAddTag(inputValue)
            setInputValue('')
        }
    }

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (inputValue.trim()) {
                onAddTag(inputValue)
                setInputValue('')
            }
        }
    }

    // Edit Handlers
    const startEditing = (idx: number, val: string) => {
        setEditingIndex(idx)
        setEditValue(val)
    }

    const saveEdit = () => {
        if (editingIndex !== null && editValue.trim()) {
            onEditTag(editingIndex, editValue)
        }
        setEditingIndex(null)
        setEditValue('')
    }

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            saveEdit()
        }
    }

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: '100ms' }}>
            <div>
                <h3 className="text-zinc-400 font-medium text-sm tracking-wide uppercase">{section.label}</h3>
                <p className="text-zinc-600 text-xs mt-1 leading-relaxed">{section.helper}</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                    editingIndex === i ? (
                        <input
                            key={i}
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleEditKeyDown}
                            className="px-3 py-1.5 bg-zinc-900 text-white text-sm rounded-md border border-purple-500 outline-none w-auto min-w-[60px]"
                        />
                    ) : (
                        <div
                            key={i}
                            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-zinc-200 text-sm rounded-md border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer"
                            onClick={() => startEditing(i, tag)}
                            title="Clique para editar"
                        >
                            <span>{tag}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation() // Prevent entering edit mode
                                    onRemoveTag(i)
                                }}
                                className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-1"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )
                ))}

                {/* Input Chip */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent text-zinc-400 text-sm rounded-md border border-dashed border-zinc-700 hover:border-zinc-500 transition-colors focus-within:border-purple-500 focus-within:text-white">
                    <Plus className="w-3 h-3" />
                    <input
                        className="bg-transparent border-none outline-none w-24 text-sm placeholder:text-zinc-700"
                        placeholder="adicionar..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={handleAddBlur}
                    />
                </div>
            </div>
        </div>
    )
}
