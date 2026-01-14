'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { completeOnboarding } from './actions'
import { useRouter } from 'next/navigation'
import { ArrowRight, User, Hash, AlignLeft, Check, Loader2, Shield, Edit3 } from 'lucide-react'

export function OnboardingWizard({ role, userEmail }: { role: string, userEmail: string }) {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        nickname: '',
        bio: '',
        avatarUrl: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleNext = () => setStep(prev => prev + 1)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const res = await completeOnboarding(formData)

        if (res.error) {
            alert(res.error)
            setIsSubmitting(false)
            return
        }

        if (res.success) {
            if (res.role === 'admin') {
                router.push('/dashboard/admin')
            } else {
                router.push('/dashboard')
            }
        }
    }

    // Step 1: Welcome
    if (step === 1) {
        return (
            <WizardStep>
                <div className="space-y-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-8" />

                    <h1 className="text-3xl font-light text-white">Bem-vindo ao Vibe Engine</h1>

                    <div className="space-y-4 text-zinc-400 leading-relaxed">
                        <p>
                            O Vibe Engine é uma ferramenta para reconhecer, organizar e construir <span className="text-white font-medium italic">vibes</span> a partir de referências visuais.
                            Aqui, o sistema propõe padrões — mas quem decide é você.
                        </p>
                        <p>
                            Suas escolhas constroem sentido. Por isso, toda ação registrada no sistema está ligada a uma pessoa real.
                        </p>
                    </div>

                    <button onClick={handleNext} className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-8">
                        Continuar <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
            </WizardStep>
        )
    }

    // Step 2: Identity
    if (step === 2) {
        return (
            <WizardStep>
                <div className="space-y-6">
                    <h2 className="text-2xl font-light text-white">Identidade Editorial</h2>
                    <p className="text-zinc-500 text-sm">Como você quer ser identificado dentro do sistema? Esse nome aparece nos registros de decisão.</p>

                    <div className="space-y-4 mt-6">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Nickname *</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                <input
                                    type="text"
                                    value={formData.nickname}
                                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700"
                                    placeholder="ex: vitor, studio-bicho"
                                    maxLength={24}
                                />
                            </div>
                            <span className="text-[10px] text-zinc-600 flex justify-end mt-1">{formData.nickname.length}/24</span>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Bio Curta</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700 min-h-[80px] resize-none"
                                    placeholder="ex: pesquisa visual, cultura e sistemas sensíveis"
                                    maxLength={140}
                                />
                            </div>
                            <span className="text-[10px] text-zinc-600 flex justify-end mt-1">{formData.bio.length}/140</span>
                        </div>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={formData.nickname.length < 2}
                        className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
                    >
                        Continuar
                    </button>
                </div>
            </WizardStep>
        )
    }

    // Step 3: Avatar
    if (step === 3) {
        return (
            <WizardStep>
                <div className="space-y-6">
                    <h2 className="text-2xl font-light text-white">Escolha um avatar</h2>
                    <p className="text-zinc-500 text-sm">O avatar ajuda a identificar quem está por trás das decisões. Não precisa ser uma foto.</p>

                    <div className="flex justify-center py-8">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border-2 border-white/10 text-2xl font-medium text-white shadow-xl">
                                {formData.nickname?.[0]?.toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-400 whitespace-nowrap border border-white/5">
                                Padrão
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-zinc-600 mb-8">
                        (Upload de imagem customizada estará disponível em breve. Usaremos suas iniciais por enquanto.)
                    </p>

                    <button onClick={handleNext} className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                        Continuar
                    </button>
                </div>
            </WizardStep>
        )
    }

    // Step 4: Role Context & Finish
    if (step === 4) {
        const isAdmin = role === 'admin'

        return (
            <WizardStep>
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {isAdmin ? <Shield className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
                        </div>
                        <h2 className="text-xl font-light text-white">
                            {isAdmin ? 'Seu papel como Administrador' : 'Seu papel como Curador'}
                        </h2>
                    </div>

                    {isAdmin ? (
                        <div className="text-zinc-400 space-y-4 text-sm leading-relaxed">
                            <p>Como administrador, você estrutura o ambiente de trabalho do Vibe Engine.</p>
                            <p>Você é responsável por:</p>
                            <ul className="space-y-2 list-disc pl-5 text-zinc-300">
                                <li>Criar e organizar projetos</li>
                                <li>Alocar curadores</li>
                                <li>Gerenciar acessos e permissões</li>
                                <li>Garantir a integridade editorial do sistema</li>
                            </ul>
                            <p className="text-xs text-zinc-500 pt-2">Suas ações impactam todos os usuários e projetos.</p>
                        </div>
                    ) : (
                        <div className="text-zinc-400 space-y-4 text-sm leading-relaxed">
                            <p>Como curador, você é responsável por validar sinais, agrupar referências e tomar decisões editoriais ao longo do processo.</p>
                            <p>O sistema pode sugerir caminhos, mas a responsabilidade final é sempre humana.</p>
                            <p className="text-zinc-300">Todas as suas decisões ficam registradas no histórico do projeto.</p>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 mt-8"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {isAdmin ? 'Ir para o Painel de Administração' : 'Ir para Meus Projetos'}
                    </button>
                </div>
            </WizardStep>
        )
    }

    return null
}

function WizardStep({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-zinc-900/50 border border-white/5 p-8 rounded-2xl backdrop-blur-xl shadow-2xl"
        >
            {children}
        </motion.div>
    )
}
