'use client'

import { useState, useRef } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { createUser } from './actions'

export function CreateUserForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        const res = await createUser(formData)
        setIsLoading(false)

        if (res?.error) {
            alert(res.error)
        } else {
            formRef.current?.reset()
            setIsOpen(false)
            alert('Usuário criado com sucesso!')
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
                <UserPlus className="w-4 h-4" />
                Novo Usuário
            </button>
        )
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-medium text-white mb-4">Criar Novo Acesso</h3>
            <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">Email</label>
                        <input name="email" type="email" required className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">Senha Inicial</label>
                        <input name="password" type="text" required minLength={6} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="Senha forte" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Papel (Role)</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-zinc-300">
                            <input type="radio" name="role" value="curator" defaultChecked className="accent-purple-500" />
                            Curador
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-300">
                            <input type="radio" name="role" value="admin" className="accent-purple-500" />
                            Admin
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                        Criar Usuário
                    </button>
                </div>
            </form>
        </div>
    )
}
