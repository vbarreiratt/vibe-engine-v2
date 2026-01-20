'use client'

import { useState } from 'react'
import { Play, User, Globe, Layers, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function StartScanButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleStart = (scope: 'mine' | 'project' | 'all') => {
        router.push(`/dashboard/project/${projectId}/scan?scope=${scope}`)
        setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20"
            >
                <Play className="w-4 h-4 fill-current" />
                <span className="font-medium">Iniciar Varredura</span>
            </button>
        )
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Play className="w-4 h-4 fill-zinc-400 text-zinc-400" />
                            Configurar Varredura
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                        Escolha quais referências serão processadas pelo modelo de visão.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleStart('mine')}
                            className="w-full flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-zinc-200 group-hover:text-white">Minhas Referências</span>
                                <span className="text-xs text-zinc-500">Apenas uploads que você fez (privados ou públicos)</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleStart('project')}
                            className="w-full flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-zinc-200 group-hover:text-white">Referências do Projeto</span>
                                <span className="text-xs text-zinc-500">Apenas uploads públicos de todos os membros</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleStart('all')}
                            className="w-full flex items-center gap-4 p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-purple-200 group-hover:text-white">Todas as Disponíveis</span>
                                <span className="text-xs text-purple-400/70">Combina suas privadas + públicas do projeto</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
