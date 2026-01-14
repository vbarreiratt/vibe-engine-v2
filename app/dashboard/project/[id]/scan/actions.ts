'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitScanDecision(projectId: string, imageId: string, status: 'vibra' | 'nao_vibra') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Upsert Scan Decision
    // We used to have separate table image_scan linked to images.
    // Let's invoke upsert on image_scan.

    // Check if it exists? We likely created a pending one on upload.
    // So update is better.

    const { error } = await supabase
        .from('image_scan')
        .update({
            status,
            scanned_by: user.id,
            scanned_at: new Date().toISOString()
        })
        .eq('image_id', imageId)
        .eq('project_id', projectId) // Extra safety

    if (error) {
        console.error('Scan Error', error)
        return { error: error.message }
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'image_scan',
        entity_id: imageId,
        action_type: status === 'vibra' ? 'scan_vibe' : 'scan_no_vibe',
        actor_user_id: user.id,
        project_id: projectId
    })

    revalidatePath(`/dashboard/project/${projectId}/scan`)
    return { success: true }
}

export async function batchSubmitScan(projectId: string, decisions: { imageId: string, status: 'vibra' | 'nao_vibra' }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    if (decisions.length === 0) return

    // Since upsert might be tricky with massive batches if we want to update.
    // But we are updating status. 'image_scan' already has rows.
    // Postgres doesn't allow update from values list easily in standard SQL without logic.
    // It's cleaner to loop promises concurrently or use a stored procedure.
    // With Supabase client, we can't bulk update diverse values easily in one call unless we upsert with all columns.
    // Let's rely on Promise.all server-side, it's fast enough for <1000 items usually.

    await Promise.all(decisions.map(d =>
        supabase.from('image_scan')
            .update({
                status: d.status,
                scanned_by: user.id,
                scanned_at: new Date().toISOString()
            })
            .eq('image_id', d.imageId)
            .eq('project_id', projectId)
    ))

    revalidatePath(`/dashboard/project/${projectId}/scan`)
    return { success: true }
}

// ============================================
// NEW: Varredura Entity (Named Scan Selection)
// ============================================

export interface CreateScanInput {
    projectId: string
    name: string
    visibility: 'public' | 'private'
    imageIds: string[]
}

export async function createScan(input: CreateScanInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { projectId, name, visibility, imageIds } = input

    if (!name || name.trim().length < 2) {
        return { error: 'Nome da varredura é obrigatório (mínimo 2 caracteres)' }
    }

    if (!imageIds || imageIds.length === 0) {
        return { error: 'Selecione ao menos uma imagem para a varredura' }
    }

    // Create scan
    const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert({
            project_id: projectId,
            curator_id: user.id,
            name: name.trim(),
            visibility
        })
        .select()
        .single()

    if (scanError) {
        console.error('Create Scan Error:', scanError)
        return { error: scanError.message }
    }

    // Insert scan images
    const scanImages = imageIds.map(imageId => ({
        scan_id: scan.id,
        image_id: imageId
    }))

    const { error: imagesError } = await supabase
        .from('scan_images')
        .insert(scanImages)

    if (imagesError) {
        console.error('Create Scan Images Error:', imagesError)
        // Rollback scan
        await supabase.from('scans').delete().eq('id', scan.id)
        return { error: imagesError.message }
    }

    // Audit
    await supabase.from('audit_log').insert({
        project_id: projectId,
        entity_type: 'scan',
        entity_id: scan.id,
        action_type: 'create_scan',
        actor_user_id: user.id,
        after_data: { name, visibility, image_count: imageIds.length }
    })

    revalidatePath(`/dashboard/project/${projectId}`)
    return { success: true, scanId: scan.id }
}

