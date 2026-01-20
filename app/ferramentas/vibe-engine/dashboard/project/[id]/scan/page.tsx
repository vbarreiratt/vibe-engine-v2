import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScanGrid } from './scan-grid' // Client Component
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function ScanPage({ params, searchParams }: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ scope?: string }>
}) {
    const supabase = await createClient()
    const projectId = (await params).id
    const scope = (await searchParams).scope || 'mine'

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Base Query
    let query = supabase
        .from('image_scan')
        .select(`
            image_id, 
            status, 
            images!inner (
                id, 
                thumb_url,
                created_by,
                ingestions!inner (
                    visibility
                )
            )
        `)
        .eq('project_id', projectId)
        .eq('status', 'pending')

    // Apply Scope Filters
    if (scope === 'mine') {
        query = query.eq('images.created_by', user.id)
    } else if (scope === 'project') {
        query = query.eq('images.ingestions.visibility', 'public')
    }
    // 'all' = no extra filter (RLS handles permissions)

    const { data: pendingImages, error } = await query

    if (error) {
        console.error('Scan Fetch Error:', error)
    }

    // Transform data
    const images = pendingImages?.map((item: any) => ({
        id: item.images.id,
        thumb_url: item.images.thumb_url
    })) || []

    return (
        <DashboardShell className="max-w-[1600px]">
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-light text-white">Varredura de Sinais</h1>
                    <p className="text-zinc-500 text-sm">Decida rápido: Vibra ou não vibra? Não racionalize agora.</p>
                </div>
            </div>

            <ScanGrid images={images} projectId={projectId} />
            </div>
        </DashboardShell>
    )
}
