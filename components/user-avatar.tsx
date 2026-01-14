'use client'

import { AVATAR_ASSETS, AvatarConfig } from '@/lib/avatar-assets'

export function UserAvatar({ config, className }: { config?: AvatarConfig | null, className?: string }) {
    if (!config) {
        return <div className={`bg-zinc-800 rounded-full ${className}`} />
    }

    const shape = AVATAR_ASSETS.shapes.find(s => s.id === config.shape) || AVATAR_ASSETS.shapes[0]
    const eyes = AVATAR_ASSETS.eyes.find(e => e.id === config.eyes)
    const nose = AVATAR_ASSETS.noses.find(n => n.id === config.nose)
    const mouth = AVATAR_ASSETS.mouths.find(m => m.id === config.mouth)

    // Determine border-radius based on shape
    const shapeRadius = config.shape === 'circle' ? '9999px' : config.shape === 'square' ? '12px' : '20%'

    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden ${className}`}
            style={{ borderRadius: shapeRadius }}
        >
            {/* Base Shape Color Layer using Mask */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: config.color || '#F3E5DC',
                    maskImage: `url('/assets/avatars/${shape.file}')`,
                    maskSize: '100% 100%',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: `url('/assets/avatars/${shape.file}')`,
                    WebkitMaskSize: '100% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center'
                }}
            />

            {/* Features - Positioned Vertically */}
            {eyes && (
                <img
                    src={`/assets/avatars/${eyes.file}`}
                    alt=""
                    className="absolute pointer-events-none z-10"
                    style={{
                        width: '70%',
                        height: 'auto',
                        top: '20%',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                />
            )}
            {nose && (
                <img
                    src={`/assets/avatars/${nose.file}`}
                    alt=""
                    className="absolute pointer-events-none z-20"
                    style={{
                        width: '30%',
                        height: 'auto',
                        top: '45%',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                />
            )}
            {mouth && (
                <img
                    src={`/assets/avatars/${mouth.file}`}
                    alt=""
                    className="absolute pointer-events-none z-30"
                    style={{
                        width: '40%',
                        height: 'auto',
                        top: '65%',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                />
            )}
        </div>
    )
}
