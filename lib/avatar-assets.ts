export const AVATAR_ASSETS = {
    shapes: [
        { id: 'circle', file: 'CircleFaceShapes.svg', name: 'Círculo' },
        { id: 'square', file: 'SquareFaceShapes.svg', name: 'Quadrado' },
        { id: 'octagon', file: 'OctagonFaceShapes.svg', name: 'Octógono' },
    ],
    eyes: Array.from({ length: 22 }, (_, i) => ({
        id: `eye-${i + 1}`,
        file: `Eyes ${String(i + 1).padStart(2, '0')}Eyes..svg`
    })),
    mouths: Array.from({ length: 18 }, (_, i) => ({
        id: `mouth-${i + 1}`,
        file: `Mouth ${String(i + 1).padStart(2, '0')}mouth.svg`
    })),
    noses: Array.from({ length: 15 }, (_, i) => ({
        id: `nose-${i + 1}`,
        file: `Nose ${String(i + 1).padStart(2, '0')}Nose.svg`
    })),
    colors: [
        '#F3E5DC', // Pale Skin
        '#ECC8AE', // Light Skin
        '#D4AA78', // Medium Skin
        '#A87B51', // Dark Skin
        '#684333', // Deep Skin
        '#FFD700', // Gold
        '#FFB6C1', // Pink
        '#98FB98', // Green
        '#87CEFA', // Blue
        '#DDA0DD', // Purple
    ]
}

export type AvatarConfig = {
    shape: string
    color: string
    eyes: string
    nose: string
    mouth: string
}
