'use server';

import { createClient } from '@/lib/supabase/server';
import { ClusterEditorData, EditorNode, EditorSignal, ClusterMetrics, SignalRole, NodeCurationStatus } from '@/types/cluster-editor';

/**
 * Fetches deep details for the Cluster Editor V1
 * In a real implementation, this would use graphology, but for V1 we approximate via DB queries.
 */
export async function getClusterEditorData(clusterId: string): Promise<ClusterEditorData | null> {
    const supabase = await createClient();

    // 1. Get Cluster Basic Info
    const { data: cluster, error: clusterError } = await supabase
        .from('clusters')
        .select('*')
        .eq('id', clusterId)
        .single();

    if (clusterError || !cluster) return null;

    const signalOverrides: Record<string, { role: SignalRole, layer: string }> = cluster.signal_overrides || {};

    // 2. Get Nodes (Images) in this Cluster
    const { data: clusterNodes, error: nodesError } = await supabase
        .from('cluster_nodes')
        .select(`
            id,
            image_id,
            curation_status,
            x,
            y,
            images!image_id (
                id,
                thumb_url,
                original_url,
                image_signals!inner (
                    state,
                    matter,
                    movement
                )
            )
        `)
        .eq('cluster_id', clusterId);

    if (nodesError || !clusterNodes) {
        console.error("Error fetching cluster nodes:", nodesError);
        return null;
    }

    // 3. Process Nodes & Aggregate Signals
    const nodes: EditorNode[] = [];
    const signalCounts: Record<string, { count: number; layer: string }> = {};
    const totalNodes = clusterNodes.length;

    clusterNodes.forEach((cn: any) => {
        const image = cn.images;
        const sigObj = Array.isArray(image.image_signals) ? image.image_signals[0] : image.image_signals;

        if (!sigObj) return;

        const nodeSignals: string[] = [];

        // Helper to process layers
        ['state', 'matter', 'movement'].forEach(layer => {
            const terms = sigObj[layer];
            if (Array.isArray(terms)) {
                terms.forEach((term: string) => {
                    nodeSignals.push(term);

                    if (!signalCounts[term]) {
                        signalCounts[term] = { count: 0, layer };
                    }
                    signalCounts[term].count++;
                });
            }
        });

        nodes.push({
            id: image.id,
            nodeId: cn.id,
            url: image.thumb_url || image.original_url,
            signals: nodeSignals,
            connectionStrength: 1, // V1 Simplification
            curationStatus: cn.curation_status || 'active'
        });
    });

    // 4. Calculate Signals Metrics (with Overrides)
    const signals: EditorSignal[] = Object.entries(signalCounts).map(([term, data]) => {
        const recurrence = data.count / totalNodes;

        // Default Logic
        let role: SignalRole = 'neutral';
        if (recurrence > 0.6) role = 'structural'; // was 'structural'
        else if (recurrence > 0.3) role = 'support';

        // Override Logic (Level 1)
        if (signalOverrides[term]) {
            role = signalOverrides[term].role;
        }

        return {
            term,
            layer: data.layer as any,
            recurrence,
            count: data.count,
            totalNodes,
            role,
            isActive: true, // Default view
            isPromoted: role === 'structural'
        };
    }).sort((a, b) => b.recurrence - a.recurrence);

    // 5. Derive Cluster Metrics
    const avgRecurrence = signals.length > 0
        ? signals.reduce((acc, s) => acc + s.recurrence, 0) / signals.length
        : 0;

    const density = clusterNodes.length > 0 ? (signals.length / clusterNodes.length) : 0; // Simple proxy

    let classification: 'STRONG' | 'PROTO' | 'WEAK' | 'NOISE' = 'WEAK';
    if (avgRecurrence > 0.5 && totalNodes > 5) classification = 'STRONG';
    else if (avgRecurrence > 0.3) classification = 'PROTO';
    else if (totalNodes < 3) classification = 'NOISE';

    // Count dominant layer
    const layerCounts = { state: 0, matter: 0, movement: 0 };
    signals.forEach(s => layerCounts[s.layer]++);
    const dominantLayer = (Object.keys(layerCounts) as Array<keyof typeof layerCounts>).reduce((a, b) => layerCounts[a] > layerCounts[b] ? a : b);

    const metrics: ClusterMetrics = {
        classification: cluster.classification || classification, // Prefer DB value (Motor Truth)
        avgRecurrence,
        density,
        stability: avgRecurrence * (totalNodes > 3 ? 1 : 0.5),
        nodeCount: totalNodes,
        dominantLayer: (layerCounts[dominantLayer] / signals.length) > 0.6 ? dominantLayer : 'balanced'
    };

    return {
        clusterId: cluster.id,
        label: cluster.name_suggested || 'Cluster',
        signals,
        nodes,
        metrics,
        synthesis: {
            name: cluster.name_final,
            description: cluster.description_final,
            role: cluster.synthesis_status
        }
    };
}

