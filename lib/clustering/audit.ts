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
    
    // Hash Helpers - Full SHA256 for audit
    static hashString(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    static hashObject(obj: any): string {
        // Ensure deterministic stringify by sorting keys? Not strictly necessary if we just hash the content written to disk
        // But for object hashing, JSON.stringify is unstable. Better to rely on file hashes.
        return this.hashString(JSON.stringify(obj));
    }

    // Sanity Checks
    static runSanityChecks(result: ClusterResult, metrics: any, fileHashes: any): AuditResult {
        const checks: AuditConstraint[] = [];

        // 1. Language Normalization Check (CRITICAL now)
        const FORBIDDEN_TOKENS = ['intense', 'pulsating', 'glow', 'ink', 'motion', 'blur', 'digital light', 'fading', 'neon glow'];
        let forbiddenFound = 0;
        let forbiddenDetails = '';
        
        // Check cluster names and justifications
        metrics.forEach((m: any) => {
           const textCheck = (m.justification + ' ' + JSON.stringify(m.dominantSignals)).toLowerCase();
           const violations = FORBIDDEN_TOKENS.filter(t => textCheck.includes(t));
           if (violations.length > 0) {
               forbiddenFound++;
               forbiddenDetails += `[Cluster ${m.clusterId}: ${violations.join(', ')}] `;
           }
        });
        
        checks.push({
            checkName: 'Language Normalization Cleanliness',
            passed: forbiddenFound === 0,
            details: forbiddenFound > 0 ? `Found ${forbiddenFound} violations: ${forbiddenDetails}` : 'No forbidden tokens found.',
            severity: 'CRITICAL' 
        });

        // 2. NOISE Rule Check
        let invalidNoise = 0;
        const noiseClusters = metrics.filter((m: any) => m.classification === 'NOISE');
        noiseClusters.forEach((nc: any) => {
            if (nc.nodeCount > 1) {
                // NOISE with >1 node MUST NOT have high internal connection
                // If it has density > 0.3 it shouldn't be noise usually, unless disconnected from everything else?
                // But per prompt rules: Gate 3 Failure -> PROTO or WEAK, not NOISE usually unless truly 0 edges.
                // However, NOISE rule is: N=1 OR N>1 but zero significant internal edges.
                if (nc.density.avg > 0.1) invalidNoise++;
            }
        });

        checks.push({
            checkName: 'NOISE Classification Rules',
            passed: invalidNoise === 0,
            details: `${invalidNoise} clusters marked NOISE but have internal density > 0.1.`,
            severity: 'CRITICAL'
        });

        // 3. Constant/Dummy Check
        const scores = metrics.map((m: any) => m.strengthScore);
        const uniqueScores = new Set(scores).size;
        const lowVariance = scores.length > 2 && uniqueScores < 2;

        checks.push({
            checkName: 'Metrics Variance (No Dummies)',
            passed: !lowVariance,
            details: lowVariance ? 'All clusters have identical strengthScore.' : `Unique scores: ${uniqueScores}/${scores.length}`,
            severity: 'CRITICAL'
        });

        // 4. Chain of Evidence Integrity
        const hasInputs = !!fileHashes.inputs;
        const hasEdges = !!fileHashes.edges;
        const hasMetrics = !!fileHashes.metrics;
        
        checks.push({
            checkName: 'Chain of Evidence Integrity',
            passed: hasInputs && hasEdges && hasMetrics,
            details: `Hashes present: Inputs=${hasInputs}, Edges=${hasEdges}, Metrics=${hasMetrics}`,
            severity: 'CRITICAL'
        });

        // Determine Final Status
        const criticalFail = checks.some(c => c.severity === 'CRITICAL' && !c.passed);
        // We removed WARNING severity for Language, so mostly strictly PASS/FAIL now.
        
        const status = criticalFail ? 'FAILED_AUDIT' : 'PASS';

        return {
            status,
            checks,
            hashes: fileHashes
        };
    }
}
