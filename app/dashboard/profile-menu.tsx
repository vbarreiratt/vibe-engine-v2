'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, User as UserIcon, Shield, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface ProfileMenuProps {
    email: string
    nickname?: string
    role: string
    avatarUrl?: string
}

export function ProfileMenu({ email, nickname, role, avatarUrl }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group text-left"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold border border-white/10 shadow-sm group-hover:border-white/20 transition-colors bg-cover bg-center" style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}>
                    {!avatarUrl && (nickname?.[0]?.toUpperCase() || email[0].toUpperCase())}
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                    <span className="text-sm font-medium text-zinc-200 truncate">{nickname || email}</span>
                    <span className="text-[10px] text-zinc-500 capitalize flex items-center gap-1">
                        {role === 'admin' && <Shield className="w-3 h-3" />}
                        {role}
                    </span>
                </div>
                <MoreVertical className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                    <div className="p-1">
                        <Link
                            href="/dashboard/profile"
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white text-sm transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <UserIcon className="w-4 h-4" />
                            Meu Perfil
                        </Link>

                        {role === 'admin' && (
                            <Link
                                href="/dashboard/admin"
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white text-sm transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Shield className="w-4 h-4" />
                                Administração
                            </Link>
                        )}

                        <div className="h-px bg-white/5 my-1" />

                        <form action="/auth/signout" method="post">
                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-sm transition-colors text-left">
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