export async function updateClusterSynthesis(clusterId: string, data: { name?: string, description?: string, role?: string }) {
    const supabase = await createClient();

    // Build update object
    const update: any = {};
    if (data.name !== undefined) update.name_final = data.name;
    if (data.description !== undefined) update.description_final = data.description;
    if (data.role !== undefined) update.synthesis_status = data.role;

    if (Object.keys(update).length === 0) return;

    await supabase.from('clusters').update(update).eq('id', clusterId);
}

/**
 * Log actions for audit
 */
export async function logClusterEditorAction(clusterId: string, action: string, details: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // In a real scenario, insert into 'audit_log' table
    console.log(`[AUDIT] Cluster: ${clusterId} | Action: ${action} | User: ${user.id}`, details);

    // For V1, we just return true to simulate success
    return true;
}

export async function setSignalRole(clusterId: string, signal: string, role: SignalRole, layer: string, currentOverrides: any = {}) {
    const supabase = await createClient();

    // Logic: If role is different from default, store it. If back to 'neural', maybe remove it?
    // For simplicity, we just store what comes unless it is cleared.
    // Also, enforce "Only one MOTOR per layer" if role is 'structural'.

    const newOverrides = { ...currentOverrides };

    // Unset other structural in same layer if promoting this one
    if (role === 'structural') {
        Object.keys(newOverrides).forEach(key => {
            if (newOverrides[key].layer === layer && newOverrides[key].role === 'structural') {
                // Demote previous motor to support or just remove override?
                // Let's demote to support for safety
                newOverrides[key] = { ...newOverrides[key], role: 'support' };
            }
        });
    }

    newOverrides[signal] = { role, layer };

    const { error } = await supabase
        .from('clusters')
        .update({ signal_overrides: newOverrides })
        .eq('id', clusterId);

    if (!error) {
        await logClusterEditorAction(clusterId, 'set_signal_role', { signal, role, layer });
    }

    return { success: !error, error };
}

export async function setNodeCuration(clusterId: string, nodeId: string, status: NodeCurationStatus) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('cluster_nodes')
        .update({ curation_status: status })
        .eq('id', nodeId); // This is the join table ID

    if (!error) {
        await logClusterEditorAction(clusterId, 'set_node_status', { nodeId, status });
    }

    return { success: !error, error };
}

export async function mergeClusters(targetId: string, sourceId: string) {
    const supabase = await createClient();

    // 1. Get info on both clusters
    const { data: target } = await supabase.from('clusters').select('name_suggested').eq('id', targetId).single();
    const { data: source } = await supabase.from('clusters').select('name_suggested').eq('id', sourceId).single();

    if (!target || !source) return { success: false, error: "Cluster not found" };

    // 2. Component Logic: Fetch Nodes to Determine Geometry
    // We need to know who is who before we merge IDs
    const { data: sourceNodes } = await supabase.from('cluster_nodes').select('id, x, y').eq('cluster_id', sourceId);
    const { data: targetNodes } = await supabase.from('cluster_nodes').select('id, x, y').eq('cluster_id', targetId);

    const sNodes = sourceNodes || [];
    const tNodes = targetNodes || [];
    const allNodes = [...sNodes, ...tNodes];

    if (allNodes.length === 0) return { success: false, error: "No nodes to merge" };

    // 3. Calculation of New Positions
    const updates: { id: string, cluster_id: string, x?: number, y?: number }[] = [];

    // Strategy A: Fusion (Small groups) -> Pull everyone together
    // Strategy B: Absorption (Large groups) -> Pull source into target
    const isFusion = allNodes.length <= 5;

    if (isFusion) {
        // Calculate Combined Centroid
        const cx = allNodes.reduce((sum, n) => sum + (n.x || 0), 0) / allNodes.length;
        const cy = allNodes.reduce((sum, n) => sum + (n.y || 0), 0) / allNodes.length;

        // Reposition ALL nodes tightly around centroid
        allNodes.forEach(n => {
            // Vector from center
            const dx = (n.x || 0) - cx;
            const dy = (n.y || 0) - cy;
            const dist = Math.hypot(dx, dy);

            // Normalize to fixed radius (e.g. 50px spread) if distant
            // If dist is 0 (same spot), add jitter
            let scale = 0;
            if (dist > 50) scale = 50 / dist;
            else scale = 1; // Keep if already close

            // Add slight jitter to prevent perfect overlap if dist was 0
            const jitterX = (Math.random() - 0.5) * 10;
            const jitterY = (Math.random() - 0.5) * 10;

            updates.push({
                id: n.id,
                cluster_id: targetId,
                x: cx + (dx * scale) + jitterX,
                y: cy + (dy * scale) + jitterY
            });
        });
    } else {
        // Absorption: Target stays puts, Source comes in
        const cx = tNodes.reduce((sum, n) => sum + (n.x || 0), 0) / tNodes.length;
        const cy = tNodes.reduce((sum, n) => sum + (n.y || 0), 0) / tNodes.length;

        // Move Source Nodes to Target Centroid
        sNodes.forEach(n => {
            updates.push({
                id: n.id,
                cluster_id: targetId,
                x: cx + (Math.random() - 0.5) * 40, // Random placement in core
                y: cy + (Math.random() - 0.5) * 40
            });
        });
    }

    // 4. Perform Updates
    await Promise.all(updates.map(u =>
        supabase.from('cluster_nodes').update({
            cluster_id: u.cluster_id,
            x: u.x,
            y: u.y
        }).eq('id', u.id)
    ));

    // 5. Update Target Metadata (PROTO)
    await supabase.from('clusters').update({
        classification: 'PROTO',
        name_suggested: "Fusão Latente",
        description_suggested: "Resultado da fusão de mundos latentes."
    }).eq('id', targetId);

    // 6. Delete Source Cluster
    await supabase.from('clusters').delete().eq('id', sourceId);

    // 7. Log
    await logClusterEditorAction(targetId, 'merge_clusters', { mergedWith: sourceId });

    return { success: true };
}

