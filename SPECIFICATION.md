# VERA Contract Specification

> This document defines the implementation contracts that each service in the Berlin AI Labs VERA Reference Implementation must satisfy. These contracts are validated by the automated test suite.

## Service Registry

Every service in the VERA stack must declare:

1. **GitHub Repository** — Public, accessible at `github.com/berlinailabs/{name}`
2. **VERA Pillar Mapping** — Which of the 5 VERA enforcement pillars it implements
3. **VERA_MAPPING.md** — A file in the repo root documenting compliance
4. **Test Suite** — Minimum one test framework configured
5. **Deployment Target** — Where the service runs in production

## Pillar Coverage Requirements

VERA defines 5 mandatory enforcement pillars. This implementation must provide **at least one service per pillar** with passing tests.

| Pillar | Minimum Services | Required Capabilities |
|:-------|:----------------|:---------------------|
| Identity | 1 | DID resolution OR credential issuance |
| Proof of Execution | 1 | Structured logging OR execution proofs |
| Data Sovereignty | 1 | Input validation OR output governance |
| Segmentation | 1 | Resource ACLs OR rate limiting |
| Containment | 1 | Circuit breaker OR adversarial testing |

## Trust Tier Requirements

The implementation must support VERA's 4-tier trust model:

| Transition | Required Gate Count | Min Gates Automated |
|:-----------|:-------------------|:-------------------|
| T1 → T2 (Intern → Junior) | 2 (Performance, Incident) | 2 |
| T2 → T3 (Junior → Senior) | 4 (+ Security, Business) | 3 |
| T3 → T4 (Senior → Principal) | 5 (+ Governance) | 4 |

## Service Contracts

### Identity Services

#### agent-trust-verifier
- MUST resolve DID documents
- MUST issue JWT-format Verifiable Credentials
- MUST verify VC signatures
- MUST maintain trust score per agent

#### agent-trust-protocol
- MUST calculate composite trust scores
- MUST track compliance tags (GDPR, MDR)
- MUST expose promotion gate evaluation API

### Proof of Execution Services

#### pdp-protocol (Veracity Core)
- MUST sign execution records with Ed25519
- MUST enforce sequence number ordering
- MUST support optional Solana anchoring
- MUST serve A2A AgentCard at `/.well-known/agent.json`

#### agent-chain-anchor
- MUST anchor proof hashes on-chain
- MUST verify existing anchors by transaction ID
- MUST support multiple chain backends

### Data Sovereignty Services

#### convo-guard-ai
- MUST detect prompt injection attempts
- MUST detect and mask PII
- MUST generate signed audit logs
- MUST complete inference in < 50ms (target: < 20ms)

#### agent-fairness-auditor
- MUST detect bias in agent interactions
- MUST maintain immutable audit logs
- MUST provide compliance dashboard

### Segmentation Services

#### agent-trust-protocol VERA Module
- MUST evaluate resource access requests against policies
- MUST enforce rate limits per agent
- MUST gate capabilities by trust tier
- MUST control agent-to-agent communication permissions

#### agent-deadline-enforcer
- MUST register SLA contracts with deadlines
- MUST detect and flag breached tasks

### Containment Services

#### agent-pentest
- MUST execute ≥ 40 adversarial test vectors
- MUST produce Safety Score grade (A-F)
- MUST support CI/CD integration with `--fail-under`

#### agent-trust-protocol VERA Incident Module
- MUST implement circuit breaker state machine (closed → open → half-open)
- MUST implement kill switch with optional auto-resume
- MUST auto-contain on critical incidents
