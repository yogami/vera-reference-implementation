# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 140.8s
**Score:** 7.5/10
**Greenlight:** ✅ YES

---

# IEEE S&P Industry Track Review: VERA

## Reviewer: Professor Marcus Chen, ETH Zurich

---

## DIMENSIONAL SCORES

**1. CONTRIBUTION: 8/10**

The paper makes a solid contribution by providing a concrete enforcement architecture for AI agent security. The key novel elements are:

- Tool Execution Receipts with nonce-binding (§4.2.1a) - this is genuinely new and addresses the gap between "signed logging" and "verifiable enforcement"
- Evidence-based maturity runtime (§5) replacing calendar-based trust
- Formal security arguments under explicit cryptographic assumptions (§3.3)
- Memory/RAG governance with enforceable controls (§4.3)

However, the contribution is primarily *engineering* rather than *research*. The paper operationalizes existing concepts (Zero Trust, runtime verification, capability-based security) for AI agents rather than introducing fundamentally new security primitives. For an industry track, this is appropriate, but the abstract's claim of "reference architecture" should be tempered - this is *a* reference architecture, not *the* definitive one.

**Strength:** The Tool Execution Receipt mechanism with cryptographic nonce-binding is the paper's strongest technical contribution. The three-level assurance model (tool-signed / gateway-observed / log-correlated) is pragmatic and honestly scoped.

**Weakness:** The paper conflates "enforcement" with "verifiability" in places. PoE alone provides tamper-evident logging, not proof of correct execution. The distinction is clearer in later sections but muddled in the abstract.

---

**2. RELATED WORK: 7/10**

The related work section (§11) is comprehensive and appropriately scoped. The paper correctly positions itself relative to:
- Standards (NIST 800-207, OWASP Top 10, MAESTRO)
- Runtime verification (Leucker & Schallhart, AgentGuard)
- TEE work (SGX, SEV-SNP)
- BFT protocols (PBFT, CP-WBFT)

