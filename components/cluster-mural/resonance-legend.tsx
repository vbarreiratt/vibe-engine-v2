import { Info } from 'lucide-react';
import React, { useState } from 'react';

export function ResonanceLegend() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute bottom-6 right-6 z-[100]">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white shadow-lg transition-all"
                    title="Legenda Cognitiva"
                >
                    <Info className="w-5 h-5" />
                </button>
            )}

            {/* Legend Panel */}
            {isOpen && (
                <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl w-80 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-semibold text-white tracking-wide">Mapa Cognitivo</h3>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                            <span className="text-lg">×</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Status Legend */}
                        <div className="space-y-2">
                            <div className="text-[10px] uppercase text-zinc-500 font-mono tracking-wider">Status & Maturidade</div>

                            <LegendItem
                                type="strong"
                                label="STRONG (Consolidado)"
                                desc="Vibe madura. Alta densidade e ressonância múltipla. Pronto para ser nomeado."
                            />
                            <LegendItem
                                type="proto"
                                label="PROTO (Emergente)"
                                desc="Início de um mundo. Sinais fortes, mas pouca massa crítica. Requer decisão."
                            />
                            <LegendItem
                                type="noise"
                                label="BOLHA LATENTE"
                                desc="Mundos em estado inicial. Semente isolada aguardando conexão."
                            />
                        </div>

                        {/* Topography */}
                        <div className="pt-2 border-t border-white/5 space-y-2">
                            <div className="text-[10px] uppercase text-zinc-500 font-mono tracking-wider">Topografia</div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                Distância = Diferença Semântica.<br />
                                Clusters próximos compartilham "vibes" adjacentes. Clusters distantes são mundos opostos.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LegendItem({ type, label, desc }: { type: 'strong' | 'proto' | 'noise', label: string, desc: string }) {
    let styles = "";
    if (type === 'strong') styles = "border-white/50 bg-white/10";
    if (type === 'proto') styles = "border-white/30 border-dashed bg-white/5";
    if (type === 'noise') styles = "border-white/10 border-dotted opacity-50";

    return (
        <div className="flex gap-3 items-start group">
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${styles}`} />
            <div>
                <div className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors">{label}</div>
                <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{desc}</div>
            </div>
        </div>
    );
}