export async function getProjectScans(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get scans with image count - using raw count
    const { data: scans, error } = await supabase
        .from('scans')
        .select(`
            *,
            curator:profiles!scans_curator_id_fkey(nickname, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Get Scans Error:', error)
        return { error: error.message, scans: [] }
    }

    // Get image counts and signals_run counts for each scan
    const scansWithCount = await Promise.all((scans || []).map(async (scan) => {
        const { count: imageCount } = await supabase
            .from('scan_images')
            .select('*', { count: 'exact', head: true })
            .eq('scan_id', scan.id)

        const { count: signalsRunCount } = await supabase
            .from('signals_runs')
            .select('*', { count: 'exact', head: true })
            .eq('scan_id', scan.id)

        return {
            ...scan,
            image_count: imageCount || 0,
            signals_run_count: signalsRunCount || 0
        }
    }))

    // Filter: show own scans + public scans
    const filteredScans = scansWithCount.filter(scan =>
        scan.curator_id === user.id || scan.visibility === 'public'
    )

    return { scans: filteredScans }
}

export async function getScanWithImages(scanId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get scan
    const { data: scan, error: scanError } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .single()

    if (scanError) {
        return { error: scanError.message }
    }

    // Check access
    if (scan.curator_id !== user.id && scan.visibility !== 'public') {
        const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
        if (profile?.role !== 'admin') {
            return { error: 'Acesso negado a esta varredura' }
        }
    }

    // Get images
    const { data: scanImages, error: imagesError } = await supabase
        .from('scan_images')
        .select(`
            image:images(
                *,
                image_signals(state, matter, movement)
            )
        `)
        .eq('scan_id', scanId)

    if (imagesError) {
        return { error: imagesError.message }
    }

    const images = scanImages?.map(si => si.image).filter(Boolean) || []

    return { scan, images }
}

export async function deleteScan(scanId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get scan to check ownership
    const { data: scan, error: scanError } = await supabase
        .from('scans')
        .select('*, project_id')
        .eq('id', scanId)
        .single()

    if (scanError) {
        return { error: scanError.message }
    }

    // Check permission: owner or admin
    if (scan.curator_id !== user.id) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
        if (profile?.role !== 'admin') {
            return { error: 'Você não tem permissão para excluir esta varredura' }
        }
    }

    // Delete (cascade will remove scan_images)
    const { error: deleteError } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId)

    if (deleteError) {
        return { error: deleteError.message }
    }

    // Audit
    await supabase.from('audit_log').insert({
        project_id: scan.project_id,
        entity_type: 'scan',
        entity_id: scanId,
        action_type: 'delete_scan',
        actor_user_id: user.id,
        before_data: { name: scan.name }
    })

    revalidatePath(`/dashboard/project/${scan.project_id}`)
    return { success: true }
}
// ============================================
// SIGNALS
// ============================================

export async function createSignalRun(
    projectId: string,
    scanId: string,
    name: string,
    visibility: 'public' | 'private',
    signalsData: Record<string, {
        signals: { state: string[], matter: string[], movement: string[] },
        ai: { description: string | null, reasoning: string | null, model: string | null, runId: string | null }
    }>
) {
    const supabase = await createClient()

    // 1. Create the Run
    const { data: run, error: runError } = await supabase
        .from('signals_runs')
        .insert({
            project_id: projectId,
            scan_id: scanId,
            name: name,
            visibility: visibility,
            curator_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

    if (runError) throw new Error(`Failed to create run: ${runError.message}`)

    // 2. Prepare Signal Records
    const records = Object.entries(signalsData).map(([imageId, data]) => ({
        image_id: imageId,
        run_id: run.id,
        state: data.signals.state,
        matter: data.signals.matter,
        movement: data.signals.movement,
        ai_description: data.ai.description,
        raw_reasoning: data.ai.reasoning,
        model_name: data.ai.model,
        // The 'run_id' in AI data (e.g. from a past inference) is just metadata. 
        // The 'run_id' column in the table is the FK to signals_runs. 
        // We can store the AI Run ID in a metadata column if we had one, but strict prompt didn't ask for a separate column for "AI Run ID" vs "Signal Run ID".
        // Given the prompt context "armazenar por imagem... run_id", and now "criar um signals_run", it's likely they are distinct concepts (AI Run vs User Session Run).
        // However, the DB column 'run_id' is now FK. 
        // We will ignore the AI's internal run_id for the FK column, or store it elsewhere if we had a column. Ref migration 003 added 'run_id' UUID.
        // Migration 004 linked it. 
        // So 'run_id' column IS the Signal Run ID.
    }))

    if (records.length > 0) {
        const { error: signalsError } = await supabase
            .from('image_signals')
            .insert(records)

        if (signalsError) throw new Error(`Failed to save signals: ${signalsError.message}`)
    }

    revalidatePath(`/dashboard/project/${projectId}`)
    return { success: true, runId: run.id }
}

export async function updateSignalRun(
    runId: string,
    signalsData: Record<string, {
        signals: { state: string[], matter: string[], movement: string[] },
        ai: { description: string | null, reasoning: string | null, model: string | null, runId: string | null }
    }>
) {
    const supabase = await createClient()

    // 1. Update signals_runs timestamp
    const { error: runError } = await supabase
        .from('signals_runs')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', runId)

    if (runError) throw new Error(`Failed to update run: ${runError.message}`)

    // 2. Prepare Signal Records
    const records = Object.entries(signalsData).map(([imageId, data]) => ({
        image_id: imageId,
        run_id: runId,
        state: data.signals.state,
        matter: data.signals.matter,
        movement: data.signals.movement,
        ai_description: data.ai.description,
        raw_reasoning: data.ai.reasoning,
        model_name: data.ai.model,
    }))

    if (records.length > 0) {
        // 3. Delete existing signals for this run (Clean state)
        const { error: deleteError } = await supabase
            .from('image_signals')
            .delete()
            .eq('run_id', runId)

        if (deleteError) throw new Error(`Failed to clear old signals: ${deleteError.message}`)

        // 4. Insert new signals
        const { error: signalsError } = await supabase
            .from('image_signals')
            .insert(records)

        if (signalsError) throw new Error(`Failed to save signals: ${signalsError.message}`)
    }

    return { success: true }
}

export async function getSignalRuns(scanId: string) {
    const supabase = await createClient()
    const { data: runs, error } = await supabase
        .from('signals_runs')
        .select(`
            *,
            curator:profiles!signals_runs_curator_id_fkey(nickname, email)
        `)
        .eq('scan_id', scanId)
        .order('created_at', { ascending: false })

    return { runs, error }
}

export async function getScanWithRunData(scanId: string, runId: string) {
    const supabase = await createClient()

    // 1. Get Run Details
    const { data: run, error: runError } = await supabase
        .from('signals_runs')
        .select('*')
        .eq('id', runId)
        .single()

    if (runError) return { error: runError.message }

    // 2. Get Scan Images (Universe)
    const { data: scanImages, error: imagesError } = await supabase
        .from('scan_images')
        .select(`
            image:images(
                id, original_url, thumb_url
            )
        `)
        .eq('scan_id', scanId)

    if (imagesError) return { error: imagesError.message }

    // 3. Get Specific Signals for this Run
    const { data: signals } = await supabase
        .from('image_signals')
        .select('*')
        .eq('run_id', runId)

    const signalsMap = new Map((signals || []).map(s => [s.image_id, s]))

    // 4. Merge
    const images = scanImages?.map((si: any) => ({
        ...si.image,
        image_signals: signalsMap.get(si.image.id) ? [signalsMap.get(si.image.id)] : []
    })) || []

    // 5. Get Scan Info
    const { data: scan } = await supabase.from('scans').select('name').eq('id', scanId).single()

    return { scan, run, images }
}
