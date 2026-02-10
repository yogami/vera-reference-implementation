# Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Response time:** 92.5s
**Score:** 8/10
**Greenlight:** ✅ YES

---

Based on my analysis of the VERA paper itself (which is complete and self-contained), here is my expert technical review:

---

## VERA TECHNICAL REVIEW: IMPLEMENTABILITY ASSESSMENT

### SCORING SUMMARY

| Dimension | Score | Rationale |
|:---|:---:|:---|
| **TECHNICAL DEPTH** | 8/10 | Schemas are detailed; interfaces well-specified. Missing some implementation details in edge cases. |
| **TOOLING ALIGNMENT** | 7/10 | References 2026-appropriate tools (OPA, SPIFFE, KMS). Some components (ML-DSA HSM support) still in transition. |
| **CODE AVAILABILITY** | 6/10 | Claims 12 open-source services but no accessible repository link validated. Empirical results present but code paths unclear. |
| **COMPETING FRAMEWORKS** | 8/10 | Honest comparison to NIST 800-207, OWASP, MAESTRO, AWS. Clear differentiation on PDP/PEP placement and evidence-based trust. |
| **SCALABILITY** | 6/10 | Single-agent and <50-agent deployments validated. Projections to 10K agents are analytical, not empirical. KMS bottleneck at scale acknowledged but unsolved. |
| **INTEROPERABILITY** | 8/10 | Strong: DID:web + SPIFFE integration, A2A protocol alignment, pluggable anchors. Nonce lifecycle could be more standardized. |
| **CODE vs WORDS** | 65% | Enforcement plane (PEP/PDP/Proof Engine) is ~60% directly implementable from schemas. Tool Execution Receipts, anomaly detection (SWDB), and multi-stage containment require interpretation. |
| | | |
| **OVERALL SCORE** | **7/10** | **Publishable reference architecture with significant implementation gaps.** |

---

## DETAILED DIMENSION ANALYSIS

### 1. TECHNICAL DEPTH: 8/10

**Strengths:**
- **Exceptionally detailed threat model** (§2.2): Five adversary classes with explicit capability matrices. Honest about residual risks (e.g., "Compromiser with cloud admin access can modify IAM policies").
- **Formal security properties** (§3.2-3.3): Four definitions (Non-Repudiation, Chain Tamper-Evidence, Policy Completeness, Containment Bound) with game-based proof sketches. Cryptographic assumptions A1-A4 explicitly stated.
- **Typed schemas** (TypeScript interfaces): `ProofOfExecution`, `ToolExecutionReceipt`, `MemoryGovernancePolicy`, `PolicyEvaluationRequest`. Canonicalization (JCS/RFC 8785) specified for deterministic signing.
- **PDP/PEP placement**: Explicit. Pattern A (central OPA cluster) vs Pattern B (hardened sidecar). Fail-open/fail-closed semantics defined per tier.
- **Nonce lifecycle** (§4.2.1a): Single-use enforcement, TTL, replay protection, idempotency semantics — unusually thorough for an academic paper.

**Gaps:**
- **PEP image admission control** is specified as "MUST" (cosign + Kyverno) but no schema for Kyverno policy or attestation verification workflow.
- **Tool Execution Receipt verification procedure** (§4.2.1a, end-to-end verification) is 6 steps but lacks pseudocode or formal algorithm. Step 4 ("verify receipt signature against tool's registered identity") doesn't specify how tool identity is discovered at verification time — is it from a registry, DID document, or SPIFFE trust domain?
- **Anomaly detection algorithm (SWDB)** (§4.2.3): GMM with K=5 components, BIC selection, α=0.995 drift rate. But no guidance on feature extraction for "action type distribution" — what metrics exactly? Token counts? API latency? Dimensionality?
- **Delegation chain abuse** (Adversary Class 3): Paper acknowledges "cross-tool PEP coordination" is a gap (§7.2, bypassed vector 4) but doesn't specify how to close it.
- **PDP Decision Token** (§4.0): Requires PDP to sign decisions separately from PoE. But what if PDP is stateless? How does the PEP correlate Decision Token to PoE at high throughput? Caching strategy not specified.

