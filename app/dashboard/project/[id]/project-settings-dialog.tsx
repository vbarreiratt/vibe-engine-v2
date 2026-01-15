'use client'

import { useState, useEffect } from 'react'
import { Settings, X, Save, UserPlus, Trash2, Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { updateProjectSettings, addProjectMember, removeProjectMember } from './actions'

export function ProjectSettingsDialog({ project, members }: { project: any, members: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'members'>('general')
    const [isLoading, setIsLoading] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

    // Form States
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || '')
    const [newMemberEmail, setNewMemberEmail] = useState('')

    // Auto-clear status message
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [statusMessage])

    const handleUpdate = async () => {
        setIsLoading(true)
        setStatusMessage(null)
        const formData = new FormData()
        formData.append('name', name)
        formData.append('description', description)

        try {
            await updateProjectSettings(project.id, formData)
            setStatusMessage({ type: 'success', text: 'Projeto atualizado!' })
        } catch (e: any) {
            setStatusMessage({ type: 'error', text: e.message })
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddMember = async () => {
        if (!newMemberEmail) return
        setIsLoading(true)
        setStatusMessage(null)
        const res = await addProjectMember(project.id, newMemberEmail)
        setIsLoading(false)
        if (res?.error) {
            setStatusMessage({ type: 'error', text: res.error })
        } else {
            setNewMemberEmail('')
            setStatusMessage({ type: 'success', text: 'Membro adicionado!' })
        }
    }

    const handleRemoveMember = async (userId: string) => {
        setIsLoading(true)
        setStatusMessage(null)
        try {
            await removeProjectMember(project.id, userId)
            setMemberToRemove(null)
            setStatusMessage({ type: 'success', text: 'Membro removido!' })
        } catch (e: any) {
            setStatusMessage({ type: 'error', text: 'Erro ao remover membro' })
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Configurações do Projeto"
            >
                <Settings className="w-4 h-4" />
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-zinc-400" />
                        Configurações: {project.name}
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                        Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'members' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                        Membros ({members.length})
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 relative">
                    {/* Status Message Overlay */}
                    {statusMessage && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border animate-in slide-in-from-top-4 ${statusMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
                            }`}>
                            {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span className="text-xs font-medium">{statusMessage.text}</span>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Nome do Projeto</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Descrição</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-purple-500 outline-none resize-none"
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleUpdate}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            {/* Add Member */}
                            <div className="flex gap-2 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                                <input
                                    placeholder="Email do Curador para adicionar..."
                                    value={newMemberEmail}
                                    onChange={e => setNewMemberEmail(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                />
                                <button
                                    onClick={handleAddMember}
                                    disabled={isLoading || !newMemberEmail}
                                    className="text-purple-400 hover:text-purple-300 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* List */}
                            <div className="space-y-2">
                                {members.map((m: any) => (
                                    <div key={m.user_id} className="flex items-center justify-between p-3 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-zinc-200">{m.profiles?.email}</p>
                                                <p className="text-xs text-zinc-500 uppercase">{m.role}</p>
                                            </div>
                                        </div>

                                        {memberToRemove === m.user_id ? (
                                            <div className="flex gap-2 animate-in slide-in-from-right-2">
                                                <button
                                                    onClick={() => handleRemoveMember(m.user_id)}
                                                    disabled={isLoading}
                                                    className="px-2 py-1 bg-red-500 text-white text-[10px] rounded hover:bg-red-400"
                                                >
                                                    {isLoading ? '...' : 'Remover'}
                                                </button>
                                                <button
                                                    onClick={() => setMemberToRemove(null)}
                                                    disabled={isLoading}
                                                    className="px-2 py-1 bg-zinc-700 text-zinc-300 text-[10px] rounded hover:bg-zinc-600"
                                                >
                                                    Não
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setMemberToRemove(m.user_id)}
                                                className="text-zinc-600 hover:text-red-500 p-2 transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
