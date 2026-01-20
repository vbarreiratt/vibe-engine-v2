'use server'

import { createClient } from '@/lib/supabase/server'
import { runResonance } from '@/lib/clustering/engine'
import { revalidatePath } from 'next/cache'

export async function generateClusters(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Fetch Tagged Images
    const { data: taggedImages } = await supabase
        .from('image_scan')
        .select(`
            image_id, 
            status,
            image_signals!inner (state, matter, movement)
        `)
        .eq('project_id', projectId)
        .eq('status', 'vibra') // Only vibe-approved images

    if (!taggedImages || taggedImages.length < 3) {
        throw new Error('Need at least 3 vibe-approved images with tags to cluster.')
    }

    const items = taggedImages.map((row: any) => ({
        id: row.image_id,
        tags: row.image_signals
    }))

    // 2. Run Engine
    const clusters = await runResonance(items)

    // 3. Save Results
    // Create a "Run" ID or just overwrite? logic says "salvar clusters... associados ao projeto e ao run atual".
    const runId = `run_${Date.now()}`

    // Clear previous clusters for this project? Or keep history?
    // "Revisão... salvar versão final".
    // Let's create new clusters.

    for (const c of clusters) {
        const { data: clusterData, error: cErr } = await supabase
            .from('clusters')
            .insert({
                project_id: projectId,
                run_id: runId,
                name: c.name,
                cohesion_score: c.cohesion
            })
            .select()
            .single()

        if (cErr) console.error(cErr)

        if (clusterData) {
            const relations = c.imageIds.map(imgId => ({
                cluster_id: clusterData.id,
                image_id: imgId,
                kind: 'core'
            }))

            await supabase.from('cluster_images').insert(relations)
        }
    }

    // Audit
    await supabase.from('audit_log').insert({
        entity_type: 'cluster_run',
        entity_id: projectId, // linking to project as entity
        action_type: 'resonance_run',
        after_data: { runId, clusters_count: clusters.length },
        actor_user_id: user.id
    })

    revalidatePath(`/dashboard/project/${projectId}`)
    revalidatePath(`/dashboard/project/${projectId}/resonance`)
    return { success: true, count: clusters.length }
}
