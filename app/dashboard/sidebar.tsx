'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutGrid, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProfileMenu } from './profile-menu'
import { UserAvatar } from '@/components/user-avatar'
import { AvatarConfig } from '@/lib/avatar-assets'
import { useState, useEffect } from 'react'

interface SidebarProps {
    email: string
    nickname?: string
    role: string
    avatarConfig?: AvatarConfig | null
}

export function Sidebar({ email, nickname, role, avatarConfig }: SidebarProps) {
    const pathname = usePathname()

    // Auto-collapse when inside a project
    const isInsideProject = pathname.startsWith('/dashboard/project/')
    const [collapsed, setCollapsed] = useState(isInsideProject)

    // Update collapsed state when navigating
    useEffect(() => {
        setCollapsed(isInsideProject)
    }, [isInsideProject])

    return (
        <aside
            className={`${collapsed ? 'w-16' : 'w-64'} border-r border-white/5 bg-zinc-950/50 flex flex-col transition-all duration-300 ease-in-out`}
        >
            <div className={`${collapsed ? 'p-3' : 'p-6'}`}>
                {/* Logo */}
                <Link href="/dashboard" className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} cursor-pointer select-none mb-8`}>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] shrink-0" />
                    {!collapsed && (
                        <span className="font-bold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            Vibe Engine
                        </span>
                    )}
                </Link>

                {/* Navigation */}
                <nav className="space-y-1">
                    {!collapsed && (
                        <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Menu Principal
                        </div>
                    )}
                    <Link
                        href="/dashboard"
                        className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all hover:bg-white/5 text-zinc-400 hover:text-white group`}
                        title={collapsed ? 'Projetos' : undefined}
                    >
                        <LayoutGrid className="w-5 h-5 group-hover:text-white transition-colors shrink-0" />
                        {!collapsed && <span className="font-medium">Projetos</span>}
                    </Link>
                    {role === 'admin' && (
                        <Link
                            href="/dashboard/admin"
                            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all hover:bg-white/5 text-zinc-400 hover:text-white group`}
                            title={collapsed ? 'Gestão' : undefined}
                        >
                            <Users className="w-5 h-5 group-hover:text-white transition-colors shrink-0" />
                            {!collapsed && <span className="font-medium">Gestão</span>}
                        </Link>
                    )}
                </nav>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={`absolute ${collapsed ? 'left-12' : 'left-60'} top-6 bg-zinc-900 border border-white/10 rounded-full p-1 hover:bg-zinc-800 transition-all duration-300 z-10`}
                title={collapsed ? 'Expandir' : 'Recolher'}
            >
                {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-zinc-400" />
                )}
            </button>

            {/* Profile Menu */}
            <div className={`mt-auto ${collapsed ? 'p-2' : 'p-4'} border-t border-white/5 bg-zinc-900/20`}>
                {collapsed ? (
                    <Link href="/dashboard/profile" className="flex justify-center" title={nickname || email}>
                        {avatarConfig ? (
                            <UserAvatar config={avatarConfig} className="w-10 h-10 rounded-full border border-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold border border-white/10">
                                {nickname?.[0]?.toUpperCase() || email[0].toUpperCase()}
                            </div>
                        )}
                    </Link>
                ) : (
                    <ProfileMenu
                        email={email}
                        nickname={nickname}
                        role={role}
                        avatarConfig={avatarConfig}
                    />
                )}
            </div>
        </aside>
    )
}
