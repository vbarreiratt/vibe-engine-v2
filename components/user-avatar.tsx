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

    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
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

            {/* Features Z-Index Stack */}
            {/* Some adjustments might be needed for positioning if assets are not perfectly aligned */}
            {eyes && <img src={`/assets/avatars/${eyes.file}`} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" />}
            {nose && <img src={`/assets/avatars/${nose.file}`} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" />}
            {mouth && <img src={`/assets/avatars/${mouth.file}`} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20" />}
        </div>
    )
}
