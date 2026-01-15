import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getScanWithRunData } from '../../../../scan/actions'
import { SignalWorkspace } from '../../../signal-workspace'

export default async function ViewRunPage({ params }: { params: Promise<{ id: string, scanId: string, runId: string }> }) {
    const supabase = await createClient()
    const { id: projectId, scanId, runId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const result = await getScanWithRunData(scanId, runId)

    if (result.error || !result.scan) {
        // Fallback to gallery if error
        redirect(`/dashboard/project/${projectId}/signals/${scanId}`)
    }

    const { scan, run, images } = result

    // Transform images for workspace
    const transformedImages = (images || []).map((img: any) => ({
        id: img.id,
        thumb_url: img.thumb_url,
        original_url: img.original_url,
        title: img.original_url?.split('/').pop() || 'Sem Título',
        // In view mode, we expect signals to be within the image_signals array (filtered by filtered query)
        signals: img.image_signals?.[0] || { state: [], matter: [], movement: [] }
    }))

    return (
        <SignalWorkspace
            images={transformedImages}
            projectId={projectId}
            scanName={scan?.name || ''}
            scanId={scanId}
            initialRunName={run?.name}
            initialRunId={runId}
        />
    )
}
