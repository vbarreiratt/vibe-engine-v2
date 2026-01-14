import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaggingInterface } from './tagging-interface' // Client Component
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TaggingPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const projectId = (await params).id

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
        <TaggingInterface images={images} projectId={projectId} />
    )
}
