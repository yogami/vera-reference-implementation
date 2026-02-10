<p align="center">
  <h1 align="center">VERA — Verifiable Enforcement for Runtime Agents — Reference Implementation</h1>
  <p align="center">
    <strong>Zero Trust enforcement architecture for AI agents — 12 deployed services, 5 enforcement pillars</strong>
  </p>
  <p align="center">
    <a href="#architecture">Architecture</a> •
    <a href="#pillars">Pillars</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="SPECIFICATION.md">Contract Spec</a>
  </p>
</p>

---

## What This Is

This repository is the **unified entry point** for Berlin AI Labs' **VERA** reference implementation — a zero trust enforcement architecture for AI agents built on cryptographic proof, not policy assertions.

VERA defines 5 enforcement pillars every agent must satisfy. This repo maps those pillars to **deployed, tested, open-source services**.

> **This is a facade repository.** It contains no duplicated code — each service lives in its own repo, deploys independently, and maintains its own test suite. This repo provides the map.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VERA Reference Implementation                      │
│                         Berlin AI Labs                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Pillar 1    │  │   Pillar 2    │  │   Pillar 3    │              │
│  │   IDENTITY    │  │  PROOF OF     │  │    DATA       │              │
│  │  "Who are you?"│ │  EXECUTION    ││ SOVEREIGNTY    │              │
│  │               │  │              ││                │              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │ Trust Verifier│  │ Veracity Core │  │  ConvoGuard AI │              │
│  │ Trust Protocol│  │ Chain Anchor  │  │Fairness Auditor│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Pillar 4    │  │   Pillar 5    │  │   CROSS-CUT   │              │
│  │ SEGMENTATION  │  │ CONTAINMENT   │  │ INFRASTRUCTURE │              │
│  │"Where can     │  │"What if you   │  │               │              │
│  │  you go?"     │  │  go rogue?"   │  │               │              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │  VERA Module  │  │ agent-pentest │  │  OpenClaw Node │              │
│  │  Deadline Enf │  │ VERA Incident │  │ Mission Control│              │
│  │ Semantic Align│  │              │  │               │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

<a id="pillars"></a>
## The Five Enforcement Pillars — Implementation Map

### 🔐 Pillar 1: Identity — "Who are you?"

