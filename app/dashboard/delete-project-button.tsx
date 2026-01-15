'use client'

import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { deleteProject } from './projects/actions'

export function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setShowConfirm(false)
                setError(null)
            }
        }
        if (showConfirm) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showConfirm])

    const handleOpenConfirm = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowConfirm(true)
        setError(null)
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setIsDeleting(true)
        setError(null)

        try {
            const result = await deleteProject(projectId)
            if (result && result.error) {
                setError(result.error)
                setIsDeleting(false)
            } else {
                setShowConfirm(false)
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao apagar projeto')
            setIsDeleting(false)
        }
    }

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowConfirm(false)
        setError(null)
    }

    return (
        <div className="relative" ref={modalRef}>
            <button
                onClick={handleOpenConfirm}
                disabled={isDeleting}
                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                title="Apagar Projeto"
            >
                {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Trash2 className="w-4 h-4" />
                )}
            </button>

            {showConfirm && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-400">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium text-sm">Excluir Projeto</span>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="text-zinc-500 hover:text-white p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-400">
                            Tem certeza que deseja excluir <span className="text-white font-medium">"{projectName}"</span>?
                        </p>
                        <p className="text-[10px] text-zinc-500">
                            Isso deletará TODAS as imagens, ingestões e dados permanentemente.
                        </p>

                        {error && (
                            <p className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                Erro: {error}
                            </p>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleCancel}
                                disabled={isDeleting}
                                className="flex-1 py-2 px-3 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2 px-3 rounded-md bg-red-500 text-white hover:bg-red-400 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
