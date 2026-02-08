<p align="center">
  <h1 align="center">Agentic Trust Framework — Reference Implementation</h1>
  <p align="center">
    <strong>The first working implementation of the <a href="https://github.com/massivescale-ai/agentic-trust-framework">CSA Agentic Trust Framework</a></strong>
  </p>
  <p align="center">
    <a href="https://cloudsecurityalliance.org/blog/2026/02/02/the-agentic-trust-framework-zero-trust-governance-for-ai-agents">ATF Spec</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#elements">Elements</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="SPECIFICATION.md">Contract Spec</a>
  </p>
</p>

---

## What This Is

This repository is the **unified entry point** for Berlin AI Labs' implementation of the [Agentic Trust Framework (ATF)](https://github.com/massivescale-ai/agentic-trust-framework) — the Cloud Security Alliance's Zero Trust governance specification for AI agents.

The ATF asks 5 questions every organization must answer for every AI agent. This repo maps those questions to **deployed, tested, open-source services**.

> **This is a facade repository.** It contains no duplicated code — each service lives in its own repo, deploys independently, and maintains its own test suite. This repo provides the map.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ATF Reference Implementation                      │
│                         Berlin AI Labs                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Element 1   │  │   Element 2   │  │   Element 3   │              │
│  │   IDENTITY    │  │   BEHAVIOR    │  │    DATA GOV   │              │
│  │  "Who are you?"│ │"What are you  ││"What are you   │              │
│  │               │  │   doing?"     ││ eating/serving?"│              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │ Trust Verifier│  │ Veracity Core │  │  ConvoGuard AI │              │
│  │ Trust Protocol│  │ Chain Anchor  │  │Fairness Auditor│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Element 4   │  │   Element 5   │  │   CROSS-CUT   │              │
│  │ SEGMENTATION  │  │  INCIDENT     │  │ INFRASTRUCTURE │              │
│  │"Where can     │  │  RESPONSE     │  │               │              │
│  │  you go?"     │  │"What if you   │  │               │              │
│  │               │  │  go rogue?"   │  │               │              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │  ATF Module   │  │ agent-pentest │  │  OpenClaw Node │              │
│  │  Deadline Enf │  │  ATF Incident │  │ Mission Control│              │
│  │ Semantic Align│  │              │  │  Demo Website  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

<a id="elements"></a>
## The Five Elements — Implementation Map

### 🔐 Element 1: Identity — "Who are you?"

