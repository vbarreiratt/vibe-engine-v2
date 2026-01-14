/**
 * Normalização de Sinais para o Vibe Engine.
 * Objetivo: Garantir que termos em EN ou variações sejam unificados em PT-BR
 * para maximizar a ressonância semântica exacta.
 */

// Dicionário MVP de termos comuns em visão computacional -> PT-BR
const DICTIONARY: Record<string, string> = {
    // Cores e Luz
    'neon': 'neon',
    'glow': 'brilho',
    'glowing': 'brilhante',
    'dark': 'escuro',
    'bright': 'claro',
    'shadow': 'sombra',
    'light': 'luz',
    'colorful': 'colorido',
    'black and white': 'preto e branco',
    'monochrome': 'monocromático',
    'vibrant': 'vibrante',
    'pastel': 'pastel',
    
    // Texturas/Materiais
    'glass': 'vidro',
    'metal': 'metal',
    'metallic': 'metálico',
    'wood': 'madeira',
    'wooden': 'madeira',
    'fabric': 'tecido',
    'textile': 'textil',
    'plastic': 'plástico',
    'liquid': 'líquido',
    'water': 'água',
    'stone': 'pedra',
    'rock': 'rocha',
    'paper': 'papel',
    'ink': 'tinta',
    'paint': 'pintura',
    'oil': 'óleo',
    'smoke': 'fumaça',
    'fog': 'neblina',
    'cloud': 'nuvem',
    'dust': 'poeira',
    'grain': 'granulação',
    'noise': 'ruído',
    'soft': 'macio',
    'hard': 'duro',
    'rough': 'áspero',
    'smooth': 'liso',
    'shiny': 'brilhante',
    'matte': 'fosco',
    
    // Movimento/Estado
    'movement': 'movimento',
    'motion': 'movimento',
    'blur': 'desfoque',
    'blurred': 'desfocado',
    'sharp': 'nítido',
    'focus': 'foco',
    'static': 'estático',
    'dynamic': 'dinâmico',
    'flow': 'fluxo',
    'flowing': 'fluido',
    'still': 'quieto',
    'chaos': 'caos',
    'chaotic': 'caótico',
    'calm': 'calmo',
    'serene': 'sereno',
    'intense': 'intenso',
    'pulsating': 'pulsante',
    'pulse': 'pulso',
    'rhythm': 'ritmo',
    'balance': 'equilíbrio',
    'tension': 'tensão',
    'conflict': 'conflito',
    'harmony': 'harmonia',
    'contrast': 'contraste',
    'minimal': 'minimalista',
    'complex': 'complexo',
    'organic': 'orgânico',
    'geometric': 'geométrico',
    'abstract': 'abstrato',
    'surreal': 'surreal',
    'dreamy': 'onírico',
    'ethereal': 'etéreo',
    'mysterious': 'misterioso'
};

export interface NormalizationResult {
    original: string;
    normalized: string;
    method: 'dictionary' | 'heuristic' | 'identity';
}

export function normalizeSignal(term: string): NormalizationResult {
    if (!term) return { original: '', normalized: '', method: 'identity' };

    const original = term.trim();
    let processing = original.toLowerCase();

    // 1. Dicionário Direto
    if (DICTIONARY[processing]) {
        return {
            original,
            normalized: DICTIONARY[processing],
            method: 'dictionary'
        };
    }

    // 2. Heurísticas Simples
    
    // Plural (EN/PT) simples -> Singular
    if (processing.endsWith('s') && !processing.endsWith('ss')) {
        const singular = processing.slice(0, -1);
        if (DICTIONARY[singular]) {
             return {
                original,
                normalized: DICTIONARY[singular],
                method: 'dictionary' // Achou via singular
            };
        }
    }

    // Remover pontuação restante
    processing = processing.replace(/[.,;!?]/g, '');

    return {
        original,
        normalized: processing,
        method: 'identity'
    };
}

export function normalizeSignalList(terms: string[]): NormalizationResult[] {
    return terms.map(normalizeSignal).filter(r => r.normalized.length > 0);
}