**Verdict:** Strong architectural specification with sufficient detail for a security team to build a prototype. Not sufficient for a production platform engineer to implement without design discussions. **Score: 8/10** — excellent for a reference architecture; not quite production-ready specification.

---

### 2. TOOLING ALIGNMENT: 7/10

**Strengths:**
- **OPA/Rego** (§4.4): Concrete example policy. OPA is mature, battle-tested, and the Rego example is syntactically correct.
- **SPIFFE/SVID** (§4.1): Identity binding via SPIFFE workload attestation is well-integrated. Assumes SPIRE server availability.
- **Cloud KMS** (§3.1, A3): Acknowledges HSM support variance ("at time of writing, per vendor documentation consulted February 2026; providers update capabilities frequently"). Ed25519 HSM support is patchy as of Feb 2026.
- **Post-quantum migration** (§10.6): NIST FIPS 204 (ML-DSA-65) specified. Timeline (2025-2032) is realistic.
- **Anchor backends** (§4.2.2): Solana mainnet, Sigstore Rekor, RFC 3161 TSA, WORM S3. All real, deployed systems.
- **ONNX deployment** (ConvoGuard): DistilBERT ONNX for inference is standard 2026 practice.

**Gaps:**
- **ML-DSA-65 HSM support**: Paper notes "SHOULD support" but as of Feb 2026, no cloud KMS provider (AWS, GCP, Azure) has announced ML-DSA support. This is a 2027-2028 problem, not a 2026 concern. Paper should flag this as a blocker for T4 agents requiring PQ-ready deployment today.
- **OPA bundle distribution at scale**: Paper mentions "bundle staleness window (configurable sync interval, default 60s)" but doesn't specify how policy revocation is pushed to 10K+ agents. Webhook-based push? Event stream? This is a known OPA scalability challenge.
- **Kubernetes admission controller** (Kyverno/OPA Gatekeeper): Assumes Kubernetes. What about non-K8s deployments (VMs, serverless, edge)? Admission control for non-K8s is mentioned as "equivalent" but not specified.
- **SPIFFE trust domain federation**: Paper assumes "SPIRE server" but doesn't address SPIFFE trust domain federation for multi-org deployments. How do agents from Org A verify agents from Org B?
- **Solana mainnet for production PoE**: ~400ms latency, $0.00025/tx cost. Acceptable for T1-T2 agents but may not be for T3/T4 agents requiring <5s audit trail closure. Paper doesn't recommend Solana for T4; good. But doesn't clearly state the latency/cost tradeoff for different anchor backends.

**Verdict:** 2026 tooling landscape is well-understood. Post-quantum migration path is realistic but not immediately actionable. **Score: 7/10** — good alignment; some 2027-2028 dependencies not yet resolved in the tooling ecosystem.

---

### 3. CODE AVAILABILITY: 6/10

**Strengths:**
- **Claim**: "All 12 services are open source (MIT), independently deployable."
- **12 services listed** (§7): Agent Trust Verifier, Veracity Core, ConvoGuard AI, Segmentation Engine, Agent Pentest, Incident Response Service, etc.
- **Repository reference** (§12): `git clone https://github.com/yogami/vera-reference-implementation.git`
- **Test coverage**: "25/25 contract validation tests passing" with Playwright E2E.
- **Agent Pentest**: Published as npm package; 41 adversarial vectors, 90.2% block rate.

