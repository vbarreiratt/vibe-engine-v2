'use client'

import { useState } from 'react'
import { AVATAR_ASSETS, AvatarConfig } from '@/lib/avatar-assets'
import { UserAvatar } from './user-avatar'
import { Check, Dices } from 'lucide-react'

interface AvatarBuilderProps {
    initialConfig?: AvatarConfig | null
    onConfigChange: (config: AvatarConfig) => void
}

const defaultConfig: AvatarConfig = {
    shape: 'circle',
    color: '#F3E5DC',
    eyes: 'eye-1',
    nose: 'nose-1',
    mouth: 'mouth-1'
}

export function AvatarBuilder({ initialConfig, onConfigChange }: AvatarBuilderProps) {
    const [config, setConfig] = useState<AvatarConfig>(initialConfig || defaultConfig)
    const [activeTab, setActiveTab] = useState<'shape' | 'eyes' | 'nose' | 'mouth'>('shape')

    const updateConfig = (key: keyof AvatarConfig, value: string) => {
        const newConfig = { ...config, [key]: value }
        setConfig(newConfig)
        onConfigChange(newConfig)
    }

    const randomize = () => {
        const randomShape = AVATAR_ASSETS.shapes[Math.floor(Math.random() * AVATAR_ASSETS.shapes.length)]
        const randomColor = AVATAR_ASSETS.colors[Math.floor(Math.random() * AVATAR_ASSETS.colors.length)]
        const randomEyes = AVATAR_ASSETS.eyes[Math.floor(Math.random() * AVATAR_ASSETS.eyes.length)]
        const randomNose = AVATAR_ASSETS.noses[Math.floor(Math.random() * AVATAR_ASSETS.noses.length)]
        const randomMouth = AVATAR_ASSETS.mouths[Math.floor(Math.random() * AVATAR_ASSETS.mouths.length)]

        const newConfig: AvatarConfig = {
            shape: randomShape.id,
            color: randomColor,
            eyes: randomEyes.id,
            nose: randomNose.id,
            mouth: randomMouth.id
        }
        setConfig(newConfig)
        onConfigChange(newConfig)
    }

    const tabs = [
        { id: 'shape', label: 'Forma' },
        { id: 'eyes', label: 'Olhos' },
        { id: 'nose', label: 'Nariz' },
        { id: 'mouth', label: 'Boca' },
    ] as const

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Preview */}
            <div className="flex flex-col items-center gap-4">
                <UserAvatar config={config} className="w-32 h-32 shadow-xl border-4 border-white/10" />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Preview</span>
                    <button
                        type="button"
                        onClick={randomize}
                        className="p-1.5 rounded-md bg-zinc-800 hover:bg-purple-500 text-zinc-400 hover:text-white transition-colors"
                        title="Gerar aleatório"
                    >
                        <Dices className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === tab.id
                                ? 'bg-white text-black'
                                : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[180px]">
                    {activeTab === 'shape' && (
                        <div className="space-y-4">
                            {/* Shape Selection */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 block">Formato</label>
                                <div className="flex gap-2">
                                    {AVATAR_ASSETS.shapes.map(shape => (
                                        <button
                                            key={shape.id}
                                            onClick={() => updateConfig('shape', shape.id)}
                                            className={`relative w-16 h-16 rounded-lg border-2 transition-all flex items-center justify-center bg-zinc-900 ${config.shape === shape.id
                                                ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                                : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <img src={`/assets/avatars/${shape.file}`} alt={shape.name} className="w-10 h-10 object-contain opacity-60" />
                                            {config.shape === shape.id && <Check className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full p-0.5 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 block">Cor</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVATAR_ASSETS.colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateConfig('color', color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${config.color === color
                                                ? 'border-white scale-110 shadow-lg'
                                                : 'border-transparent hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'eyes' && (
                        <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto pr-2">
                            {AVATAR_ASSETS.eyes.map(eye => (
                                <button
                                    key={eye.id}
                                    onClick={() => updateConfig('eyes', eye.id)}
                                    className={`relative aspect-square rounded-lg border-2 transition-all bg-zinc-900 p-1 ${config.eyes === eye.id
                                        ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                        : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <img src={`/assets/avatars/${eye.file}`} alt="" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'nose' && (
                        <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto pr-2">
                            {AVATAR_ASSETS.noses.map(nose => (
                                <button
                                    key={nose.id}
                                    onClick={() => updateConfig('nose', nose.id)}
                                    className={`relative aspect-square rounded-lg border-2 transition-all bg-zinc-900 p-1 ${config.nose === nose.id
                                        ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                        : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <img src={`/assets/avatars/${nose.file}`} alt="" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'mouth' && (
                        <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto pr-2">
                            {AVATAR_ASSETS.mouths.map(mouth => (
                                <button
                                    key={mouth.id}
                                    onClick={() => updateConfig('mouth', mouth.id)}
                                    className={`relative aspect-square rounded-lg border-2 transition-all bg-zinc-900 p-1 ${config.mouth === mouth.id
                                        ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                        : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <img src={`/assets/avatars/${mouth.file}`} alt="" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
