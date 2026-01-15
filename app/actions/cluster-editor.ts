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
        let role: SignalRole = 'fragile';
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
