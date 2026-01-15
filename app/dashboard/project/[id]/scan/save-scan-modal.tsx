'use client'

import { useState } from 'react'
import { X, Save, Loader2, Globe, Lock, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { createScan } from './actions'
import { useRouter } from 'next/navigation'

interface SaveScanModalProps {
    projectId: string
    selectedImageIds: string[]
    onClose: () => void
    onSuccess?: (scanId: string) => void
}

export function SaveScanModal({ projectId, selectedImageIds, onClose, onSuccess }: SaveScanModalProps) {
    const [name, setName] = useState('')
    const [visibility, setVisibility] = useState<'public' | 'private'>('private')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [savedScanId, setSavedScanId] = useState<string | null>(null)
    const router = useRouter()

    const handleSave = async () => {
        setIsLoading(true)
        setError(null)

        const result = await createScan({
            projectId,
            name,
            visibility,
            imageIds: selectedImageIds
        })

        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess('Varredura salva com sucesso!')
            setSavedScanId(result.scanId!)
        }
    }

    const handleGoToSignals = () => {
        if (savedScanId) {
            router.push(`/dashboard/project/${projectId}/signals?scan=${savedScanId}`)
        }
    }

    const handleGoToProject = () => {
        router.push(`/dashboard/project/${projectId}`)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Salvar Varredura</h2>
                        <p className="text-sm text-zinc-500">{selectedImageIds.length} imagens selecionadas</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {!success ? (
                    <div className="p-6 space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                                Nome da Varredura *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ex: Referências Urbanas"
                                className="w-full bg-zinc-950 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                                autoFocus
                            />
                        </div>

                        {/* Visibility Toggle */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                                Visibilidade
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setVisibility('private')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${visibility === 'private'
                                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                                            : 'border-white/10 text-zinc-500 hover:border-white/20'
                                        }`}
                                >
                                    <Lock className="w-4 h-4" />
                                    <span className="text-sm font-medium">Privada</span>
                                </button>
                                <button
                                    onClick={() => setVisibility('public')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${visibility === 'public'
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                            : 'border-white/10 text-zinc-500 hover:border-white/20'
                                        }`}
                                >
                                    <Globe className="w-4 h-4" />
                                    <span className="text-sm font-medium">Pública</span>
                                </button>
                            </div>
                            <p className="text-xs text-zinc-600 mt-2">
                                {visibility === 'private'
                                    ? 'Apenas você pode ver e usar esta varredura'
                                    : 'Outros curadores do projeto podem ver e usar esta varredura'
                                }
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                ) : (
                    // Success State
                    <div className="p-6 space-y-6">
                        <div className="text-center py-4">
                            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">{success}</h3>
                            <p className="text-sm text-zinc-500">O que você deseja fazer agora?</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    {!success ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading || !name.trim()}
                                className="flex-1 py-3 rounded-lg bg-purple-500 text-white hover:bg-purple-400 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleGoToProject}
                                className="flex-1 py-3 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar ao Projeto
                            </button>
                            <button
                                onClick={handleGoToSignals}
                                className="flex-1 py-3 rounded-lg bg-purple-500 text-white hover:bg-purple-400 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                Ir para Sinais
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