**Gaps:**
- **Repository validation failed**: I attempted to fetch the GitHub repository and received a 404 or access error. Either: (a) the repository doesn't exist yet, (b) it's private, or (c) the URL is incorrect. **Critical**: A paper claiming "backed by reference implementations" MUST provide accessible code. This is a red flag.
- **Empirical results (§7.1)**: Latency and accuracy metrics are presented (14ms median prompt injection detection, 97.3% PII precision). But **no code snippets** showing how ConvoGuard ONNX model is trained, how SWDB GMM is fitted, or how nonce lifecycle is managed. The paper provides schemas and pseudocode but not implementation.
- **Tool Execution Receipt verification**: Described in English (§4.2.1a, end-to-end verification, 6 steps) but no code. A Python reference implementation of the verification procedure would be 50 lines and would dramatically improve implementability.
- **OPA Rego example** (§4.4): Syntactically correct but incomplete. Missing: (a) how to load agent capability manifests into OPA context, (b) how to handle tier promotion logic, (c) how to integrate anomaly detector scores into policy evaluation.
- **Proof of Execution signing**: Paper specifies JCS canonicalization (RFC 8785) but doesn't provide a reference implementation of the canonicalization + signing pipeline. Organizations would need to either use an existing JCS library (available in Node.js, Python, Go) or implement it themselves.

**Verdict:** The paper claims reference implementations but provides no accessible code repository. This is a **major gap**. Even if the code exists, it is not verifiable by readers. **Score: 6/10** — claims are not substantiated by accessible artifacts. The paper would benefit from: (1) confirmed GitHub repository link, (2) at least one service with full source code walkthrough, (3) Python/Go reference implementations of critical functions (nonce verification, PoE verification, SWDB anomaly detection).

---

### 4. COMPETING FRAMEWORKS: 8/10

**Strengths:**
- **Comparative table** (§1.2): Honest assessment of NIST 800-207, OWASP Top 10, MAESTRO, AWS Scoping, VERA. VERA claims: formal threat model ✅, PDP/PEP architecture ✅, typed schemas ✅, evidence-based trust ✅, cryptographic proof of execution ✅, reference implementation ✅.
- **Differentiation is clear**: VERA's PDP/PEP placement is explicit; OWASP/MAESTRO are guidance-only. VERA's evidence-based trust (portfolio of PoE chains, adversarial test grades) vs AWS/NIST calendar-based promotion.
- **OWASP mapping** (§8): All 10 categories addressed. Honest about residual risks (e.g., "Multi-turn indirect injection evaded single-turn classifier").
- **Related work** (§11): Comprehensive citations to NIST SP 800-207, SLSA, Sigstore, in-toto, SELinux, capability-based security. Acknowledges AgentGuard, Zero-Trust Identity for Agentic AI, CP-WBFT for multi-agent BFT.

**Gaps:**
- **LangChain / Guardrails AI comparison**: Paper mentions these as "in-process guardrails" (complementary to VERA) but doesn't compare on: (a) latency (in-process guardrails can be <1ms; VERA PEP adds 14-22ms), (b) cost of operation, (c) ease of deployment. For organizations already using LangChain, the incremental value of VERA's out-of-process enforcement is not quantified.
- **AWS Scoping Matrix**: Paper claims VERA's trust tiers "align with AWS's scoping levels" but doesn't provide the mapping. AWS's scoping is based on operational risk (financial impact, data sensitivity); VERA's is based on evidence portfolio. Are they actually aligned, or just superficially similar?
- **Google A2A Protocol**: Paper claims VERA "interoperates with A2A's SPIFFE-based identity" but provides no concrete example. Does VERA's DID:web resolve to a SPIFFE identity? How are the two identity systems bridged?
- **MAESTRO**: Paper says VERA "operationalizes risks identified through MAESTRO" but doesn't specify which MAESTRO controls map to which VERA enforcement pillars. This would be valuable for organizations already using MAESTRO.

**Verdict:** Strong comparative analysis with honest trade-off discussion. Missing some concrete interoperability examples and cost comparisons. **Score: 8/10** — excellent framing; could be more concrete on integration paths.

---

### 5. SCALABILITY: 6/10

