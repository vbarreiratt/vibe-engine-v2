'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Trash2, KeyRound, Loader2, Copy, Check, AlertTriangle, X } from 'lucide-react'
import { deleteUser, resetUserPassword } from './actions'

export function UserActionsDropdown({ userId, email }: { userId: string, email: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [resetLink, setResetLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setResetLink(null)
                setConfirmDelete(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await deleteUser(userId)
            setIsLoading(false)

            if (result.error) {
                setError(result.error)
            } else {
                setIsOpen(false)
                setConfirmDelete(false)
            }
        } catch (e: any) {
            console.error('Delete User Frontend Error:', e)
            setError(e.message || 'Erro desconhecido')
            setIsLoading(false)
        }
    }

    const handleResetPassword = async () => {
        setIsLoading(true)
        setError(null)
        const result = await resetUserPassword(userId, email)
        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else if (result.link) {
            setResetLink(result.link)
        } else {
            // No link returned, just close
            setIsOpen(false)
        }
    }

    const copyLink = () => {
        if (resetLink) {
            navigator.clipboard.writeText(resetLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {confirmDelete ? (
                        // Confirmation State
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-red-400">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium text-sm">Confirmar Exclusão</span>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Tem certeza que deseja excluir <span className="text-white font-medium">{email}</span>? Esta ação não pode ser desfeita.
                            </p>
                            {error && (
                                <p className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                    Erro: {error}
                                </p>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => { setConfirmDelete(false); setError(null); }}
                                    disabled={isLoading}
                                    className="flex-1 py-2 px-3 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="flex-1 py-2 px-3 rounded-md bg-red-500 text-white hover:bg-red-400 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ) : resetLink ? (
                        // Reset Link State
                        <div className="p-3 space-y-2">
                            <p className="text-xs text-zinc-400">Link de Recuperação:</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={resetLink}
                                    readOnly
                                    className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-zinc-300 truncate"
                                />
                                <button
                                    onClick={copyLink}
                                    className="p-1.5 rounded bg-purple-500 hover:bg-purple-400 text-white transition-colors"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                            <button
                                onClick={() => { setResetLink(null); setIsOpen(false); }}
                                className="w-full text-xs text-zinc-500 hover:text-white mt-2"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        // Default Menu
                        <div className="p-1">
                            <button
                                onClick={handleResetPassword}
                                disabled={isLoading}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white text-sm transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                Resetar Senha
                            </button>
                            <button
                                onClick={() => setConfirmDelete(true)}
                                disabled={isLoading}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir Usuário
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
