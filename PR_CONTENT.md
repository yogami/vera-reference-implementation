# Reference Implementations

The following open-source implementation provides working, deployed services for all 5 VERA Pillars plus the Trust Tier Model and Promotion Gates.

## Berlin AI Labs — VERA Reference Implementation

**Repository:** https://github.com/berlinailabs/vera-reference-implementation

A complete enforcement layer for the Verifiable Enforcement for Runtime Agents, consisting of 12 independently deployed services mapped to all 5 VERA elements. All services are open source (MIT), tested, and deployed.

### Pillar Coverage

| VERA Pillar | Service | Repository |
|:---|:---|:---|
| **Pillar 1: Identity** | Agent Trust Verifier — DID:web + Verifiable Credentials | [agent-trust-verifier](https://github.com/berlinailabs/agent-trust-verifier) |
| **Pillar 1: Identity** | Agent Trust Protocol — Reputation scoring + compliance tracking | [agent-trust-protocol](https://github.com/berlinailabs/agent-trust-protocol) |
| **Pillar 2: Proof of Execution** | Veracity Core — Ed25519 Proof of Execution, Solana anchoring | [pdp-protocol](https://github.com/berlinailabs/pdp-protocol) |
| **Pillar 2: Proof of Execution** | Agent Chain Anchor — Chain-agnostic blockchain proof anchoring | [agent-chain-anchor](https://github.com/berlinailabs/agent-chain-anchor) |
| **Pillar 3: Data Sovereignty** | ConvoGuard AI — Sub-20ms ONNX firewall, EU AI Act compliance | [convo-guard-ai](https://github.com/berlinailabs/convo-guard-ai) |
| **Pillar 3: Data Sovereignty** | Agent Fairness Auditor — Bias detection, audit logging | [agent-fairness-auditor](https://github.com/berlinailabs/agent-fairness-auditor) |
| **Pillar 4: Segmentation** | VERA Segmentation Engine — Policy-as-code, rate limiting, A2A controls | [agent-trust-protocol](https://github.com/berlinailabs/agent-trust-protocol) |
| **Pillar 4: Segmentation** | Agent Deadline Enforcer — SLA contract enforcement | [agent-deadline-enforcer](https://github.com/berlinailabs/agent-deadline-enforcer) |
| **Pillar 4: Segmentation** | Agent Semantic Aligner — Cross-domain vocabulary translation | [agent-semantic-aligner](https://github.com/berlinailabs/agent-semantic-aligner) |
| **Pillar 5: Containment** | Agent Pentest — 41 adversarial attack vectors, Safety Score (A-F) | [agent-pentest](https://github.com/berlinailabs/agent-pentest) |
| **Pillar 5: Containment** | VERA Incident Service — Circuit breaker, kill switch, auto-containment | [agent-trust-protocol](https://github.com/berlinailabs/agent-trust-protocol) |

### Trust Tier Model

The implementation includes a working Trust Tier Model engine with all 5 Promotion Gates:

| Gate | What's Checked |
|:---|:---|
| Performance | Accuracy threshold, availability, time at level |
| Security Validation | Pentest grade (A/B required), adversarial testing |
| Business Value | ROI calculation, business owner approval |
| Incident Record | Zero critical incidents in window |
| Governance Sign-off | Security team + risk committee approval |

### Validation

The reference implementation includes a contract validation test suite (25 tests) verifying portfolio integrity against the VERA specification.

```bash
git clone https://github.com/berlinailabs/vera-reference-implementation.git
cd vera-reference-implementation
npm install
npm test
```

### Maintainer

Berlin AI Labs — [berlinailabs.de](https://berlinailabs.de)
