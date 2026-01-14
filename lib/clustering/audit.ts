import * as crypto from 'crypto';
import { ClusterResult } from './cluster-engine';

export interface AuditConstraint {
    checkName: string;
    passed: boolean;
    details: string;
    severity: 'CRITICAL' | 'WARNING';
}

export interface AuditResult {
    status: 'PASS' | 'FAILED_AUDIT' | 'WARNING';
    checks: AuditConstraint[];
    hashes: {
        inputs: string;
        edges: string;
        metrics: string;
    };
}

export class ClusterAuditor {
    
    // Hash Helpers
    static hashString(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }

    static hashObject(obj: any): string {
        return this.hashString(JSON.stringify(obj));
    }

    // Sanity Checks
    static runSanityChecks(result: ClusterResult, metrics: any): AuditResult {
        const checks: AuditConstraint[] = [];

        // 1. Language Normalization Check
        const FORBIDDEN_TOKENS = ['intense', 'pulsating', 'glow', 'ink', 'motion', 'blur']; // Se vazou EN
        let forbiddenFound = 0;
        
        // Check cluster names/tags
        result.clusters.forEach(c => {
           // We check the suggested name or derived tags if available in metrics
           // For now checking name as proxy
           if (FORBIDDEN_TOKENS.some(t => c.name_suggested.toLowerCase().includes(t))) {
               forbiddenFound++;
           }
        });
        
        checks.push({
            checkName: 'Language Normalization',
            passed: forbiddenFound === 0,
            details: forbiddenFound > 0 ? `Found ${forbiddenFound} clusters with forbidden English tokens.` : 'No forbidden tokens found.',
            severity: 'WARNING' // Warning because maybe user WANTS english, but system prefers PT
        });

        // 2. NOISE Rule Check
        let invalidNoise = 0;
        // Access metrics for classification confirmation
        // Assuming metrics passed has classification info per cluster
        const noiseClusters = metrics.filter((m: any) => m.classification === 'NOISE');
        noiseClusters.forEach((nc: any) => {
            if (nc.nodeCount > 1) {
                // Noise should generally be single items or completely disconnected
                // If it has >1 elements, it better have VERY low strength
                if (nc.strengthScore > 0.2) invalidNoise++;
            }
        });

        checks.push({
            checkName: 'NOISE Classification Rules',
            passed: invalidNoise === 0,
            details: `${invalidNoise} clusters marked NOISE but have significant size/strength.`,
            severity: 'CRITICAL'
        });

        // 3. Constant/Dummy Check
        const scores = metrics.map((m: any) => m.strengthScore);
        const uniqueScores = new Set(scores).size;
        const lowVariance = scores.length > 2 && uniqueScores < 2;

        checks.push({
            checkName: 'Metrics Variance (No Dummies)',
            passed: !lowVariance,
            details: lowVariance ? 'All clusters have identical strengthScore. Likely dummy data.' : `Unique scores: ${uniqueScores}/${scores.length}`,
            severity: 'CRITICAL'
        });

        // 4. Graph Integrity
        const edgeCount = result.edges.length;
        checks.push({
            checkName: 'Graph Connectivity',
            passed: edgeCount > 0 || result.nodes.length < 2,
            details: `Graph has ${edgeCount} edges for ${result.nodes.length} nodes.`,
            severity: 'WARNING'
        });

        // Determine Final Status
        const criticalFail = checks.some(c => c.severity === 'CRITICAL' && !c.passed);
        const warningFail = checks.some(c => c.severity === 'WARNING' && !c.passed);
        
        const status = criticalFail ? 'FAILED_AUDIT' : (warningFail ? 'WARNING' : 'PASS');

        return {
            status,
            checks,
            hashes: {
                inputs: 'calculated-in-runtime', // Filled by caller
                edges: 'calculated-in-runtime',
                metrics: 'calculated-in-runtime'
            }
        };
    }
}