> Every agent must have a verified, auditable identity before it can access any resource.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [agent-trust-verifier](https://github.com/berlinailabs/agent-trust-verifier) | DID:web resolution, Verifiable Credential issuance/verification (JWT-VC), trust score tracking | Next.js, Prisma, PostgreSQL | Vitest + Playwright |
| [agent-trust-protocol](https://github.com/berlinailabs/agent-trust-protocol) | Reputation scoring, compliance tracking, trust dashboard, **VERA trust tiers & promotion gates** | Next.js, Supabase | Vitest + Playwright |

**VERA Requirements Covered:** Unique Identifier ✅ · Credential Binding ✅ · Ownership Chain ✅ · Purpose Declaration ✅ · Capability Manifest 🟡

---

### 👁️ Pillar 2: Proof of Execution — "Can you prove what you did?"

> Agent actions must be cryptographically signed, hash-chained, and externally anchored.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [pdp-protocol](https://github.com/berlinailabs/pdp-protocol) (Veracity Core) | Cryptographic Proof of Execution — Ed25519 signed execution records, hash-chain linking, Solana anchoring, PDP Decision Tokens | Node.js, Express | Vitest + Playwright |
| [agent-chain-anchor](https://github.com/berlinailabs/agent-chain-anchor) | Chain-agnostic blockchain anchoring for PoE proofs, trust score snapshots, and decision audit logs | Next.js | Vitest + Playwright |

**VERA Requirements Covered:** Structured Logging ✅ · Action Attribution ✅ · Behavioral Baseline ✅ · Anomaly Detection ✅ · Explainability ✅

**Beyond Spec:** Cryptographic proof (Ed25519), multi-modal evidence, tamper-proof hash chains anchored to Solana, Tool Execution Receipts.

---

### 🛡️ Pillar 3: Data Sovereignty — "What are you consuming and producing?"

> All data entering the agent must be validated, and all outputs must be governed.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [convo-guard-ai](https://github.com/berlinailabs/convo-guard-ai) | Sub-20ms ONNX inference firewall — prompt injection defense, PII detection, API key interception, EU AI Act compliance trails (Articles 11, 12, 73) | Next.js, ONNX Runtime | 69/69 E2E |
| [agent-fairness-auditor](https://github.com/berlinailabs/agent-fairness-auditor) | Bias detection, immutable audit logging, compliance dashboard | Next.js, Prisma, PostgreSQL | Vitest + Playwright |

**VERA Requirements Covered:** Schema Validation ✅ · Injection Prevention ✅ · PII/PHI Protection ✅ · Output Validation ✅ · Data Lineage ✅

**Beyond Spec:** Edge-deployed (no data leaves the device), deterministic control layer, EU AI Act article-level compliance mapping.

---

### 📊 Pillar 4: Segmentation — "Where can you go?"

> Agent access must be strictly limited to the minimum required for the task at hand.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [agent-trust-protocol/lib/vera](https://github.com/berlinailabs/agent-trust-protocol) | Policy-as-code segmentation engine — resource ACLs with glob matching, rate limiting, transaction limits, A2A communication controls, blast radius containment | TypeScript | 33 unit tests |
| [agent-deadline-enforcer](https://github.com/berlinailabs/agent-deadline-enforcer) | SLA contract registration, automated breach detection and enforcement | Next.js, Prisma, PostgreSQL | Vitest + Playwright |
| [agent-semantic-aligner](https://github.com/berlinailabs/agent-semantic-aligner) | Vocabulary translation middleware — resolves ontology gaps between agents communicating across domains | Next.js, OpenAI, Prisma | Vitest + Playwright |

**VERA Requirements Covered:** Resource Allowlist ✅ · Action Boundaries ✅ · Rate Limiting ✅ · Transaction Limits ✅ · Blast Radius Containment ✅

---

### ⚔️ Pillar 5: Containment — "What if you go rogue?"

> When agent behavior deviates, the organization must detect, contain, and remediate.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [agent-pentest](https://github.com/berlinailabs/agent-pentest) | 41 automated adversarial attack vectors across 4 categories (injection, exfiltration, jailbreak, safety bypass), Safety Score grading (A-F), CI/CD integration | TypeScript CLI | Vitest |
| [agent-trust-protocol/lib/vera](https://github.com/berlinailabs/agent-trust-protocol) | Circuit breaker (closed→open→half-open recovery), kill switch (with auto-resume), auto-containment on critical incidents | TypeScript | 33 unit tests |

**VERA Requirements Covered:** Vulnerability Assessment ✅ · Penetration Testing ✅ · Adversarial Testing ✅ · Circuit Breakers ✅ · Kill Switches ✅

**Beyond Spec:** Quantified Safety Score, CI/CD `--fail-under` gates, PoE-signed scan receipts.

---

### 🏗️ Cross-Pillar Infrastructure

| Service | Description | Role |
|:--------|:-----------|:-----|
| [spy-agent-openclaw](https://github.com/berlinailabs/spy-agent-openclaw) | Sovereign execution node — PRISM Level 4 security, staking/slashing vault, zero-trust middleware | Runtime enforcement |
| [agent-ops-mission-control](https://github.com/berlinailabs/agent-ops-mission-control) | Enterprise agent discovery platform — vendor-neutral search, trust score visualization, fleet management | Operator dashboard |

---

## VERA Trust Tier Model

Agents earn autonomy through cryptographic proof, not calendar time:

| Tier | Autonomy | Implementation |
|:-----|:---------|:--------------|
| **T1 — Intern** | Observe + Report | Read-only access, continuous oversight, 3-failure circuit breaker |
| **T2 — Junior** | Recommend + Approve | Write access with human approval, 5-failure threshold |
| **T3 — Senior** | Act + Notify | Autonomous execution with post-action notification, pentest required |
| **T4 — Principal** | Autonomous | Full domain autonomy, adversarial testing + risk committee required |

### Promotion Gates (5/5 Implemented)

| Gate | What's Checked | Tooling |
|:-----|:--------------|:--------|
| **Performance** | Accuracy ≥ threshold, availability ≥ 99%+, minimum time at level | `agent-trust-protocol` |
| **Security** | Pentest grade A/B, adversarial testing passed | `agent-pentest` |
| **Business Value** | ROI calculated, business owner approval | `agent-trust-protocol` |
| **Incident Record** | Zero critical incidents | `agent-trust-protocol/vera` |
| **Governance** | Security team + risk committee sign-off | `agent-trust-protocol/vera` |

---

<a id="quick-start"></a>
## Quick Start

This is a facade repository — to run individual services, clone them directly:

```bash
# Identity
git clone https://github.com/berlinailabs/agent-trust-verifier.git
git clone https://github.com/berlinailabs/agent-trust-protocol.git

# Proof of Execution
git clone https://github.com/berlinailabs/pdp-protocol.git
git clone https://github.com/berlinailabs/agent-chain-anchor.git

# Data Sovereignty
git clone https://github.com/berlinailabs/convo-guard-ai.git
git clone https://github.com/berlinailabs/agent-fairness-auditor.git

# Segmentation
git clone https://github.com/berlinailabs/agent-deadline-enforcer.git
git clone https://github.com/berlinailabs/agent-semantic-aligner.git

# Containment
git clone https://github.com/berlinailabs/agent-pentest.git

# Infrastructure
git clone https://github.com/berlinailabs/spy-agent-openclaw.git
git clone https://github.com/berlinailabs/agent-ops-mission-control.git
```

Each service has its own `VERA_MAPPING.md` documenting exactly which VERA requirements it satisfies.

---

## Validation

Run the contract validation suite to verify portfolio integrity:

```bash
npm install
npm test
```

This checks:
- All linked repos exist on GitHub
- Each repo has a `VERA_MAPPING.md`
- All 5 VERA pillars have at least one implementation
- Trust tier model coverage is complete

---

## License

MIT — Build freely.

---

<p align="center">
  <strong>Berlin AI Labs</strong> · <a href="https://berlinailabs.de">berlinailabs.de</a> · <a href="https://github.com/berlinailabs">github.com/berlinailabs</a>
</p>
