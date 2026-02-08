# Reference Implementations

The following open-source implementation provides working, deployed services for all 5 ATF Elements plus the Maturity Model and Promotion Gates.

## Berlin AI Labs — ATF Reference Implementation

**Repository:** https://github.com/yogami/atf-reference-implementation

A complete enforcement layer for the Agentic Trust Framework, consisting of 12 independently deployed services mapped to all 5 ATF elements. All services are open source (MIT), tested, and deployed.

### Element Coverage

| ATF Element | Service | Repository |
|:---|:---|:---|
| **Element 1: Identity** | Agent Trust Verifier — DID:web + Verifiable Credentials | [agent-trust-verifier](https://github.com/yogami/agent-trust-verifier) |
| **Element 1: Identity** | Agent Trust Protocol — Reputation scoring + compliance tracking | [agent-trust-protocol](https://github.com/yogami/agent-trust-protocol) |
| **Element 2: Behavior** | Veracity Core — Ed25519 Proof of Execution, Solana anchoring | [pdp-protocol](https://github.com/yogami/pdp-protocol) |
| **Element 2: Behavior** | Agent Chain Anchor — Chain-agnostic blockchain proof anchoring | [agent-chain-anchor](https://github.com/yogami/agent-chain-anchor) |
| **Element 3: Data Governance** | ConvoGuard AI — Sub-20ms ONNX firewall, EU AI Act compliance | [convo-guard-ai](https://github.com/yogami/convo-guard-ai) |
| **Element 3: Data Governance** | Agent Fairness Auditor — Bias detection, audit logging | [agent-fairness-auditor](https://github.com/yogami/agent-fairness-auditor) |
| **Element 4: Segmentation** | ATF Segmentation Engine — Policy-as-code, rate limiting, A2A controls | [agent-trust-protocol](https://github.com/yogami/agent-trust-protocol) |
| **Element 4: Segmentation** | Agent Deadline Enforcer — SLA contract enforcement | [agent-deadline-enforcer](https://github.com/yogami/agent-deadline-enforcer) |
| **Element 4: Segmentation** | Agent Semantic Aligner — Cross-domain vocabulary translation | [agent-semantic-aligner](https://github.com/yogami/agent-semantic-aligner) |
| **Element 5: Incident Response** | Agent Pentest — 41 adversarial attack vectors, Safety Score (A-F) | [agent-pentest](https://github.com/yogami/agent-pentest) |
| **Element 5: Incident Response** | ATF Incident Service — Circuit breaker, kill switch, auto-containment | [agent-trust-protocol](https://github.com/yogami/agent-trust-protocol) |

### Maturity Model

The implementation includes a working Maturity Model engine with all 5 Promotion Gates:

| Gate | What's Checked |
|:---|:---|
| Performance | Accuracy threshold, availability, time at level |
| Security Validation | Pentest grade (A/B required), adversarial testing |
| Business Value | ROI calculation, business owner approval |
| Incident Record | Zero critical incidents in window |
| Governance Sign-off | Security team + risk committee approval |

### Validation

The reference implementation includes a contract validation test suite (25 tests) verifying portfolio integrity against the ATF specification.

```bash
git clone https://github.com/yogami/atf-reference-implementation.git
cd atf-reference-implementation
npm install
npm test
```

### Maintainer

Berlin AI Labs — [berlinailabs.de](https://berlinailabs.de)
