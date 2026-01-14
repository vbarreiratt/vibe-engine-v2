import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaggingInterface } from './tagging-interface' // Client Component
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TaggingPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const projectId = params.id

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Approved Images (Scan Status = 'vibra')
    // And also fetch existing signals if any
    const { data: approvedImages } = await supabase
        .from('image_scan')
        .select(`
        image_id, 
        images (id, original_url, thumb_url),
        image_signals (state, matter, movement)
    `)
        .eq('project_id', projectId)
        .eq('status', 'vibra')

    // Transform
    const images = approvedImages?.map((item: any) => ({
        id: item.images.id,
        thumb_url: item.images.thumb_url,
        original_url: item.images.original_url,
        signals: item.image_signals?.[0] || null // image_id is unique in signals
    })) || []

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto h-full">
            <div className="flex items-center gap-4 mb-4">
                <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-light text-white">Leitura de Sinais</h1>
                    <p className="text-zinc-500 text-sm">Gere e refine as camadas semióticas de cada vibe.</p>
                </div>
            </div>

            <TaggingInterface images={images} projectId={projectId} />
        </div>
    )
}