export async function detachNodeFromCluster(
    nodeId: string,
    currentClusterId: string,
    position: { x: number, y: number },
    customNewClusterId?: string
) {
    console.log(`[Detach] Node: ${nodeId}, Cluster: ${currentClusterId}, CustomID: ${customNewClusterId}`);

    const supabase = await createClient();

    try {
        // 0. Fetch Parent Cluster Info
        const { data: parentCluster, error: parentError } = await supabase
            .from('clusters')
            .select('clusters_run_id')
            .eq('id', currentClusterId)
            .single();

        if (parentError || !parentCluster) {
            console.error("[Detach] Parent Error:", parentError);
            return { success: false, error: parentError?.message || "Parent cluster not found" };
        }

        // 1. Create New Cluster (Latent Bubble)
        const uniqueName = `Nova Bolha ${Date.now().toString().slice(-4)}`;
        const { data: newCluster, error: createError } = await supabase
            .from('clusters')
            .insert({
                ...(customNewClusterId ? { id: customNewClusterId } : {}),
                clusters_run_id: parentCluster.clusters_run_id,
                name_suggested: uniqueName,
                description_suggested: "Item destacado manualmente.",
                classification: 'NOISE' // Matches ClusterMetrics type
            })
            .select()
            .single();

        if (createError || !newCluster) {
            console.error("[Detach] Create Error:", createError);
            return { success: false, error: createError?.message || "Failed to create bubble" };
        }

        // 2. Move Node to New Cluster
        const { error: moveError } = await supabase
            .from('cluster_nodes')
            .update({
                cluster_id: newCluster.id,
                x: position.x,
                y: position.y
            })
            .eq('id', nodeId);

        if (moveError) {
            console.error("[Detach] Move Error:", moveError);
            return { success: false, error: moveError.message };
        }

        // 3. Cleanup Old Cluster if Empty
        const { count } = await supabase
            .from('cluster_nodes')
            .select('*', { count: 'exact', head: true })
            .eq('cluster_id', currentClusterId);

        if (count === 0) {
            await supabase.from('clusters').delete().eq('id', currentClusterId);
        }

        // 4. Log
        await logClusterEditorAction(newCluster.id, 'detach_node', { nodeId, from: currentClusterId });

        return { success: true, newClusterId: newCluster.id };
    } catch (e: any) {
        console.error("[Detach] Exception:", e);
        return { success: false, error: e.message || "Unknown server error" };
    }
}

export async function attachNodeToCluster(
    nodeId: string,
    targetClusterId: string
) {
    console.log(`[Attach] Node: ${nodeId} to Cluster: ${targetClusterId}`);
    const supabase = await createClient();

    try {
        // 1. Get current cluster ID for cleanup later
        const { data: currentNode } = await supabase
            .from('cluster_nodes')
            .select('cluster_id')
            .eq('id', nodeId)
            .single();

        const sourceClusterId = currentNode?.cluster_id;

        // 2. Move Node
        const { error: moveError } = await supabase
            .from('cluster_nodes')
            .update({
                cluster_id: targetClusterId
            })
            .eq('id', nodeId);

        if (moveError) throw moveError;

        // 3. Cleanup Source Cluster if empty
        if (sourceClusterId && sourceClusterId !== targetClusterId) {
            const { count } = await supabase
                .from('cluster_nodes')
                .select('*', { count: 'exact', head: true })
                .eq('cluster_id', sourceClusterId);

            if (count === 0) {
                await supabase.from('clusters').delete().eq('id', sourceClusterId);
            }
        }

        await logClusterEditorAction(targetClusterId, 'attach_node', { nodeId, from: sourceClusterId });
        return { success: true };

    } catch (e: any) {
        console.error("[Attach] Exception:", e);
        return { success: false, error: e.message || "Unknown error" };
    }
}

export async function saveSnapshot(
    runId: string,
    label: string,
    graph: { nodes: any[], edges: any[] },
    ui?: any
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resonance_snapshots')
        .insert({
            run_id: runId,
            label,
            graph_json: graph,
            ui_json: ui,
            kind: 'version'
        })
        .select('id')
        .single();

    if (error) {
        console.error("Save Snapshot Error:", error);
        return { success: false, error: error.message };
    }
    return { success: true, id: data.id };
}

export async function getSnapshots(runId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resonance_snapshots')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, snapshots: data };
}


