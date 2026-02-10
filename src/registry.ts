/**
 * VERA Reference Implementation — Service Registry
 *
 * This is the single source of truth for all services in the Berlin AI Labs
 * VERA stack. Each entry maps a service to its VERA element, GitHub repo,
 * and contract requirements.
 */

export type VERAPillar = 'identity' | 'proof_of_execution' | 'data_sovereignty' | 'segmentation' | 'containment' | 'infrastructure';

export interface ServiceEntry {
    /** Human-readable name */
    name: string;
    /** GitHub repo name (under berlinailabs/) */
    repo: string;
    /** Full GitHub URL */
    url: string;
    /** Primary VERA pillar this service implements */
    pillar: VERAPillar;
    /** Secondary pillars covered */
    secondaryPillars?: VERAPillar[];
    /** Brief description */
    description: string;
    /** Production deployment URL (if deployed) */
    productionUrl?: string;
    /** Whether VERA_MAPPING.md exists in this repo */
    hasVERAMapping: boolean;
    /** Key capabilities */
    capabilities: string[];
}

export const SERVICE_REGISTRY: ServiceEntry[] = [
    // ─── Pillar 1: Identity ───
    {
        name: 'Agent Trust Verifier',
        repo: 'agent-trust-verifier',
        url: 'https://github.com/berlinailabs/agent-trust-verifier',
        pillar: 'identity',
        description: 'DID:web resolution, Verifiable Credential issuance/verification (JWT-VC), trust score tracking',
        hasVERAMapping: true,
        capabilities: ['did-resolution', 'vc-issuance', 'vc-verification', 'trust-scoring'],
    },
    {
        name: 'Agent Trust Protocol',
        repo: 'agent-trust-protocol',
        url: 'https://github.com/berlinailabs/agent-trust-protocol',
        pillar: 'identity',
        secondaryPillars: ['segmentation', 'containment'],
        description: 'Reputation scoring, compliance tracking, VERA maturity model & promotion gates, segmentation engine, circuit breaker',
        productionUrl: 'https://agent-trust-protocol-production.up.railway.app',
        hasVERAMapping: true,
        capabilities: ['trust-scoring', 'compliance-tracking', 'maturity-model', 'promotion-gates', 'segmentation', 'circuit-breaker', 'kill-switch'],
    },

    // ─── Pillar 2: Proof of Execution ───
    {
        name: 'Veracity Core (PDP Protocol)',
        repo: 'pdp-protocol',
        url: 'https://github.com/berlinailabs/pdp-protocol',
        pillar: 'proof_of_execution',
        description: 'Cryptographic Proof of Execution — Ed25519 signed execution records, hash-chain linking, Solana anchoring',
        productionUrl: 'https://pdp-protocol-production.up.railway.app',
        hasVERAMapping: true,
        capabilities: ['ed25519-signing', 'hash-chain', 'solana-anchoring', 'a2a-agentcard', 'independent-judge'],
    },
    {
        name: 'Agent Chain Anchor',
        repo: 'agent-chain-anchor',
        url: 'https://github.com/berlinailabs/agent-chain-anchor',
        pillar: 'proof_of_execution',
        description: 'Chain-agnostic blockchain anchoring for ZK-SLA proofs, trust score snapshots, and decision audit logs',
        hasVERAMapping: true,
        capabilities: ['proof-anchoring', 'zk-sla', 'trust-snapshots', 'audit-logs'],
    },

    // ─── Pillar 3: Data Sovereignty ───
    {
        name: 'ConvoGuard AI',
        repo: 'convo-guard-ai',
        url: 'https://github.com/berlinailabs/convo-guard-ai',
        pillar: 'data_sovereignty',
        description: 'Sub-20ms ONNX inference firewall — prompt injection defense, PII detection, EU AI Act compliance trails',
        productionUrl: 'https://convo-guard-ai-production.up.railway.app',
        hasVERAMapping: true,
        capabilities: ['injection-defense', 'pii-detection', 'api-key-interception', 'eu-ai-act-mapping', 'signed-audit-logs'],
    },
    {
        name: 'Agent Fairness Auditor',
        repo: 'agent-fairness-auditor',
        url: 'https://github.com/berlinailabs/agent-fairness-auditor',
        pillar: 'data_sovereignty',
        description: 'Bias detection, immutable audit logging, compliance dashboard',
        hasVERAMapping: true,
        capabilities: ['bias-detection', 'audit-logging', 'compliance-dashboard'],
    },

    // ─── Pillar 4: Segmentation ───
    {
        name: 'Agent Deadline Enforcer',
        repo: 'agent-deadline-enforcer',
        url: 'https://github.com/berlinailabs/agent-deadline-enforcer',
        pillar: 'segmentation',
        description: 'SLA contract registration, automated breach detection and enforcement',
        hasVERAMapping: true,
        capabilities: ['sla-contracts', 'deadline-enforcement', 'breach-detection'],
    },
    {
        name: 'Agent Semantic Aligner',
        repo: 'agent-semantic-aligner',
        url: 'https://github.com/berlinailabs/agent-semantic-aligner',
        pillar: 'segmentation',
        description: 'Vocabulary translation middleware — resolves ontology gaps between agents',
        hasVERAMapping: true,
        capabilities: ['semantic-translation', 'vocabulary-mapping', 'ontology-bridge'],
    },

    // ─── Pillar 5: Containment ───
    {
        name: 'Agent Pentest',
        repo: 'agent-pentest',
        url: 'https://github.com/berlinailabs/agent-pentest',
        pillar: 'containment',
        description: '41 automated adversarial attack vectors, Safety Score grading (A-F), CI/CD integration',
        hasVERAMapping: true,
        capabilities: ['prompt-injection-testing', 'data-exfiltration-testing', 'jailbreak-testing', 'safety-bypass-testing', 'safety-score'],
    },

    // ─── Infrastructure ───
    {
        name: 'OpenClaw Node (The Operator)',
        repo: 'spy-agent-openclaw',
        url: 'https://github.com/berlinailabs/spy-agent-openclaw',
        pillar: 'infrastructure',
        description: 'Sovereign execution node — PRISM Level 4 security, staking/slashing vault, zero-trust middleware',
        hasVERAMapping: false,
        capabilities: ['zero-trust-middleware', 'staking-slashing', 'dynamic-pricing', 'hardware-attestation'],
    },
    {
        name: 'AgentOps Mission Control',
        repo: 'agent-ops-mission-control',
        url: 'https://github.com/berlinailabs/agent-ops-mission-control',
        pillar: 'infrastructure',
        description: 'Enterprise agent discovery platform — vendor-neutral search, trust score visualization',
        hasVERAMapping: false,
        capabilities: ['agent-discovery', 'fleet-management', 'trust-visualization'],
    },
    {
        name: 'Trust Score & ConvoGuard Demo',
        repo: 'TrustScoreAndConvoGuardDemoWebsite',
        url: 'https://github.com/berlinailabs/TrustScoreAndConvoGuardDemoWebsite',
        pillar: 'infrastructure',
        description: 'Interactive demo website — Trust Score dashboard + ConvoGuard API console',
        hasVERAMapping: false,
        capabilities: ['demo-dashboard', 'api-console'],
    },
];

// ─── Utility Functions ───

export function getServicesByPillar(pillar: VERAPillar): ServiceEntry[] {
    return SERVICE_REGISTRY.filter(
        s => s.pillar === pillar || s.secondaryPillars?.includes(pillar)
    );
}

export function getVERAPillars(): VERAPillar[] {
    return ['identity', 'proof_of_execution', 'data_sovereignty', 'segmentation', 'containment'];
}

export function getPillarCoverage(): Record<VERAPillar, number> {
    const coverage: Record<string, number> = {};
    for (const pillar of getVERAPillars()) {
        coverage[pillar] = getServicesByPillar(pillar).length;
    }
    return coverage as Record<VERAPillar, number>;
}

export function getServicesWithVERAMapping(): ServiceEntry[] {
    return SERVICE_REGISTRY.filter(s => s.hasVERAMapping);
}

export function getServicesWithoutVERAMapping(): ServiceEntry[] {
    return SERVICE_REGISTRY.filter(s => !s.hasVERAMapping && s.pillar !== 'infrastructure');
}
