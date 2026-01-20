import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getScanWithImages } from '../../../scan/actions'
import { SignalWorkspace } from '../../signal-workspace'

export default async function NewRunPage({ params }: { params: Promise<{ id: string, scanId: string }> }) {
    const supabase = await createClient()
    const { id: projectId, scanId } = await params

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get Scan Images
    const scanResult = await getScanWithImages(scanId)

    if (scanResult.error) {
        redirect(`/dashboard/project/${projectId}/signals`)
    }

    const { scan, images } = scanResult

    // Transform images for workspace (start fresh, no previous signals loaded for NEW RUN)
    // IMPORTANT: User wants clean slate for "New Run"
    const transformedImages = (images || []).map((img: any) => ({
        id: img.id,
        thumb_url: img.thumb_url,
        original_url: img.original_url,
        title: img.original_url?.split('/').pop() || 'Sem Título',
        // Start empty signals for a new run
        signals: { state: [], matter: [], movement: [] }
    }))

    return (
        <SignalWorkspace
            images={transformedImages}
            projectId={projectId}
            scanName={scan?.name || ''}
            scanId={scanId}
        />
    )
}
