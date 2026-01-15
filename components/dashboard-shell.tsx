import React from 'react';
import { cn } from '@/lib/utils';

export function DashboardShell({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <div className={cn("container max-w-7xl mx-auto px-8 py-10", className)}>
                {children}
            </div>
        </div>
    );
}
