import { X, ArrowRight, Activity, Layers, Zap, Hexagon } from "lucide-react";
import React from "react";

interface ClusterPanelProps {
    cluster: any;
    onClose: () => void;
}

export function ClusterPanel({ cluster, onClose }: ClusterPanelProps) {
    if (!cluster) return null;

    const { classification, summary, strength_score, metrics, name_suggested } = cluster;
    
    // Status Config
    const isStrong = classification === 'STRONG';
    const isProto = classification === 'PROTO';
    const isNoise = classification === 'NOISE' || classification === 'WEAK';

    let statusColor = "text-zinc-400";
    let statusBg = "bg-zinc-800";
    let statusDesc = "Indefinido";

    if (isStrong) {
        statusColor = "text-lime-400";
        statusBg = "bg-lime-400/10 border-lime-400/20";
        statusDesc = "Mundo maduro e consistente. Alta recorrência, densidade e estabilidade. Pronto para ser nomeado.";
    } else if (isProto) {
        statusColor = "text-amber-400";
        statusBg = "bg-amber-400/10 border-amber-400/20";
        statusDesc = "Mundo em formação. Sinais fortes, mas com pouca massa crítica. Requer decisão: expandir ou fundir.";
    } else {
        statusColor = "text-purple-400";
        statusBg = "bg-purple-400/10 border-purple-400/20";
        statusDesc = "Sinais dispersos ou isolados. Mais exploração do que conclusão. Pode esconder sementes ou apenas ruído.";
    }

    // Signals Analysis
    const signals = metrics?.dominantSignals || { state: [], matter: [], movement: [] };

    return (
        <div className="absolute right-0 top-0 h-full w-[420px] bg-zinc-950 border-l border-white/10 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className={`text-[10px] font-mono tracking-widest px-2 py-1 rounded border ${statusBg} ${statusColor}`}>
                        {classification || 'WEAK'} · {(strength_score * 100).toFixed(0)}% POWER
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div>
                    <h2 className="text-2xl font-light text-white leading-tight mb-1">{name_suggested}</h2>
                    <p className="text-sm text-zinc-400">{summary}</p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Block 1: What is this */}
                <section>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-3">
                        <Hexagon className="w-3 h-3 text-zinc-500" />
                        O que é este cluster?
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        {metrics?.justification || "Este cluster representa um conjunto de referências que compartilham sinais semelhantes, mas a coesão ainda está sendo analisada."}
                    </p>
                    <div className="mt-3 p-3 bg-zinc-900 rounded-lg border border-white/5 text-xs text-zinc-400 italic">
                        "{statusDesc}"
                    </div>
                </section>

                {/* Block 2: Cognitive Force */}
                <section>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-3">
                        <Activity className="w-3 h-3 text-zinc-500" />
                        Força Cognitiva {(strength_score * 100).toFixed(0)}%
                    </h4>
                    <div className="space-y-2">
                        <MetricBar label="Massa (Qtd)" value={Math.min(100, (metrics?.nodeCount || 0) * 10)} />
                        <MetricBar label="Densidade" value={(metrics?.density?.avg || 0) * 100} />
                        <MetricBar label="Recorrência" value={((metrics?.recurrence?.state || 0) + (metrics?.recurrence?.matter || 0)) * 50} />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">
                        Este tamanho não é arbitrário. Ele reflete a capacidade deste grupo de sustentar uma "vibe" coesa sem se fragmentar.
                    </p>
                </section>

                {/* Block 3: Dominant Signals */}
                <section>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-3">
                        <Layers className="w-3 h-3 text-zinc-500" />
                        Sinais Dominantes
                    </h4>
                    <div className="grid gap-2">
                        <SignalRow type="Estado" value={signals.state[0]} secondary={signals.state[1]} />
                        <SignalRow type="Matéria" value={signals.matter[0]} secondary={signals.matter[1]} />
                        <SignalRow type="Movimento" value={signals.movement[0]} secondary={signals.movement[1]} />
                    </div>
                </section>

                {/* Block 4: Action */}
                <section className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                        <Zap className="w-3 h-3" />
                        Leitura Estratégica
                    </h4>
                    <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
                        {isStrong && (
                            <>
                                <li>Este mundo está pronto.</li>
                                <li>Tencione os limites visualmente.</li>
                                <li>Nomeie e exporte como Card de Vibe.</li>
                            </>
                        )}
                        {isProto && (
                            <>
                                <li>Pede decisão editorial.</li>
                                <li>Adicione mais referências para consolidar?</li>
                                <li>Ou funda com um cluster adjacente?</li>
                            </>
                        )}
                        {isNoise && (
                            <>
                                <li>Não descarte imediatamente.</li>
                                <li>Use como campo de exploração lateral.</li>
                                <li>Pode ser absorvido se a vibe mudar.</li>
                            </>
                        )}
                    </ul>
                </section>

            </div>
        </div>
    );
}

function MetricBar({ label, value }: { label: string, value: number }) {
    return (
        <div className="flex items-center gap-3 text-xs">
            <span className="w-20 text-zinc-500 text-right">{label}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-white/30 rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </div>
            <span className="w-8 text-zinc-400 font-mono text-[10px]">{value.toFixed(0)}%</span>
        </div>
    )
}

function SignalRow({ type, value, secondary }: { type: string, value: string, secondary?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-baseline gap-2 text-sm border-b border-white/5 pb-2 last:border-0">
            <span className="text-zinc-500 text-xs uppercase tracking-wide w-20">{type}</span>
            <span className="text-white font-medium">{value}</span>
            {secondary && <span className="text-zinc-600 text-xs">/ {secondary}</span>}
        </div>
    )
}
