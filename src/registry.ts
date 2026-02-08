/**
 * ATF Reference Implementation — Service Registry
 *
 * This is the single source of truth for all services in the Berlin AI Labs
 * ATF stack. Each entry maps a service to its ATF element, GitHub repo,
 * and contract requirements.
 */

export type ATFElement = 'identity' | 'behavior' | 'data_governance' | 'segmentation' | 'incident_response' | 'infrastructure';

export interface ServiceEntry {
    /** Human-readable name */
    name: string;
    /** GitHub repo name (under yogami/) */
    repo: string;
    /** Full GitHub URL */
    url: string;
    /** Primary ATF element this service implements */
    element: ATFElement;
    /** Secondary elements covered */
    secondaryElements?: ATFElement[];
    /** Brief description */
    description: string;
    /** Production deployment URL (if deployed) */
    productionUrl?: string;
    /** Whether ATF_MAPPING.md exists in this repo */
    hasATFMapping: boolean;
    /** Key capabilities */
    capabilities: string[];
}

export const SERVICE_REGISTRY: ServiceEntry[] = [
    // ─── Element 1: Identity ───
    {
        name: 'Agent Trust Verifier',
        repo: 'agent-trust-verifier',
        url: 'https://github.com/yogami/agent-trust-verifier',
        element: 'identity',
        description: 'DID:web resolution, Verifiable Credential issuance/verification (JWT-VC), trust score tracking',
        hasATFMapping: true,
        capabilities: ['did-resolution', 'vc-issuance', 'vc-verification', 'trust-scoring'],
    },
    {
        name: 'Agent Trust Protocol',
        repo: 'agent-trust-protocol',
        url: 'https://github.com/yogami/agent-trust-protocol',
        element: 'identity',
        secondaryElements: ['segmentation', 'incident_response'],
        description: 'Reputation scoring, compliance tracking, ATF maturity model & promotion gates, segmentation engine, circuit breaker',
        productionUrl: 'https://agent-trust-protocol-production.up.railway.app',
        hasATFMapping: true,
        capabilities: ['trust-scoring', 'compliance-tracking', 'maturity-model', 'promotion-gates', 'segmentation', 'circuit-breaker', 'kill-switch'],
    },

    // ─── Element 2: Behavior ───
    {
        name: 'Veracity Core (PDP Protocol)',
        repo: 'pdp-protocol',
        url: 'https://github.com/yogami/pdp-protocol',
        element: 'behavior',
        description: 'Cryptographic Proof of Execution — Ed25519 signed execution records, hash-chain linking, Solana anchoring',
        productionUrl: 'https://pdp-protocol-production.up.railway.app',
        hasATFMapping: true,
        capabilities: ['ed25519-signing', 'hash-chain', 'solana-anchoring', 'a2a-agentcard', 'independent-judge'],
    },
    {
        name: 'Agent Chain Anchor',
        repo: 'agent-chain-anchor',
        url: 'https://github.com/yogami/agent-chain-anchor',
        element: 'behavior',
        description: 'Chain-agnostic blockchain anchoring for ZK-SLA proofs, trust score snapshots, and decision audit logs',
        hasATFMapping: true,
        capabilities: ['proof-anchoring', 'zk-sla', 'trust-snapshots', 'audit-logs'],
    },

    // ─── Element 3: Data Governance ───
    {
        name: 'ConvoGuard AI',
        repo: 'convo-guard-ai',
        url: 'https://github.com/yogami/convo-guard-ai',
        element: 'data_governance',
        description: 'Sub-20ms ONNX inference firewall — prompt injection defense, PII detection, EU AI Act compliance trails',
        productionUrl: 'https://convo-guard-ai-production.up.railway.app',
        hasATFMapping: true,
        capabilities: ['injection-defense', 'pii-detection', 'api-key-interception', 'eu-ai-act-mapping', 'signed-audit-logs'],
    },
    {
        name: 'Agent Fairness Auditor',
        repo: 'agent-fairness-auditor',
        url: 'https://github.com/yogami/agent-fairness-auditor',
        element: 'data_governance',
        description: 'Bias detection, immutable audit logging, compliance dashboard',
        hasATFMapping: true,
        capabilities: ['bias-detection', 'audit-logging', 'compliance-dashboard'],
    },

    // ─── Element 4: Segmentation ───
    {
        name: 'Agent Deadline Enforcer',
        repo: 'agent-deadline-enforcer',
        url: 'https://github.com/yogami/agent-deadline-enforcer',
        element: 'segmentation',
        description: 'SLA contract registration, automated breach detection and enforcement',
        hasATFMapping: true,
        capabilities: ['sla-contracts', 'deadline-enforcement', 'breach-detection'],
    },
    {
        name: 'Agent Semantic Aligner',
        repo: 'agent-semantic-aligner',
        url: 'https://github.com/yogami/agent-semantic-aligner',
        element: 'segmentation',
        description: 'Vocabulary translation middleware — resolves ontology gaps between agents',
        hasATFMapping: true,
        capabilities: ['semantic-translation', 'vocabulary-mapping', 'ontology-bridge'],
    },

    // ─── Element 5: Incident Response ───
    {
        name: 'Agent Pentest',
        repo: 'agent-pentest',
        url: 'https://github.com/yogami/agent-pentest',
        element: 'incident_response',
        description: '41 automated adversarial attack vectors, Safety Score grading (A-F), CI/CD integration',
        hasATFMapping: true,
        capabilities: ['prompt-injection-testing', 'data-exfiltration-testing', 'jailbreak-testing', 'safety-bypass-testing', 'safety-score'],
    },

    // ─── Infrastructure ───
    {
        name: 'OpenClaw Node (The Operator)',
        repo: 'spy-agent-openclaw',
        url: 'https://github.com/yogami/spy-agent-openclaw',
        element: 'infrastructure',
        description: 'Sovereign execution node — PRISM Level 4 security, staking/slashing vault, zero-trust middleware',
        hasATFMapping: false,
        capabilities: ['zero-trust-middleware', 'staking-slashing', 'dynamic-pricing', 'hardware-attestation'],
    },
    {
        name: 'AgentOps Mission Control',
        repo: 'agent-ops-mission-control',
        url: 'https://github.com/yogami/agent-ops-mission-control',
        element: 'infrastructure',
        description: 'Enterprise agent discovery platform — vendor-neutral search, trust score visualization',
        hasATFMapping: false,
        capabilities: ['agent-discovery', 'fleet-management', 'trust-visualization'],
    },
    {
        name: 'Trust Score & ConvoGuard Demo',
        repo: 'TrustScoreAndConvoGuardDemoWebsite',
        url: 'https://github.com/yogami/TrustScoreAndConvoGuardDemoWebsite',
        element: 'infrastructure',
        description: 'Interactive demo website — Trust Score dashboard + ConvoGuard API console',
        hasATFMapping: false,
        capabilities: ['demo-dashboard', 'api-console'],
    },
];

// ─── Utility Functions ───

export function getServicesByElement(element: ATFElement): ServiceEntry[] {
    return SERVICE_REGISTRY.filter(
        s => s.element === element || s.secondaryElements?.includes(element)
    );
}

export function getATFElements(): ATFElement[] {
    return ['identity', 'behavior', 'data_governance', 'segmentation', 'incident_response'];
}

export function getElementCoverage(): Record<ATFElement, number> {
    const coverage: Record<string, number> = {};
    for (const element of getATFElements()) {
        coverage[element] = getServicesByElement(element).length;
    }
    return coverage as Record<ATFElement, number>;
}

export function getServicesWithATFMapping(): ServiceEntry[] {
    return SERVICE_REGISTRY.filter(s => s.hasATFMapping);
}

export function getServicesWithoutATFMapping(): ServiceEntry[] {
    return SERVICE_REGISTRY.filter(s => !s.hasATFMapping && s.element !== 'infrastructure');
}
