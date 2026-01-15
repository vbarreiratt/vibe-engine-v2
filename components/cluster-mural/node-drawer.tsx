import { X, Copy,  Waves, Activity,  Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NodeDrawerProps {
    node: any;
    cluster: any;
    edges: any[];
    onClose: () => void;
    onCenterNode?: (x: number, y: number) => void;
    onToggleConnections?: (show: boolean) => void;
    showConnections?: boolean;
}

export function NodeDrawer({ 
    node, 
    cluster, 
    edges, 
    onClose, 
}: NodeDrawerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scrolled, setScrolled] = useState(false);
    const [copied, setCopied] = useState(false);

    // Scroll effect for "dimming" the image
    const [overlayOpacity, setOverlayOpacity] = useState(0);

    // Handle initial mount animation
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!node) return null;

    const { 
        id, 
        image, 
        description_ai, 
        signals, 
        ingestion 
    } = node;

    const shortId = id.slice(0, 8);
    
    // Fallback copy logic
    const handleCopyId = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const triggerPoint = window.innerHeight * 0.3; // 30% down
        
        // Calculate dynamic opacity for the dark overlay behind text to improve readability
        // as the user scrolls deeper
        const maxOpacity = 0.9;
        const newOpacity = Math.min(maxOpacity, Math.max(0, (scrollTop) / (window.innerHeight * 0.6)));
        setOverlayOpacity(newOpacity);

        setScrolled(scrollTop > 50);
    };

    return (
        <div 
            className={cn(
                "fixed inset-y-0 right-0 z-[100] w-full md:w-[600px] bg-black shadow-2xl transition-transform duration-500 ease-out",
                mounted ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* 1. BACKGROUND LAYER (The Object) */}
            <div className="absolute inset-0 z-0 bg-zinc-950">
                {image?.full_url ? (
                    <img 
                        src={image.full_url} 
                        alt="Reference" 
                        className="w-full h-full object-cover opacity-100 transition-transform duration-[2s] hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800">
                         <div className="w-32 h-32 rounded-full border border-zinc-900 flex items-center justify-center">
                            <span className="text-xs tracking-widest uppercase">Void</span>
                         </div>
                    </div>
                )}
                {/* Dynamic Darkening Layer - emergent visibility */}
                <div 
                    className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-100 ease-linear"
                    style={{ opacity: 0.2 + (overlayOpacity * 0.7) }} 
                />
            </div>

            {/* 2. INTERFACE LAYER (Minimalist) */}
            <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">
                {/* ID - Disappear on scroll to focus on reading */}
                <div className={cn(
                    "transition-all duration-500 pointer-events-auto",
                    scrolled ? "opacity-0 -translate-y-4" : "opacity-70 hover:opacity-100"
                )}>
                    <button 
                        onClick={handleCopyId}
                        className="group flex flex-col items-start gap-1"
                    >
                         <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 group-hover:text-lime-400 transition-colors">
                            Ref / {shortId}
                        </span>
                        {copied && <span className="text-[10px] text-lime-400 animate-in fade-in">Copiado</span>}
                    </button>
                </div>

                {/* Close Button - Always accessible but subtle */}
                <button 
                    onClick={onClose}
                    className="pointer-events-auto relative group"
                >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-colors duration-500" />
                    <X className="w-8 h-8 text-white/80 group-hover:text-white transition-colors duration-300 stroke-[1px]" />
                </button>
            </div>

            {/* 3. SCROLL CONTENT LAYER */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="absolute inset-0 z-20 overflow-y-auto scrollbar-hide snap-y snap-mandatory"
            >
                {/* Spacer to force image protagonism */}
                <div className="h-[75vh] w-full snap-start" />

                {/* Text Content - Emerges from bottom */}
                <div 
                    ref={contentRef}
                    className="min-h-screen relative z-10 px-8 pb-32 pt-20 bg-gradient-to-b from-transparent via-black/80 to-black snap-start"
                >
                    {/* The Emergent Text */}
                    <div className="max-w-lg mx-auto space-y-16">
                        
                        {/* Description */}
                        <section className="space-y-6">
                            {description_ai ? (
                                <h2 className="text-3xl md:text-3xl leading-tight font-light text-white/90 font-serif tracking-wide drop-shadow-lg">
                                    {description_ai}
                                </h2>
                            ) : (
                                <div className="space-y-2">
                                    <h2 className="text-3xl md:text-3xl leading-tight font-light text-white/70 font-serif tracking-wide drop-shadow-lg italic">
                                        {(signals?.state?.length > 0 || signals?.matter?.length > 0 || signals?.movement?.length > 0) 
                                            ? "Leitura sem descrição textual." 
                                            : "Ainda sem palavras."}
                                    </h2>
                                    <p className="text-zinc-500 font-light text-sm">
                                        {(signals?.state?.length > 0 || signals?.matter?.length > 0 || signals?.movement?.length > 0)
                                            ? "Frequências vibracionais detectadas, mas o texto ainda não emergiu."
                                            : "Sem sinais nesta leitura."}
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Signals as Frequencies - ALWAYS RENDER if at least one exists, or placeholder if we are in a 'read' state */}
                        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 fill-mode-both">
                            <div className="w-12 h-[1px] bg-white/20" /> {/* Divider */}

                            <h3 className="text-xs uppercase tracking-[0.3em] text-lime-400/80 font-bold mb-6">
                                DNA Vibracional
                            </h3>

                            <div className="grid grid-cols-1 gap-10">
                                {/* State Frequencies */}
                                <div className="space-y-3">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 block flex items-center gap-2">
                                        Frequência de Estado
                                        {!signals?.state?.length && <span className="text-zinc-700 italic lowercase tracking-normal ml-auto">Não manifesto</span>}
                                    </span>
                                    {signals?.state?.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {signals.state.map((s: string) => (
                                                <FrequencyItem key={s} label={s} intensity={3} />
                                            ))}
                                        </div>
                                    ) : (
                                       <div className="h-0.5 w-8 bg-white/5 rounded-full" />
                                    )}
                                </div>

                                {/* Matter Frequencies */}
                                <div className="space-y-3">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 block flex items-center gap-2">
                                         Matéria Percebida
                                         {!signals?.matter?.length && <span className="text-zinc-700 italic lowercase tracking-normal ml-auto">Não manifesto</span>}
                                    </span>
                                    {signals?.matter?.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {signals.matter.map((s: string) => (
                                                 <FrequencyItem key={s} label={s} intensity={2} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-0.5 w-8 bg-white/5 rounded-full" />
                                    )}
                                </div>

                                {/* Movement Frequencies - NEW */}
                                <div className="space-y-3">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 block flex items-center gap-2">
                                         Movimento / Comportamento
                                         {!signals?.movement?.length && <span className="text-zinc-700 italic lowercase tracking-normal ml-auto">Não manifesto</span>}
                                    </span>
                                    {signals?.movement?.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {signals.movement.map((s: string) => (
                                                 <FrequencyItem key={s} label={s} intensity={3} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-0.5 w-8 bg-white/5 rounded-full" />
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* System Trace (Low Hierarchy) */}
                        <section className="pt-24 opacity-40 hover:opacity-100 transition-opacity duration-700">
                             <div className="border-t border-white/10 pt-8 flex flex-col gap-4">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                                    Rastro do Sistema
                                </span>
                                
                                <div className="grid grid-cols-2 gap-y-2 text-xs font-mono text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-3 h-3" />
                                        <span>Status: {node.is_outlier ? 'Outlier' : 'Core'}</span>
                                    </div>
                                    <div>
                                        Ingestão: {new Date(ingestion?.created_at || Date.now()).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="col-span-2">
                                        Cluster: {cluster?.label || "—"}
                                    </div>
                                    {ingestion?.scan_name && (
                                         <div className="col-span-2 text-zinc-600">
                                            Origem: {ingestion.scan_name}
                                        </div>
                                    )}
                                </div>
                             </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}

// "Frequency" visual component
function FrequencyItem({ label, intensity = 2 }: { label: string, intensity?: number }) {
    return (
        <div className="group flex items-center justify-between py-1 border-b border-white/5 hover:border-white/20 transition-colors duration-500 cursor-default">
            <span className="text-lg font-light text-zinc-300 group-hover:text-white transition-colors tracking-wide">
                {label}
            </span>
            <div className="flex gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
                {[1, 2, 3, 4].map((i) => (
                    <div 
                        key={i} 
                        className={cn(
                            "w-1 h-1 rounded-full",
                            i <= intensity ? "bg-white" : "border border-white/50"
                        )} 
                    />
                ))}
            </div>
        </div>
    );
}

// Helper icon component for vibes (unused currently but consistent with style)
function VibeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5 8 12 8C19 8 22 12 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M2 16C2 16 5 12 12 12C19 12 22 16 22 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    )
}
