'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileSettings } from './actions'
import { Loader2, Hash, AlignLeft, Mail, Save } from 'lucide-react'
import { AvatarBuilder } from '@/components/avatar-builder'
import { UserAvatar } from '@/components/user-avatar'
import { AvatarConfig } from '@/lib/avatar-assets'

export function ProfileForm({ profile, userEmail }: { profile: any, userEmail: string }) {
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(profile?.avatar_config || null)
    const [showBuilder, setShowBuilder] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsSaving(true)
        setMessage('')

        // Append avatar config to form data
        formData.set('avatarConfig', JSON.stringify(avatarConfig))

        const res = await updateProfileSettings(formData)
        setIsSaving(false)

        if (res?.error) {
            setMessage('Erro: ' + res.error)
        } else {
            setMessage('Perfil atualizado com sucesso.')
        }
    }

    return (
        <>
            <form action={handleSubmit} className="space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-white/5">
                {/* Avatar Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <UserAvatar config={avatarConfig} className="w-20 h-20 rounded-full border-2 border-white/10 shadow-lg" />
                            <div>
                                <h3 className="text-white font-medium">Seu Avatar</h3>
                                <p className="text-zinc-500 text-sm">Personalize sua identidade visual.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowBuilder(!showBuilder)}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            {showBuilder ? 'Fechar Editor' : 'Editar Avatar'}
                        </button>
                    </div>

                    {showBuilder && (
                        <div className="bg-black/30 p-6 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                            <AvatarBuilder
                                initialConfig={avatarConfig}
                                onConfigChange={setAvatarConfig}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Email</label>
                        <div className="relative opacity-50 cursor-not-allowed">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                            <input
                                type="text"
                                value={userEmail}
                                readOnly
                                className="w-full bg-zinc-950 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-zinc-400 focus:outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Nickname</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                            <input
                                name="nickname"
                                type="text"
                                defaultValue={profile?.nickname || ''}
                                className="w-full bg-zinc-950 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700"
                                placeholder="ex: vitor"
                                minLength={2}
                                maxLength={24}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Bio Curta</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                            <textarea
                                name="bio"
                                defaultValue={profile?.bio || ''}
                                className="w-full bg-zinc-950 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700 min-h-[100px] resize-none"
                                placeholder="ex: pesquisa visual..."
                                maxLength={140}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className={`text-sm ${message.includes('Erro') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {message}
                    </span>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-white text-black font-medium py-2.5 px-6 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Alterações
                    </button>
                </div>
            </form>

            {/* Danger Zone */}
            <DeleteAccountSection />
        </>
    )
}

function DeleteAccountSection() {
    const [showConfirm, setShowConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const router = useRouter()

    const handleDelete = async () => {
        if (confirmText !== 'DELETAR') return

        setIsDeleting(true)
        const { deleteOwnAccount } = await import('./actions')
        const result = await deleteOwnAccount()

        if (result.error) {
            alert('Erro: ' + result.error)
            setIsDeleting(false)
        } else {
            router.replace('/login')
        }
    }

    return (
        <div className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-xl">
            <h3 className="text-red-400 font-medium mb-2">Zona de Perigo</h3>
            <p className="text-zinc-500 text-sm mb-4">
                Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
            </p>

            {!showConfirm ? (
                <button
                    onClick={() => setShowConfirm(true)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                    Excluir minha conta
                </button>
            ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-zinc-400">
                        Digite <span className="text-red-400 font-mono">DELETAR</span> para confirmar:
                    </p>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full bg-zinc-950 border border-red-500/30 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-red-500"
                        placeholder="DELETAR"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                            className="flex-1 py-2 px-4 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmText !== 'DELETAR' || isDeleting}
                            className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Excluir Permanentemente
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