> Every agent must have a verified, auditable identity before it can access any resource.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [agent-trust-verifier](https://github.com/yogami/agent-trust-verifier) | DID:web resolution, Verifiable Credential issuance/verification (JWT-VC), trust score tracking | Next.js, Prisma, PostgreSQL | Vitest + Playwright |
| [agent-trust-protocol](https://github.com/yogami/agent-trust-protocol) | Reputation scoring, compliance tracking, trust dashboard, **ATF maturity model & promotion gates** | Next.js, Supabase | Vitest + Playwright |

**ATF Requirements Covered:** Unique Identifier ✅ · Credential Binding ✅ · Ownership Chain ✅ · Purpose Declaration ✅ · Capability Manifest 🟡

---

### 👁️ Element 2: Behavior — "What are you doing?"

> Agent behavior must be continuously monitored, with anomalies detected and flagged for review.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [pdp-protocol](https://github.com/yogami/pdp-protocol) (Veracity Core) | Cryptographic Proof of Execution — Ed25519 signed execution records, hash-chain linking, Solana anchoring, Independent Judge Protocol | Node.js, Express | Vitest + Playwright |
| [agent-chain-anchor](https://github.com/yogami/agent-chain-anchor) | Chain-agnostic blockchain anchoring for ZK-SLA proofs, trust score snapshots, and decision audit logs | Next.js | Vitest + Playwright |

**ATF Requirements Covered:** Structured Logging ✅ · Action Attribution ✅ · Behavioral Baseline ✅ · Anomaly Detection ✅ · Explainability ✅

**Beyond ATF:** Cryptographic proof (Ed25519), multi-modal evidence (terminal + screenshots + video), tamper-proof hash chains anchored to Solana.

---

### 🛡️ Element 3: Data Governance — "What are you eating? What are you serving?"

> All data entering the agent must be validated, and all outputs must be governed.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [convo-guard-ai](https://github.com/yogami/convo-guard-ai) | Sub-20ms ONNX inference firewall — prompt injection defense, PII detection, API key interception, EU AI Act compliance trails (Articles 11, 12, 73) | Next.js, ONNX Runtime | 69/69 E2E |
| [agent-fairness-auditor](https://github.com/yogami/agent-fairness-auditor) | Bias detection, immutable audit logging, compliance dashboard | Next.js, Prisma, PostgreSQL | Vitest + Playwright |

**ATF Requirements Covered:** Schema Validation ✅ · Injection Prevention ✅ · PII/PHI Protection ✅ · Output Validation ✅ · Data Lineage ✅

**Beyond ATF:** Edge-deployed (no data leaves the device), deterministic control layer (not probabilistic), EU AI Act article-level compliance mapping.

---

### 📊 Element 4: Segmentation — "Where can you go?"

> Agent access must be strictly limited to the minimum required for the task at hand.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [agent-trust-protocol/lib/atf](https://github.com/yogami/agent-trust-protocol) | Policy-as-code segmentation engine — resource ACLs with glob matching, rate limiting, transaction limits, A2A communication controls, blast radius containment | TypeScript | 33 unit tests |
| [agent-deadline-enforcer](https://github.com/yogami/agent-deadline-enforcer) | SLA contract registration, automated breach detection and enforcement | Next.js, Prisma, PostgreSQL | Vitest + Playwright |
| [agent-semantic-aligner](https://github.com/yogami/agent-semantic-aligner) | Vocabulary translation middleware — resolves ontology gaps between agents communicating across domains | Next.js, OpenAI, Prisma | Vitest + Playwright |

**ATF Requirements Covered:** Resource Allowlist ✅ · Action Boundaries ✅ · Rate Limiting ✅ · Transaction Limits ✅ · Blast Radius Containment ✅

---

### ⚔️ Element 5: Incident Response — "What if you go rogue?"

> When agent behavior deviates, the organization must detect, contain, and remediate.

| Service | Description | Stack | Tests |
|:--------|:-----------|:------|:------|
| [agent-pentest](https://github.com/yogami/agent-pentest) | 41 automated adversarial attack vectors across 4 categories (injection, exfiltration, jailbreak, safety bypass), Safety Score grading (A-F), CI/CD integration | TypeScript CLI | Vitest |
| [agent-trust-protocol/lib/atf](https://github.com/yogami/agent-trust-protocol) | Circuit breaker (closed→open→half-open recovery), kill switch (with auto-resume), auto-containment on critical incidents | TypeScript | 33 unit tests |

**ATF Requirements Covered:** Vulnerability Assessment ✅ · Penetration Testing ✅ · Adversarial Testing ✅ · Circuit Breakers ✅ · Kill Switches ✅

**Beyond ATF:** Quantified Safety Score, CI/CD `--fail-under` gates, PoE-signed scan receipts.

---

### 🏗️ Cross-Element Infrastructure

| Service | Description | Role |
|:--------|:-----------|:-----|
| [spy-agent-openclaw](https://github.com/yogami/spy-agent-openclaw) | Sovereign execution node — PRISM Level 4 security, staking/slashing vault, zero-trust middleware, dynamic scarcity economics | Runtime enforcement |
| [agent-ops-mission-control](https://github.com/yogami/agent-ops-mission-control) | Enterprise agent discovery platform — vendor-neutral search, trust score visualization, fleet management | Operator dashboard |
| [TrustScoreAndConvoGuardDemoWebsite](https://github.com/yogami/TrustScoreAndConvoGuardDemoWebsite) | Interactive demo — Trust Score dashboard + ConvoGuard API console | Demonstration |

---

## ATF Maturity Model Implementation

This stack implements the ATF's agent autonomy progression model:

| Level | Autonomy | Implementation |
|:------|:---------|:--------------|
| **Intern** | Observe + Report | Read-only access, continuous oversight, 3-failure circuit breaker |
| **Junior** | Recommend + Approve | Write access with human approval, 5-failure threshold |
| **Senior** | Act + Notify | Autonomous execution with post-action notification, pentest required |
| **Principal** | Autonomous | Full domain autonomy, adversarial testing + risk committee required |

### Promotion Gates (5/5 Implemented)

| Gate | What's Checked | Tooling |
|:-----|:--------------|:--------|
| **Performance** | Accuracy ≥ threshold, availability ≥ 99%+, minimum time at level | `agent-trust-protocol` |
| **Security** | Pentest grade A/B, adversarial testing passed | `agent-pentest` |
| **Business Value** | ROI calculated, business owner approval | `agent-trust-protocol` |
| **Incident Record** | Zero critical incidents | `agent-trust-protocol/atf` |
| **Governance** | Security team + risk committee sign-off | `agent-trust-protocol/atf` |

---

<a id="quick-start"></a>
## Quick Start

This is a facade repository — to run individual services, clone them directly:

```bash
# Identity
git clone https://github.com/yogami/agent-trust-verifier.git
git clone https://github.com/yogami/agent-trust-protocol.git

# Behavior  
git clone https://github.com/yogami/pdp-protocol.git
git clone https://github.com/yogami/agent-chain-anchor.git

# Data Governance
git clone https://github.com/yogami/convo-guard-ai.git
git clone https://github.com/yogami/agent-fairness-auditor.git

# Segmentation
git clone https://github.com/yogami/agent-deadline-enforcer.git
git clone https://github.com/yogami/agent-semantic-aligner.git

# Incident Response
git clone https://github.com/yogami/agent-pentest.git

# Infrastructure
git clone https://github.com/yogami/spy-agent-openclaw.git
git clone https://github.com/yogami/agent-ops-mission-control.git
```

Each service has its own `ATF_MAPPING.md` documenting exactly which ATF requirements it satisfies.

---

## Validation

Run the contract validation suite to verify portfolio integrity:

```bash
npm install
npm test
```

This checks:
- All linked repos exist on GitHub
- Each repo has an `ATF_MAPPING.md`
- All 5 ATF elements have at least one implementation
- Maturity model coverage is complete

---

## Comparison to ATF Specification

| Dimension | ATF Spec | This Implementation |
|:----------|:---------|:-------------------|
| **Format** | 6 markdown files | 12 deployed services |
| **Code** | Zero | ~15,000+ lines TypeScript |
| **Tests** | None | 100+ (Vitest + Playwright) |
| **Deployment** | "Coming Soon" | Live on Railway |
| **Compliance** | Mentions NIST, OWASP | EU AI Act article-level mapping |
| **Proofs** | Not addressed | Ed25519 + Solana cryptographic anchoring |
| **Maturity Model** | Described | Implemented with 5 promotion gates |

---

## License

MIT — Build freely.

---

<p align="center">
  <strong>Berlin AI Labs</strong> · <a href="https://berlinailabs.de">berlinailabs.de</a> · <a href="https://github.com/yogami">github.com/yogami</a>
</p>
