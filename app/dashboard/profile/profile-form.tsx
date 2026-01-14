'use client'

import { useState } from 'react'
import { updateProfileSettings } from './actions'
import { Loader2, Hash, AlignLeft, Mail, Save } from 'lucide-react'

export function ProfileForm({ profile, userEmail }: { profile: any, userEmail: string }) {
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')

    async function handleSubmit(formData: FormData) {
        setIsSaving(true)
        setMessage('')

        const res = await updateProfileSettings(formData)
        setIsSaving(false)

        if (res?.error) {
            setMessage('Erro: ' + res.error)
        } else {
            setMessage('Perfil atualizado com sucesso.')
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-white/5">
            {/* Avatar Section (Read Only for now) */}
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xl font-bold border-2 border-white/10 shadow-lg text-white">
                    {profile?.nickname?.[0]?.toUpperCase() || userEmail[0].toUpperCase()}
                </div>
                <div>
                    <h3 className="text-white font-medium">Avatar</h3>
                    <p className="text-zinc-500 text-sm">Gerado automaticamente a partir do seu nickname.</p>
                </div>
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
    )
}