**Strengths:**
- Honest differentiation from complementary work (Guardrails AI, NeMo Guardrails)
- Acknowledges gaps (BFT for multi-agent, physical actuators)
- Cites foundational work (Schneider's enforceable policies, capability-based security)

**Weaknesses:**
- Missing: **Formal verification of smart contracts** (relevant for blockchain anchoring security)
- Missing: **Differential privacy for agent telemetry** (anomaly detection leaks behavioral patterns)
- The paper cites "arXiv, 2025" and "arXiv, 2026" for future work, which is appropriate for a February 2026 submission but should specify preprint identifiers
- No comparison to **OpenAI's Preparedness Framework** or **Anthropic's Responsible Scaling Policy** (industry-relevant governance frameworks)

---

**3. THREAT MODEL: 9/10**

This is the paper's strongest section. The five adversary classes with capability matrices (§2.2) are well-structured and map cleanly to OWASP categories. The combined attack scenarios (§2.3) demonstrate realistic threat composition.

**Strengths:**
- Explicit trust assumptions (A1-A4) with cryptographic grounding
- Capability matrix clearly delineates what each adversary can/cannot do
- Adversary Class 5 (Enforcement-Plane Compromiser) is often ignored in other frameworks
- Honest residual risk assessment (e.g., "zero-day in signed dependency")

**Weaknesses:**
- **Cloud Provider Trust (A3):** The assumption that cloud KMS operators are honest is stated but not deeply analyzed. What if AWS/GCP/Azure is compelled by state actors? The paper should acknowledge this as a fundamental trust anchor and recommend on-premise HSMs for high-assurance deployments (it does briefly, but this deserves more emphasis).
- **Anchor Integrity (A4):** "At least one tamper-evident anchor backend is available and not controlled by the adversary" - this assumes diversity. What if an organization uses only Solana and Solana experiences a consensus failure? The paper should specify minimum diversity requirements (e.g., "at least two independent anchor backends with different trust models").
- **Timing attacks:** The threat model does not address timing side-channels in PDP evaluation or PoE generation. An adversary observing PDP latency might infer policy structure.

**Minor issue:** The threat model assumes the agent runtime is "semi-trusted" but doesn't formally define what this means. Is it trusted for confidentiality? Integrity? Availability? The paper should adopt a more precise trust model (e.g., Trusted Computing Base partitioning).

---

**4. FORMALIZATION: 7/10**

The security properties (§3.2) are clearly stated with definitions and security arguments. However, the "security arguments" (§3.3) are proof sketches, not formal proofs.

**Strengths:**
- Definitions 1-4 are precise and independently verifiable
- Security Argument 1 (Non-Repudiation) correctly reduces to EU-CMA of Ed25519
- The paper is honest about what PoE does *not* guarantee (execution correctness)
- Cryptographic assumptions (A1, A1', A2) are explicit

**Weaknesses:**
- **Game-based notation is incomplete.** Security Argument 2 (Chain Tamper-Evidence) presents a "Game TE" but doesn't define the challenger's behavior, the adversary's query budget, or the success probability bound rigorously. For IEEE S&P, even industry track papers should provide complete game definitions or cite a formal model.
- **Missing: Formal definition of "enforcement completeness."** Definition 3 states completeness "with respect to the controlled action surface S" but doesn't formally define S. Is S the set of all actions that *could* pass through a PEP, or all actions that *do*? The paper should provide a formal characterization (e.g., S = {a | ∃ PEP : a ∈ domain(PEP)}).
- **Containment Bound (Definition 4):** The formula assumes synchronous enforcement and acknowledges in-flight operations as a gap. This is honest, but the bound should be stated probabilistically (e.g., "with probability ≥ 1-δ, max_loss ≤ ...") to account for race conditions.
- **Post-quantum claims (A1'):** The paper states "SHOULD support ML-DSA-65" but doesn't provide security arguments for the PQ case. If VERA claims PQ-readiness, it should specify the reduction (e.g., "under the hardness of Module-LWE...").

**Recommendation:** Either (1) complete the game-based proofs with full definitions and probability bounds, or (2) explicitly label §3.3 as "informal security arguments" and defer formal verification to future work. The current presentation is in an awkward middle ground.

---

**5. EVALUATION: 6/10**

The empirical results (§7.1, §7.2) are valuable but limited in scope.

**Strengths:**
- Transparent disclosure of bypassed vectors (§7.2) - this is commendable
- Latency measurements for ConvoGuard (14ms p50, 22ms p99) are realistic
- Contract validation tests (25/25) demonstrate operational deployment
- Scalability projections (§10.10) are analytically grounded

**Weaknesses:**
- **No large-scale deployment data.** The paper states "VERA has been tested with individual agent deployments and small multi-agent configurations" (§10.1). For an industry track paper claiming "12 services, running code," the evaluation should include:
  - Multi-tenant deployment results (isolation verification)
  - Failure injection tests (what happens when PDP is unavailable for >30s?)
  - Long-term stability (have these services run for months without manual intervention?)
- **Adversarial evaluation is limited.** The agent-pentest suite (41 vectors) is a good start, but:
  - No adaptive adversary evaluation (attacker who knows VERA's defenses)
  - No red team exercise with human attackers
  - Block rate of 90.2% is presented as success, but 9.8% bypass rate is concerning for production
- **No comparison to baselines.** How does VERA compare to deploying agents *without* VERA? What is the security improvement? The paper should include a control group.
- **Performance overhead is under-analyzed.** The paper states "14-22ms for data governance and 3ms for proof generation" but doesn't measure end-to-end latency impact on real agent tasks. For a conversational agent, does VERA add 50ms? 200ms?

**Missing experiments:**
- **Fault injection:** What happens if the KMS is unreachable? If anchor backend is down? The failure mode table (§4.0) specifies behavior but doesn't validate it empirically.
- **Policy complexity analysis:** How does PDP latency scale with policy size? The paper uses OPA but doesn't measure evaluation time for realistic policies.
- **Anomaly detection false positive rate:** The SWDB algorithm (§4.2.3) specifies target FPRs but doesn't report achieved FPRs in production.

**Data availability:** The paper states all services are open source (MIT) but doesn't provide a dataset for reproduction. For IEEE S&P, even industry papers should include:
- Anonymized PoE chains from production deployments
- Adversarial test vectors (the 41 vectors from agent-pentest)
- Policy bundles used in evaluation

---

**6. WRITING QUALITY: 8/10**

The paper is well-written, clearly structured, and appropriate for the venue. The use of tables, schemas, and Mermaid diagrams aids comprehension.

**Strengths:**
- Clear problem statement (§1) with motivating examples
- Consistent terminology (PDP, PEP, PoE)
- Honest limitations section (§10)
- Code snippets are syntactically correct and illustrative

**Weaknesses:**
- **Tone occasionally drifts into marketing.** Examples:
  - Abstract: "VERA provides..." (5 bullet points) reads like a feature list
  - §1: "The security community has responded with a wave of governance frameworks" - this is editorializing
  - §7: "12 services, running code" - the repetition of "deployed" in the table feels promotional
  
  For IEEE S&P, the tone should be more measured. Suggest rephrasing to: "VERA's architecture includes..." or "The reference implementation comprises..."

- **Inconsistent notation:**
  - Sometimes uses `a` for action, sometimes `action`
  - Sometimes uses `H(·)` for hash, sometimes `SHA-256(·)`
  - Recommend standardizing on mathematical notation

- **Long sentences in threat model.** Example (§2.2, Adversary Class 5):
  > "PEP/PDP artifact signing and admission control (cosign + Kyverno/Gatekeeper), SLSA Level 2+ provenance, separation of duties (policy authors ≠ PEP deployers), KMS condition keys restricting `Sign` to attested SPIFFE IDs, quorum-based signing for T4 agents (two-person rule), independent witnesses that verify PoE/receipt consistency and anchor alerts externally."
  
  This is a list, not a sentence. Break into bullets.

- **Acronym overload:** PDP, PEP, PoE, PII, PHI, NER, ONNX, SBOM, SLSA, TEE, BFT, PBFT, etc. The paper should include an acronym table.

**Minor issues:**
- "Berlin AI Labs — February 2026" - for a conference submission, the date should be submission date, not publication date
- References to "arXiv, 2025" and "arXiv, 2026" without identifiers are incomplete

---

**7. LIMITATIONS: 9/10**

The limitations section (§10) is exemplary. The paper honestly acknowledges:
- Scalability gaps (§10.1)
- PoE integrity vs execution correctness (§10.3)
- Non-determinism challenges (§10.4)
- Multi-agent BFT gaps (§10.5)
- Post-quantum migration path (§10.6)
- Tool identity risks (§10.7)
- Deployment costs (§10.9)

**This is the gold standard for limitations sections.** The paper does not oversell its contributions.

**Strengths:**
- Quantified cost estimates (§10.9)
- Scalability projections with bottleneck analysis (§10.10)
- Honest assessment of what PoE does *not* guarantee (§10.3)
- Tool key compromise risks (§10.7) are often ignored in other work

**Minor weaknesses:**
- §10.6 (Post-Quantum) could be moved to §3 (Cryptographic Assumptions) for better flow
- §10.7 (Tool Identity) introduces a significant trust assumption late in the paper - this should be surfaced earlier

---

## OVERALL SCORE: 7.5/10

This is a **solid industry track paper** that makes a valuable engineering contribution to AI agent security. The architecture is well-designed, the threat model is rigorous, and the limitations are honestly stated. However, the evaluation is limited in scope, and the formalization could be tightened.

---

## VERDICT: **ACCEPT**

**Justification:**
- The paper addresses a real, pressing problem (AI agent security enforcement)
- The technical contribution (Tool Execution Receipts, evidence-based maturity) is novel enough for industry track
- The threat model and limitations are exemplary
- The writing is clear and the architecture is actionable
- The open-source reference implementation adds value

**This is not a Strong Accept because:**
- The evaluation lacks large-scale deployment data
- The security arguments are informal proof sketches, not rigorous proofs
- The adversarial evaluation (90.2% block rate) is promising but not definitive

**This is not a Weak Accept because:**
- The contribution is substantial and well-scoped
- The architecture is immediately deployable
- The paper advances the state of practice in agent security

---

## GREENLIGHT: **YES**

**Conditional on minor revisions:**

---

## TOP 3 SPECIFIC IMPROVEMENTS NEEDED

### 1. **Strengthen the Evaluation (Critical)**

**Current gap:** The paper claims "12 services, running code" but provides limited empirical validation. The adversarial test suite (41 vectors, 90.2% block rate) is a good start, but insufficient for production claims.

**Required additions:**
- **Large-scale deployment metrics:** Report results from a multi-tenant deployment with ≥100 agents over ≥30 days. Include:
  - Total PoE records generated
  - PDP availability (uptime %)
  - Anomaly detection false positive rate (achieved vs. target)
  - Incident response SLA compliance (% of incidents contained within stated bounds)
  
- **Baseline comparison:** Deploy a control group of agents *without* VERA enforcement and measure:
  - Successful prompt injection rate (VERA vs. control)
  - Data exfiltration attempts blocked (VERA vs. control)
  - Mean time to detect (MTTD) for compromised agents
  
- **Failure injection tests:** Empirically validate the failure mode table (§4.0):
  - Kill the PDP and measure fail-closed behavior
  - Disconnect the anchor backend and verify PoE queueing
  - Inject stale policy bundles and measure detection latency

**Why this matters:** For an industry track paper, "running code" must be backed by production-grade evaluation. The current evaluation reads like a proof-of-concept, not a battle-tested system.

---

### 2. **Formalize or Clearly Label Security Arguments (Important)**

**Current gap:** Section 3.3 presents "security arguments" in game-based notation, but the games are incomplete. Security Argument 2 (Chain Tamper-Evidence) defines "Game TE" but doesn't specify:
- What queries the adversary can make
- What the challenger's responses are
- What the success probability bound is (currently "≤ negl(λ)" without defining the negligible function)

**Required changes (pick one):**

**Option A (Formal):** Complete the game-based proofs:
- Define the challenger C's behavior (setup, query responses, verification)
- Specify the adversary A's query budget (polynomial in security parameter λ)
- State the reduction explicitly (e.g., "If A wins Game TE with probability ε, we construct an adversary B that breaks SHA-256 collision resistance with probability ε - negl(λ)")
- Provide a concrete security bound (e.g., "Pr[A wins] ≤ q²/2²⁵⁶ where q is the number of hash queries")

**Option B (Informal):** Relabel §3.3 as "Informal Security Arguments" and state:
> "The following are structured security arguments that clarify the intuition behind VERA's security properties. Formal proofs require modeling the multi-party agent-PEP-tool interaction as a cryptographic protocol and are left to future work."

Then present the arguments as they are, but without the "Game" framing.

**Why this matters:** The current presentation is in an awkward middle ground. Either commit to formal proofs or clearly label the arguments as informal. For IEEE S&P, even industry papers should be rigorous about security claims.

**Recommendation:** I suggest Option B for this paper. Full formal verification is a separate research contribution. The current arguments provide valuable intuition and should be retained, but labeled appropriately.

---

### 3. **Clarify Trust Assumptions and Surface Them Earlier (Important)**

**Current gap:** Critical trust assumptions are scattered throughout the paper:
- Cloud Provider Trust (A3) is stated in §3.1 but not deeply analyzed
- Tool identity trust is introduced in §4.2.1a but risks are deferred to §10.7
- Enforcement Plane trust is assumed in §4.0 but compromises are addressed in §2.2 (Adversary Class 5)

**Required changes:**

**Add a "Trust Model" subsection to §2 (Threat Model):**

```markdown
### 2.X Trust Model and Assumptions

VERA's security properties depend on the following trust assumptions:

**T1: Enforcement Plane Integrity**
- PDP, PEP, and Proof Engine are trusted for policy evaluation and PoE signing
- Compromise of any enforcement component degrades to audit-only mode
- Mitigation: SLSA Level 2+ provenance, container attestation, separation of duties

**T2: Cryptographic Primitives**
- Ed25519 is EU-CMA secure (A1)
- SHA-256 is collision-resistant (A2)
- Post-quantum migration: ML-DSA-65 (FIPS 204) by 2030 (§10.6)

**T3: Key Management**
- KMS prevents key exfiltration (A3)
- Cloud KMS operators are honest with respect to key confidentiality
- Organizations requiring stronger guarantees SHOULD use on-premise HSMs or TEE-backed KMS

**T4: Anchor Integrity**
- At least one tamper-evident anchor backend is honest (A4)
- Minimum diversity: two independent anchor backends with different trust models
- Anchoring cadence defines maximum rewrite window (T3: 15min, T4: 5min)

**T5: Tool Identity**
- Tool signing keys are provisioned securely and rotated periodically (90-day recommended)
- Tool compromise detection requires cross-referencing receipts with independent logs
- False receipts are detectable via multi-receipt correlation (§10.7)
```

**Why this matters:** Trust assumptions are the foundation of any security architecture. They should be surfaced early, stated clearly, and referenced consistently. The current paper buries critical assumptions (e.g., "cloud KMS operators are honest") in footnotes or late sections.

**Impact:** This change improves the paper's rigor and helps readers evaluate whether VERA's trust model aligns with their deployment context.

---

## ADDITIONAL MINOR COMMENTS

### Tone Adjustments for IEEE S&P

The following passages should be rephrased to reduce promotional tone:

**Abstract:**
- Current: "VERA provides: ..." (5 bullet points)
- Suggested: "VERA's architecture includes: ..." or "Key contributions include: ..."

**Section 1:**
- Current: "The security industry has responded with a wave of governance frameworks."
- Suggested: "Recent governance frameworks (NIST AI RMF, OWASP Top 10 Agentic, MAESTRO) provide control categories and maturity models."

**Section 7:**
- Current: "VERA is extracted from 12 deployed services that have been running in production."
- Suggested: "VERA's reference implementation comprises 12 independently deployable services validated in controlled environments."

### Missing References

Add the following:
- **OpenAI Preparedness Framework** (2023) - industry governance framework
- **Anthropic RSP** (2023) - scaling policy relevant to trust tiers
- **Verifiable Credentials Data Model v2.0** (W3C, 2024) - formal spec for JWT-VC
- **IETF SCITT Architecture** (draft-ietf-scitt-architecture) - supply chain transparency (cited but not in references)

### Notation Consistency

Standardize on:
- `H(·)` for hash functions (not `SHA-256(·)` in prose)
- `a` for actions (not `action` in formulas)
- `σ` for signatures (already consistent)

### Acronym Table

Add a table at the end of §1 or in an appendix:

| Acronym | Definition |
|:---|:---|
| PDP | Policy Decision Point |
| PEP | Policy Enforcement Point |
| PoE | Proof of Execution |
| ... | ... |

---

## SUMMARY

This is a **strong industry track paper** that makes a valuable contribution to AI agent security. The architecture is well-designed, the threat model is rigorous, and the limitations are exemplary. The evaluation is the primary weakness - it needs large-scale deployment data and baseline comparisons to substantiate the "running code" claims.

**With minor revisions (primarily evaluation and formalization clarity), this paper will be a valuable reference for practitioners deploying AI agents in production.**

**GREENLIGHT: YES** (conditional on addressing Improvements 1-3)

---

**Recommendation to Authors:**

This is good work. Focus your revision on:
1. Adding large-scale deployment metrics (even if limited to one production deployment)
2. Clarifying that security arguments are informal (or completing the formal proofs)
3. Surfacing trust assumptions earlier in the paper

The architecture is sound, the writing is clear, and the honesty about limitations is commendable. With a stronger evaluation, this will be an excellent industry track paper.

**Final Score: 7.5/10 → ACCEPT**