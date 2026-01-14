'use client'

import { useState } from 'react'
import { generateClusters } from './actions'
import { Sparkles, Activity } from 'lucide-react'

export function ResonanceLauncher({ projectId, hasClusters }: { projectId: string, hasClusters: boolean }) {
    const [loading, setLoading] = useState(false)

    const run = async () => {
        setLoading(true)
        try {
            await generateClusters(projectId)
            window.location.reload() // Full reload to fetch new state in server component
        } catch (e: any) {
            alert(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-zinc-800 rounded-2xl">
            <div className="p-4 rounded-full bg-zinc-900 border border-zinc-700 mb-6">
                <Activity className="w-8 h-8 text-purple-500" />
            </div>

            <h2 className="text-xl font-light text-white mb-2">Motor de Ressonância</h2>
            <p className="text-zinc-500 text-center max-w-md mb-8">
                {hasClusters
                    ? 'Clusters já existem. Deseja re-processar?'
                    : 'O sistema irá agrupar as vibes baseando-se na semelhança vetorial das tags (Estado, Matéria, Movimento).'}
            </p>

            <button
                onClick={run}
                disabled={loading}
                className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] flex items-center gap-2"
            >
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Calculando Ressonância...' : 'Gerar Clusters'}
            </button>
        </div>
    )
}
