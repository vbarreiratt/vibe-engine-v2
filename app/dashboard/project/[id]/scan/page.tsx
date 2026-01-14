import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScanGrid } from './scan-grid' // Client Component
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const projectId = (await params).id

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Pending Images
    // Join with image_scan to find pending
    const { data: pendingImages } = await supabase
        .from('image_scan')
        .select('image_id, status, images (id, thumb_url)')
        .eq('project_id', projectId)
        .eq('status', 'pending')

    // Transform data
    const images = pendingImages?.map((item: any) => ({
        id: item.images.id,
        thumb_url: item.images.thumb_url
    })) || []

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
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
    )
}