**Strengths:**
- **Honest about limitations** (§10.1): "VERA has been tested with individual agent deployments and small multi-agent configurations. Scaling to 1000+ agents requires sharded anomaly detection, distributed rate limiting, and hierarchical policy evaluation. We have not built these at scale."
- **Analytical projections** (§10.10): Detailed table projecting PDP latency, PoE storage, nonce set memory to 10K agents. Identifies bottlenecks: OPA bundle distribution at 1K agents, KMS throughput at 10K agents.
- **KMS bottleneck identified**: "KMS latency at scale requires connection pooling or cached signing tokens." This is realistic — KMS signing is a known bottleneck for high-volume PoE generation.
- **Nonce set memory**: Projected 4 GB for 10K agents (100K entries/PEP). This is manageable but requires careful LRU eviction.
- **OPA bundle distribution**: "Critical revocations require push-based invalidation" — acknowledges the 60s staleness window is a limitation.

**Gaps:**
- **No empirical validation beyond 50 agents**: The paper validates at "single-agent and small-cluster (<50 agents) deployments." Projections to 10K agents are analytical, not tested. This is a significant gap for a paper claiming to be "backed by reference implementations."
- **Sharded anomaly detection**: Paper mentions this as required for 1000+ agents but doesn't specify how. How do you shard SWDB GMM training? Do you have per-agent GMMs or per-cluster GMMs? How do you handle agents that migrate between shards?
- **Distributed rate limiting**: Required for 1000+ agents but not specified. Token bucket algorithm across distributed PEPs? Redis-backed shared state? Latency impact?
- **Hierarchical policy evaluation**: Mentioned as required but not designed. How does a T3 agent delegate to a T2 agent? Does policy evaluation happen at both levels? What's the latency impact?
- **Anchor throughput**: Paper doesn't project anchor saturation. If 10K agents each generate 1K PoE records/hour, that's 10M records/hour to anchor. Solana can handle ~400 TPS; that's ~1.4B tx/hour. So anchor throughput is not the bottleneck. But what about cost? 10M anchors × $0.00025 = $2,500/hour = $21.9M/year. Paper should flag this cost as a scalability constraint.
- **PoE storage**: 860 GB/day for 10K agents. Retention policy? How long do PoE records need to be stored? If 7 years (regulated), that's ~2.2 PB. This is not mentioned.

**Verdict:** Honest about limitations; analytical projections are reasonable but unvalidated. **Score: 6/10** — good for a reference architecture; insufficient for production deployment planning at scale. Organizations need to validate these projections in their own environments.

---

### 6. INTEROPERABILITY: 8/10

**Strengths:**
- **DID:web + SPIFFE integration**: "Organizations using SPIFFE/SVID for workload identity can use their existing SPIRE server as the identity provider for VERA agents, with DID:web resolving to the SPIFFE trust domain." Clear integration path.
- **Pluggable anchor abstraction** (§4.2.2): Blockchain (Solana), transparency log (Sigstore Rekor), hash-chained log, WORM storage, RFC 3161 TSA. Organizations can choose based on trust model and cost.
- **Tool Execution Receipt assurance levels** (§4.2.1a): Three levels (tool-signed, gateway-observed, log-correlated) with explicit guarantees per level. Enables gradual deployment — start with log-correlated, migrate to tool-signed as tools are updated.
- **Crypto agility** (A1'): `signatureAlgorithm` field enables heterogeneous chains. Supports Ed25519, ECDSA P-256, ML-DSA-65 (future).
- **OWASP Top 10 mapping** (§8): Explicit mapping of VERA controls to OWASP categories.
- **NIST AI RMF mapping** (§11): Maturity runtime maps to GOVERN, MAP, MEASURE, MANAGE.

**Gaps:**
- **Tool identity discovery at verification time**: Paper specifies that Tool Execution Receipts are signed by the tool's key but doesn't specify how verifiers discover the tool's public key. Is it from: (a) a centralized tool registry, (b) the tool's DID document, (c) SPIFFE trust domain, (d) embedded in the receipt? This is critical for interoperability.
- **Nonce format standardization**: Nonce format is `{actionId}:{random_bytes_hex}` but this is VERA-specific. How do external tools (SaaS APIs that can't be modified) participate in nonce binding? The paper mentions "gateway receipt" for external SaaS but doesn't specify how the gateway generates nonces that are meaningful to the external tool.
- **DID:web resolution**: Paper uses DID:web but doesn't specify: (a) DID method (is it the W3C standard?), (b) resolution endpoint (does it require HTTPS?), (c) caching strategy for DID documents, (d) what happens if DID resolution fails at decision time? Fail-closed or fail-open?
- **A2A protocol integration**: Paper claims alignment with Google A2A but doesn't show a concrete example. How does a VERA agent authenticate to a non-VERA service using A2A? What claims does the VERA identity token include that A2A expects?
- **Cross-org agent verification**: Paper doesn't address how an agent from Org A proves its identity to Org B. Is it via DID:web resolution? SPIFFE trust domain federation? This is critical for multi-tenant deployments.

**Verdict:** Strong foundation for interoperability; missing some concrete specifications for cross-org and external-tool integration. **Score: 8/10** — good architectural alignment; needs more concrete integration examples.

---

### 7. CODE vs WORDS: 65%

**Breakdown:**

| Component | Implementability | Notes |
|:---|:---:|:---|
| **Identity (Pillar 1)** | 75% | DID:web schema clear; SPIFFE integration described; key management lifecycle specified. Missing: DID resolution implementation, key provisioning automation. |
| **Behavioral Proof (Pillar 2)** | 70% | PoE schema detailed; JCS canonicalization specified (RFC 8785); nonce lifecycle clear. Missing: end-to-end verification pseudocode, tool receipt correlation logic. |
| **Data Sovereignty (Pillar 3)** | 60% | Input firewall method specified (DistilBERT ONNX); memory governance schema provided. Missing: ONNX model training procedure, RAG poisoning detection algorithm, taint tracking implementation. |
| **Segmentation (Pillar 4)** | 70% | PDP input/output schemas clear; OPA Rego example provided. Missing: hierarchical policy evaluation, tool-parameter constraint propagation at scale. |
| **Incident (Pillar 5)** | 55% | Multi-stage containment described (6 stages, SLAs). Missing: circuit breaker algorithm, compensating transaction specification, forensic preservation workflow. |
| **Maturity Runtime (Section 5)** | 50% | Trust tiers defined; evidence portfolio schema provided. Missing: promotion decision algorithm, automatic demotion triggers, evidence validation logic. |
| **Supply Chain (Section 6)** | 65% | Verification components listed; SBOM/SLSA mentioned. Missing: concrete SBOM parsing logic, vulnerability threshold definition, training data provenance format. |
| **Anomaly Detection (§4.2.3)** | 40% | Algorithm (SWDB) described at high level; GMM, BIC, drift adaptation specified. Missing: feature extraction implementation, baseline initialization, threshold tuning for different trust tiers. |
| | | |
| **AVERAGE** | **65%** | |

**What's directly implementable:**
- PoE record schema and signing (JCS + Ed25519) — ~100 lines of code
- PDP input/output schemas and OPA integration — ~200 lines
- Nonce lifecycle management (generation, TTL, single-use enforcement) — ~150 lines
- Tool parameter constraints — ~100 lines
- Identity schema and DID:web resolution — ~200 lines

**What requires significant interpretation:**
- Anomaly detection (SWDB): Feature extraction is vague ("action type distribution, parameter value distributions, timing patterns, resource access patterns, error rates"). What are the actual features? How are they normalized? Paper provides algorithm but not feature engineering.
- Multi-stage containment: Six stages with SLAs but no state machine or orchestration logic. How do you coordinate token revocation → session termination → network isolation → state freeze? Sequential or parallel?
- Evidence portfolio validation: Schema is provided but not the validation logic. How do you verify that an adversarial test report is genuine? Who signs it? What's the trust anchor?
- Maturity promotion: Trust tier thresholds are specified (e.g., "min 10,000 evaluated actions") but not the decision algorithm. How do you handle edge cases (agent with 9,999 actions; anomaly rate 0.99% for T3 agent requiring <0.1%)? Is there a grace period?

**Verdict:** **65% is implementable directly from the paper.** The remaining 35% requires design discussions or reverse-engineering from the 12 claimed reference implementations. This is acceptable for a reference architecture but limits immediate adoption. **Score: 65%** — good for a security team to prototype; insufficient for a platform engineer to deploy without design documents.

---

## TOP 3 TECHNICAL GAPS

### Gap 1: Code Accessibility and Validation (Critical)

**Issue:** Paper claims "backed by 12 open source reference implementations" but provides no accessible repository. I attempted to fetch the GitHub URL and received an error. This is a critical credibility issue.

**Why it matters:** Reviewers cannot validate: (a) whether the claimed 12 services actually exist, (b) whether the empirical results (90.2% adversarial test block rate, 14ms latency) are reproducible, (c) whether the schemas are actually implemented as specified, (d) whether the 25 contract tests pass.

**Recommendation:**
1. **Provide a verified GitHub URL** with public access to at least 3 of the 12 services (e.g., Veracity Core for PoE, ConvoGuard AI for input firewall, Segmentation Engine for PDP).
2. **Include a reproducibility guide**: Instructions for running the 25 contract tests locally, with expected output.
3. **Publish the adversarial test suite** (agent-pentest) with documentation of the 41 vectors and how to run them against a reference agent.
4. **Add a "Getting Started" section** with concrete steps to deploy a T1 agent end-to-end (DID issuance → capability registration → first PoE generation) in <30 minutes.

Without this, the paper is a specification document, not a "reference implementation" paper.

---

### Gap 2: Scalability Validation Beyond 50 Agents (High)

**Issue:** Paper validates at <50 agents but projects to 10K agents analytically. No empirical data on:
- PDP latency under load (OPA policy evaluation with 10K agents)
- KMS bottleneck at high PoE volume (is connection pooling sufficient?)
- Anchor throughput saturation (10M records/hour to Solana)
- OPA bundle distribution at 1K+ agents (does 60s staleness hold?)
- Nonce set LRU eviction behavior under churn

**Why it matters:** Organizations deploying VERA at scale need empirical evidence that the architecture doesn't collapse. Analytical projections are useful but not sufficient.

**Recommendation:**
1. **Conduct load testing** with 100, 500, 1K agents generating actions at 1K actions/agent/hour. Measure: PDP p50/p99 latency, KMS signing latency, anchor confirmation latency.
2. **Test OPA bundle distribution** at 1K+ agents with policy changes every 60s. Measure: bundle staleness distribution, revocation propagation latency.
3. **Benchmark nonce set** under high action volume with realistic TTL and eviction. Measure: LRU hit rate, memory pressure.
4. **Document the scaling limits** explicitly: "VERA validated up to X agents with Y actions/hour. Beyond X agents, component Z becomes the bottleneck."

---

### Gap 3: Tool Execution Receipt Verification and Tool Identity Management (High)

**Issue:** Tool Execution Receipts are a key innovation but the verification procedure is underspecified:
- How do verifiers discover tool public keys? (registry, DID, SPIFFE, embedded in receipt?)
- How do external SaaS tools (that can't be modified) participate in nonce binding?
- How do you detect a compromised tool key? (revocation list? key rotation?)
- What's the impact of a compromised tool key on historical receipt validity?

**Why it matters:** Receipts provide "end-to-end verifiable enforcement" only if tool identity is trustworthy. A compromised tool can sign false receipts, and the impact on the audit trail is not addressed.

**Recommendation:**
1. **Specify tool key lifecycle**: Provisioning (how is the tool's initial key registered?), rotation (90-day recommended), revocation (how is revocation published and checked?), compromise detection (what signals indicate a compromised tool key?).
2. **Define tool identity discovery**: Specify a priority order for key discovery: (a) tool's SPIFFE identity (if available), (b) tool's DID document (if available), (c) centralized tool registry (fallback), (d) embedded in receipt (for air-gapped scenarios).
3. **Provide a tool receipt verification library** (Python/Go) that implements the 6-step verification procedure. This would be ~100 lines of code and would dramatically improve adoption.
4. **Address external SaaS tools**: For tools that can't sign receipts, specify the "gateway receipt" format and assurance level clearly. Document the trust assumptions: "Gateway receipt attests to request emission and response receipt, but not server-side execution correctness."

---

## GREENLIGHT DECISION

### GREENLIGHT: **YES** (with conditions)

**Rationale:**

VERA is a **well-reasoned, architecturally sound reference architecture** for runtime enforcement in AI agents. It addresses a real gap (enforcement layer between governance guidance and infrastructure), provides formal security properties with stated assumptions, and demonstrates awareness of practical constraints (scalability limits, residual risks, post-quantum migration).

**Strengths supporting publication:**
1. **Novel contribution**: Adapting NIST SP 800-207 PDP/PEP architecture to non-deterministic agent action loops is non-trivial. Tool Execution Receipts with nonce-binding is a concrete innovation.
2. **Honest threat modeling**: Five adversary classes with explicit capability matrices. Residual risks are acknowledged (e.g., "Compromiser with cloud admin access can modify IAM policies").
3. **Formal security properties**: Definitions 1-4 are clearly stated with game-based proof sketches. Cryptographic assumptions A1-A4 are explicit.
4. **Practical interoperability**: DID:web + SPIFFE integration, pluggable anchors, crypto agility for post-quantum migration.
5. **Comprehensive coverage**: All OWASP Top 10 categories addressed; NIST AI RMF mapping provided.

**Conditions for publication:**
1. **Mandatory: Provide accessible code repository** with at least 3 services (Veracity Core, ConvoGuard AI, Segmentation Engine) and reproducible tests. Without this, the paper is a specification, not a reference implementation paper.
2. **Strongly recommended: Add empirical scalability validation** to 100-500 agents with concrete latency/throughput measurements. Analytical projections are useful but not sufficient for production decisions.
3. **Strongly recommended: Expand tool identity management** section (Gap 3 above) with concrete specifications for key discovery, revocation, and compromise detection.

**Minor improvements:**
- Add pseudocode for end-to-end PoE verification and Tool Execution Receipt verification.
- Provide concrete OPA Rego policies for T2/T3/T4 tier promotion logic.
- Clarify DID:web resolution endpoint and caching strategy.
- Quantify cost-benefit trade-offs between different anchor backends (Solana vs Rekor vs RFC 3161 TSA).

**Publication recommendation:**

Publish as a **reference architecture** (not a production platform specification) with the mandatory code repository condition. The paper makes a solid contribution to the AI agent security discourse by specifying the enforcement layer that existing frameworks leave vague. It will be valuable for security teams building agent infrastructure and for researchers extending the work (Byzantine fault tolerance, post-quantum migration, multi-tenant policy evaluation).

---

## FINAL SCORES SUMMARY

| Dimension | Score | Status |
|:---|:---:|:---|
| TECHNICAL DEPTH | 8/10 | ✅ Strong |
| TOOLING ALIGNMENT | 7/10 | ✅ Good |
| CODE AVAILABILITY | 6/10 | ⚠️ **Critical gap** — no accessible repository |
| COMPETING FRAMEWORKS | 8/10 | ✅ Strong |
| SCALABILITY | 6/10 | ⚠️ Validated <50 agents; projections unvalidated |
| INTEROPERABILITY | 8/10 | ✅ Good |
| CODE vs WORDS | 65% | ⚠️ Moderate — requires interpretation |
| | | |
| **OVERALL SCORE** | **7/10** | **Publish with conditions** |

---

**GREENLIGHT: YES** ✅

*Condition: Provide accessible GitHub repository with 3+ reference implementations and reproducible tests before publication. The paper is architecturally sound and makes a novel contribution; the code repository is essential to validate the claims.*