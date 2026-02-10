# VERA Paper — Expert Review Round 11

**Date:** 2026-02-10T13:20:34.885Z
**Average Score:** 6.1/10
**All Greenlit:** YES

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 0/10
**Greenlight:** ✅ YES
**Response time:** 64.4s

---

## Publication-quality review — VERA: Verifiable Enforcement for Runtime Agents (Round 11)

### Executive assessment
This is one of the stronger “Zero Trust for agents” architecture papers I’ve seen: it moves beyond governance checklists into *runtime mediation*, it places PDP/PEP explicitly, and it tries to make enforcement *auditable and externally verifiable* via signed decision tokens + PoE + (optionally) tool-signed receipts. The structure is coherent, the scope boundaries are stated, and the authors are unusually honest about what PoE does *not* prove.

Where it still falls short of publication-grade rigor is (a) tightening the formal protocol and threat assumptions around receipts, nonces, and key/attestation lifecycles; (b) clarifying what remains “Zero Trust” when you assert a trusted enforcement plane; and (c) improving implementability by providing normative schemas/encodings, precise verification algorithms, and interoperability profiles.

---

# Scores (1–10)

### 1) ARCHITECTURAL COMPLETENESS — **8/10**
**What’s strong**
- Clear, explicit PDP/PEP placement (sidecar vs central PDP) and a credible “action boundary” model aligned with NIST 800-207’s mediation principle.
- Good treatment of *decision provenance* (signed PDP decision token) to prevent “PEP lies about PDP decisions.”
- Enforcement pillars cover the real agent surfaces: tool calls, network egress, memory/RAG, delegation, and incident containment.

**What’s missing / under-specified**
- The *policy evaluation feedback loop* exists conceptually (telemetry/anomaly → PDP) but is not specified as a secure control loop (integrity of signals, anti-replay, minimum set of required signals per decision, what happens when signals conflict).
- “Completeness” is defined relative to a controlled surface **S**, but S is left too operator-defined; you need a normative “minimum required S” for a system to claim VERA compliance at T3/T4.
- Asynchronous tool execution and eventual consistency are acknowledged (Containment Bound), but enforcement implications aren’t fully integrated (e.g., how PoE/receipts handle queued jobs, webhooks, delayed side effects, retries across minutes).

### 2) THREAT MODEL RIGOR — **7/10**
**What’s strong**
- The five adversary classes are practical and map well to how real compromises occur (inputs, insider/supply chain, privilege escalation, evasion, enforcement-plane compromise).
- Capability matrix is useful and the paper consistently ties controls back to attacker capabilities.
- You explicitly call out “if PDP/PEP compromised, enforcement is void” (good honesty).

**What’s missing**
- The model is not yet *formally structured*: it would benefit from a standard decomposition (e.g., STRIDE/LINDDUN for components, or ATT&CK-style tactics/techniques) and explicit “in/out of scope” per class.
- Some trust assumptions are brittle or ambiguous (e.g., “at least one anchor backend is honest” — what adversaries can DoS anchoring vs rewrite history; what you do on partition).
- You should explicitly model **collusion** (e.g., Insider + Compromiser; tool compromise + enforcement-plane compromise) because your strongest claims depend on “at least one honest party” across multiple roles.

### 3) NOVELTY — **8/10**
**What’s genuinely new (relative to “NIST 800-207 applied to agents”)**
- Signed PDP decision tokens + PoE chaining + nonce-bound tool execution receipts as a *verifiability stack* is a meaningful step beyond typical ZT deployments (which usually stop at logs/telemetry).
- Evidence-based maturity (“earn autonomy through proofs/portfolios”) is a useful operational innovation; it also creates a policy handle for progressive authorization.
- Memory/RAG governance is treated as a first-class enforcement surface (rare in ZT reference architectures).

**Where novelty is overstated**
- “Cryptographic proof of execution” risks being interpreted as “proof the action truly occurred as claimed.” You do partially correct this later via assurance levels and limitations; I recommend tightening the abstract language so it doesn’t read stronger than what the system can guarantee.

### 4) FORMAL DEFINITIONS — **7/10**
**What’s strong**
- Typed schemas are a major improvement over most papers in this space.
- Use of RFC 8785 (JCS) is the right move for deterministic signing.
- Definitions 1–4 are mostly implementable and you explicitly separate “record integrity” from “execution correctness.”

**What’s missing for implementability**
- The spec mixes “TypeScript interface” with normative requirements, but does not provide **normative JSON Schema**, **OpenAPI/gRPC**, canonical field-level constraints, or test vectors (canonicalization examples, signature verification examples).
- Several fields need stricter definition to avoid divergent implementations:
  - `parameters` canonicalization and minimization rules (especially for nested objects, floats, and binary).
  - Exact definition of `requestHash` (what exactly is hashed—raw request bytes? canonical JSON? headers?).
  - Signature container format (raw signature bytes? JWS? COSE_Sign1?). Right now “signature: string” is ambiguous.
- Case and enum inconsistencies will create interop bugs (`ALLOW` vs `allow`, `ISO8601` type usage, `expiry: ISO8601` but no format constraints).

### 5) PRACTICAL VALUE — **8/10**
**What will help engineering teams**
- Concrete deployment patterns, fail-open/fail-closed guidance by tier, and a clear “default deny egress” stance.
- The action coverage matrix is the kind of artifact teams can directly map to Kubernetes/network policy and gateway designs.
- The assurance-level framing for receipts is pragmatic and honest.

**What may impede adoption**
- Tool-signed receipts are operationally heavy and require tool identity, key management, and integration changes across services. The paper acknowledges this, but teams will need a clearer “minimum viable path” and migration steps for brownfield SaaS/tooling.
- Performance numbers are plausible, but teams will want sizing guidance for central PDP at scale and for KMS signing throughput under bursty agent tool-chaining.

---

# OVERALL SCORE — **8/10**

This is close to publishable as a reference architecture paper, with revisions focused on (1) normative protocol specification, (2) threat model formalization and collusion handling, and (3) tightening claims around “verifiable execution.”

---

## Top 3 specific improvements (highest leverage)

### 1) Make the PoE + Decision Token + Receipt flow a **normative protocol**
Right now it’s a strong concept but not fully pinned down. Add:
- A sequence diagram with message formats and required checks at each hop (PDP → PEP → Tool → Proof Engine → Anchor).
- A formal verification checklist per record:
  - What the verifier *must* fetch (keys, revocation lists, bundle hash).
  - What *exactly* is signed (byte-level definition).
  - Replay handling and error modes.
- At least 2–3 **test vectors** (canonical JSON, hashes, signatures) so independent implementations can interoperate.

### 2) Tighten “trusted enforcement plane” vs “Zero Trust” and specify degradation under partial compromise
You correctly model an Enforcement-Plane Compromiser, but the architecture and proof sections still lean on a trusted plane assumption in ways that can confuse readers.
- Add an explicit table: **Security properties vs. compromised components** (PDP compromised, PEP compromised, Proof Engine compromised, KMS policy compromised, tool key compromised, telemetry compromised).
- Clarify whether T4’s “TEE-backed signer required” is *normative* or “recommended,” and what properties it restores.

### 3) Define compliance/interop profiles and minimum controlled surface **S** per tier
To prevent “VERA-washing,” define:
- A **minimum action surface S** for T3 and T4 (at least: all network egress, all tool invocations, all memory/RAG reads/writes, all delegation).
- Profiles like:
  - **VERA-T3-Min**: gateway-observed receipts allowed, anchoring cadence X, fail-closed required, minimum signals.
  - **VERA-T4-Strong**: tool-signed receipts for ≥Y% of actions, per-action anchoring or ≤5 min, TEE signer, strict revocation TTLs.
- Provide JSON Schema bundles for PoE/Receipt/DecisionToken so vendors can claim conformance meaningfully.

---

## Factual errors, contradictions, or misleading claims to flag

1) **Potential overclaim in the abstract:**  
   The phrase “cryptographic proof of execution” can be read as “cryptographic proof the tool executed correctly.” Your later text is more precise (PoE proves enforcement record integrity; receipts strengthen execution attestation). I recommend revising the abstract to say “cryptographic proof of enforcement and tamper-evident action recording,” and reserve “execution” for the receipt-backed path.

2) **Key management capability claims may be vendor-volatile / possibly incorrect as written:**  
   You state Ed25519 vs ECDSA-P256 depending on “cloud KMS/HSM where Ed25519 may not be available.” That’s directionally true, but you also imply specific provider support trajectories (e.g., “expected to add ML-DSA support by 2027”) and give cost numbers. For publication, either:
   - cite exact vendor docs/feature matrices (with dates), or  
   - move vendor capability statements into a non-normative appendix and emphasize “implementation-dependent.”

3) **Decision token schema ambiguity (“signature” field):**  
   `signature: string; // PDP's signing key (separate from PEP key)` reads like the signature *contains the key*. Minor, but misleading. It should read “signature generated by PDP signing key” and specify encoding/container (JWS/COSE).

4) **Enforcement completeness depends heavily on “constrained egress invariant,” but the paper risks implying completeness more generally:**  
   Your Definition 3 is careful, but several narrative passages read like a general guarantee. Recommend adding a prominent statement: **without default-deny egress + syscall/escape controls, completeness is not claimable**.

5) **OWASP mapping minor inconsistency:**  
   In §8 you reference “see 6.2” for residual risk, but bypass disclosure is in §7.2 (and memory poisoning earlier). This is editorial but should be corrected.

---

## Publication recommendation
The core architecture is solid and meaningfully advances implementable Zero Trust patterns for agentic systems. With the three improvements above—especially a normative protocol spec and tighter claims language—I would be comfortable approving this for publication as a reference architecture paper.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 7.5/10
**Greenlight:** ✅ YES
**Response time:** 140.8s

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

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 33.7s

---

# Red Team Review: VERA - Verifiable Enforcement for Runtime Agents

As Raven, principal adversarial security researcher specializing in breaking zero-trust implementations, I've dissected VERA with a focus on real-world exploitability. This paper is ambitious, well-structured, and refreshingly honest in places—rare for security papers. It operationalizes Zero Trust for agents via PDP/PEP, PoE chains, and evidence-based maturity, backed by open-source refs and empirical tests. Strengths include typed schemas, crypto-agile PoE/receipts, pluggable anchors, and a solid limitations section. It maps well to NIST 800-207 and OWASP Agentic Top 10.

However, VERA is no silver bullet. It excels at logging/enforcement *assuming* a pristine enforcement plane, but crumbles under insider/compromiser attacks (its own Class 5). Threat model is comprehensive but optimistic on trust boundaries. Defenses are deep for manipulators/evaders but shallow for escalators/insiders. Maturity model is gameable. Supply chain is checklist-y. Containment bounds damage but doesn't stop nation-states. Brutal truth: VERA is a *credible reference architecture for mid-tier enterprises* (e.g., T2-T3 agents in regulated fintech), but over-hyped as "zero trust" for high-stakes autonomous ops. It shifts risks to ops teams without solving alignment or BFT.

## Detailed Critique by Section

### Threat Model (Section 2)
Strong: 5-class model (Manipulator, Insider, Escalator, Evader, Compromiser) with capability matrix, A1-A4 assumptions, combined scenarios, and OWASP mapping. Covers prompt/RAG poisoning, supply chain, escalation, evasion—better than most agent papers. Assets/trust boundaries explicit.

Weaknesses:
- **Over-trusts enforcement plane**: Class 5 (Compromiser) admits residual risk from cloud admins/IAM, but mitigations (cosign, Kyverno, SPIFFE) are *deployment hygiene*, not architecture. Real attacks: Malicious OPA bundle injection via CI/CD (e.g., SolarWinds-style), sidecar escape via gVisor bugs, KMS key exfil via undiscovered vulns.
- **Misses vectors**: No model inversion/extraction (adversary extracts weights via timing side-channels), supply-chain timing attacks (e.g., just-in-time dependency swap), or quantum breaks (A1/A2 vulnerable; PQ path good but unproven).
- **Assumptions brittle**: A3 (KMS non-exfil) ignores cloud breaches (e.g., Capital One); A4 (honest anchor) fails if org controls all backends.
- **Score adjustment**: Covers 80-90% real vectors (e.g., GCG jailbreaks, RAG poisoning [Zou 2023]), but gaps in side-channels/quantum.

### Formal Security Properties (Section 3)
Excellent sketches (game-based reductions), honest on "proof sketches." Defs 1-4 crisp; A1'-A4 detailed. Crypto agility (ML-DSA) forward-thinking.

Weaknesses:
- **Non-repudiation ≠ execution proof**: Def1/Arg1 correct but narrow—PoE attests *enforcer saw action*, not tool did it correctly. Receipts help but degrade at lower assurance (honestly tabulated).
- **Completeness (Def3/Arg3)** conditional on "egress invariant"—if agent spawns rogue processes (e.g., Python subprocess), bypasses PEP. Kernel audit detects but post-facto.
- **Containment bound (Def4)** ignores async fanout (e.g., agent queues 1000 txns pre-breach).
- Game NR/TE/PC solid but ignore replays (nonce good, but nonce DB DoS?).

### Architecture/Pillars (Section 4)
PDP/PEP placement exemplary (sidecar/microVM/TEE). Deployment patterns practical (central vs. edge). Trust boundaries diagram clear. Action matrix comprehensive.

Weaknesses:
- **Pillar 1 (Identity)**: DID:web vuln to domain hijack (DNSSEC?); revocation lag (>60s bundle sync).
- **Pillar 2 (Behavioral Proof)**: PoE/receipts innovative (nonce-binding genius for replays), JCS canonical good. But `resultHash` on *redacted* output leaks nothing useful; parameter min weak vs. encoded attacks. Anchors pluggable but Solana congestion = DoS. SWDB anomaly: GMM evadable via gradient descent mimicry (Carlini 2017-style).
- **Pillar 3 (Data Sovereignty)**: ConvoGuard empiricals good (14ms), but admits multi-turn bypasses. RAG ACLs/source scoring solid but slow poisoning wins.
- **Pillar 4 (Segmentation)**: Rego examples crisp; param auth granular. But PDP input lacks provenance (e.g., taint from poisoned RAG?).
- **Pillar 5 (Incident)**: Multi-stage SLA realistic (<10s in-flight). Multi-source signals smart vs. Evader.

Deployment: Sidecar TEE for T4 good, but SEV-SNP vulns exist (e.g., Load Value Injection).

### Maturity Runtime (Section 5)
Evidence portfolios > calendar—huge win. Tiers intuitive; demotion triggers strong.

Weaknesses: Human approvals (risk committee) = social engineering. Test suites poisonable (agent trains on eval data via RAG leak). Override = backdoor.

### Supply Chain (Section 6)
SBOM + signed manifests baseline. Model cards good.

Weaknesses: Training provenance "minimum viable" = weak (no data lineage graph). Zero-days (e.g., numpy backdoor) unmitigated. No reproducible builds (SLSA L3?).

### Implementation/Empiricals (Section 7)
12 OSS services + 25 tests credible. 90.2% block rate honest (discloses 4 bypasses, fixes in pipeline). Latency realistic.

Weaknesses: Small scale (<50 agents); adversarial suite (41 vecs) narrow vs. real red teams (e.g., no LLM-specific PKE).

### Limitations (Section 10)
*Best-in-class honesty*: Scalability, perf, non-determinism, multi-agent, PQ, tool compromise—all flagged. Cost table pragmatic. Phased adoption smart.

Minor gripe: Downplays tool key risks slightly (historical receipts invalid post-compromise).

### Other
- OWASP mapping thorough.
- Related work exhaustive.
- No hype overload.

## Scores

1. **THREAT MODEL COVERAGE**: 8/10  
   Comprehensive 5-class matrix covers 90% vectors (injection, poisoning, evasion), scenarios realistic. Misses side-channels, quantum, rogue subprocesses; Class 5 under-mitigated.

2. **DEFENSE DEPTH**: 7/10  
   PDP/PEP + PoE/receipts effective vs. manipulators/evaders (90% block rate). Weaker vs. insiders (trust enforcement plane), async bypasses, multi-turn attacks.

3. **MATURITY MODEL RESISTANCE**: 7/10  
   Evidence > time; portfolios verifiable. Gameable via poisoned tests/colluding approvers/overrides.

4. **SUPPLY CHAIN**: 6/10  
   Addresses SBOM/manifests, but shallow on training data/zero-days/repro builds. "Signed deps" doesn't stop Log4Shell equivs.

5. **CONTAINMENT**: 6/10  
   Multi-stage/multi-source good; bounds damage. Fails determined Compromiser (enforcement plane hit); in-flight async leaks.

6. **HONESTY**: 9/10  
   Exceptional—discloses bypasses, assurance levels, limitations (scale/PQ/tools). Minor: "Verifiable enforcement" qualified but abstract overstates.

**OVERALL SECURITY VALUE**: 7/10  
   High value as reference impl (beats frameworks like MAESTRO). Credible for T1-T3; risky for T4 without hardening. Adds real enforcement depth to agent sec.

**GREENLIGHT**: YES  
   Security architecture credible for enterprise adoption with caveats (e.g., TEE enforcement, tool receipts ≥70%). Deploy Phase 1-2 today; extend for swarms.

## TOP 3 Attack Vectors to Address/Strengthen
1. **Enforcement Plane Compromise (Class 5 expansion)**: CI/CD image swaps, KMS IAM escalation, sidecar escapes. Strengthen: Mandate SLSA L3+, runtime IRM (e.g., Falco eBPF), quorum PDP.
2. **Tool Receipt Compromise**: Malicious tools sign false receipts. Strengthen: Multi-tool correlation, anomaly on receipt distros, tool key HSM + rotation audits.
3. **Sophisticated Evasion (Multi-turn/Gradient Mimicry)**: GMM-boiling-frog drifts, encoded homoglyph chains. Strengthen: Context-window analysis in ConvoGuard, adversarial training refresh.

## Flagged Aspirational Claims
- **"Cryptographic proof over policy assertions"**: Achievable for *enforcement records* (PoE), but "end-to-end verifiable enforcement" only at tool-signed (≤70% actions); often audit trail.
- **"Non-repudiation of action"**: Def1 accurate, but agent signerType='agent' weakens it (admitted); T4 MUST enforcer/dual.
- **"Evidence-based trust" immune to gaming**: Aspirational—portfolios rely on honest signers/datasets; needs BFT approvers.
- **PQ migration timeline (2035 complete)**: Optimistic; assumes KMS/vendor support (unproven 2026).
- **90.2% block rate → production ready**: Lab-only; real adaptive red teams hit 20-30% bypass (per lit).

Constructive path forward: Fork the repo, add eBPF syscall PEP, BFT for T4 promotions, Chaos Monkey for enforcement plane. Solid foundation—iterate brutally.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 104.5s

---

## Expert Review: VERA Paper from CISO Perspective

**Overall Assessment:** This is a technically rigorous, exceptionally well-structured paper that directly addresses the "enforcement gap" in AI agent security. It provides a concrete reference architecture with cryptographic guarantees that could significantly reduce compliance burden through verifiable evidence generation. However, it presents substantial operational complexity and makes strong assumptions about organizational readiness.

---

### **DIMENSION SCORES (1-10)**

1. **OPERATIONALIZABILITY: 6/10**  
   *Rationale:* The 12 open-source services and detailed schemas are valuable. However, implementing the full architecture requires deep cryptographic engineering, KMS integration, policy-as-code expertise, and likely a dedicated platform team. The "phased adoption" section acknowledges this, but moving from PoE logging to "tool-signed" receipts (which provide true non-repudiation) is a multi-quarter effort. The dependency on SPIFFE/SVID, OPA, and attestation mechanisms assumes significant existing platform maturity.

2. **COMPLIANCE HONESTY: 9/10**  
   *Rationale:* This is a standout strength. Section 9 ("Honest Assessment") explicitly states that VERA does not automatically confer compliance and warns against frameworks claiming EU AI Act compliance for agents. The mapping is cautious and realistic. The limitations section (10.3) clearly distinguishes between "audit trail" and "execution proof"—a critical nuance often glossed over by vendors.

3. **COST AWARENESS: 8/10**  
   *Rationale:* Section 10.9 provides concrete cost estimates (KMS operations, storage, personnel). The 8-12 week initial deployment timeline for a platform team is realistic. It acknowledges that PQ migration and scaling beyond 1,000 agents are unvalidated. Missing: ongoing compliance audit costs for verifying PoE chains and the legal review burden of evidence portfolios.

4. **VENDOR NEUTRALITY: 10/10**  
   *Rationale:* The paper is architecture-first, with multiple implementation options (KMS providers, anchor backends, PDP patterns). References to AWS/GCP/Azure are illustrative, not prescriptive. The open-source reference implementation reinforces neutrality.

5. **REGULATORY REALISM: 8/10**  
   *Rationale:* Handles SOX (audit trail), DORA (incident response timelines), and GDPR (data minimization) implications thoughtfully. The EU AI Act caveat is correct and conservative. However, it does not address sectoral regulations like PSD2 strong customer authentication or MiFID II record-keeping specifics for financial agents—these would require extension.

6. **BOARD READINESS: 7/10**  
   *Rationale:* The executive summary is clear, and the threat model/adversary classes are board-friendly. The maturity runtime (earning trust through proof) is a compelling narrative. However, the cryptographic details (A1-A4 assumptions, post-quantum migration) would need heavy simplification. The "residual risk" tables are excellent for board-level risk acceptance.

7. **PRACTICAL VALUE: 8/10**  
   *Rationale:* Would protect the organization by moving from subjective "trust" to evidence-based verification. The Tool Execution Receipt concept closes a critical gap between logging and true non-repudiation. The memory/RAG governance addresses a real, under-managed attack surface. The 90.2% block rate against adversarial tests is strong empirical validation.

---

### **OVERALL SCORE: 8/10**

This paper provides substantial value. It is not a product pitch but a genuine architectural blueprint. The honesty about limitations (10.3-10.10) increases credibility. For a regulated financial services CISO, the ability to generate cryptographically verifiable proof of policy enforcement is a game-changer for audit and oversight.

---

### **GREENLIGHT: YES**

**Justification:** The paper merits publication. It advances the state of practice by providing an enforceable, verifiable layer missing from current governance frameworks. Its open-source foundation, honest compliance mapping, and explicit trust assumptions set a high standard for the field.

---

### **TOP 3 IMPROVEMENTS NEEDED (CISO PERSPECTIVE)**

1. **Financial Services Regulatory Specificity**  
   *Issue:* While SOX/DORA are mentioned, the paper lacks concrete mappings to financial operational resilience (e.g., how PoE chains satisfy DORA Article 16 logging requirements, or how "compensating transactions" align with payment reversal mandates).  
   *Recommendation:* Add an appendix with explicit mappings to financial regulations: PSD2 (SCA exemptions for automated agents), MiFID II (record-keeping), and Basel III operational risk capital implications. Provide a sample "Regulatory Evidence Pack" showing how PoE chains + tool receipts satisfy specific supervisory requirements.

2. **Incident Response Integration with Existing SOC**  
   *Issue:* Section 4.5 describes multi-stage containment but assumes a dedicated "Agent Incident Response" team. In reality, this must integrate with existing SOC playbooks, SIEM, and case management.  
   *Recommendation:* Add a section on SOC integration: (a) PoE alert formats for Splunk/Elastic, (b) SOAR playbooks for agent containment (revocation → isolation → freeze), (c) forensic evidence collection from PoE chains for regulatory reporting, (d) communication protocols for when automated containment triggers (who is notified, escalation matrix).

3. **Third-Party and Cloud Provider Risk Management**  
   *Issue:* The paper assumes control over the entire stack (PEP/PDP, KMS, anchors). In financial services, agents will interact with external market data providers, payment gateways, and SaaS tools where "tool-signed receipts" are impossible.  
   *Recommendation:* Expand the "gateway-observed" receipt pattern into a full third-party risk management framework: (a) contractual requirements for receipt signing by critical vendors, (b) compensating controls for unsigned third parties (e.g., dual-authorization before agent actions, insurance coverage), (c) attestation of cloud provider KMS integrity (shared responsibility model), and (d) legal review of PoE as evidence in cross-jurisdictional disputes.

---

### **ADDITIONAL CISOs CONSIDERATIONS**

- **Internal Audit Buy-in:** The evidence portfolios (Section 5.2) are powerful but require audit team training on cryptographic verification. Propose a joint pilot with internal audit to validate the approach.
- **Vendor Selection Criteria:** While the paper is vendor-neutral, use it to evaluate commercial AI security vendors. Ask: "Do you provide Tool Execution Receipts? What is your receipt assurance level? How do you handle KMS key isolation per A3?"
- **Staggered Rollout Plan:** Start with "Observer" tier agents in non-critical functions (internal data analysis). Use the PoE chain for audit trail only initially. Gradually introduce policy enforcement and tool receipts as operational maturity grows.
- **Regulatory Engagement:** Share this architecture with regulators during pre-implementation consultations. Frame it as "verifiable oversight" rather than "perfect security." The explicit residual risks (Tables in 2.3, 8) demonstrate mature risk management.

**Final Note:** This paper provides the architectural rigor missing from most AI security discussions. Its greatest contribution is shifting the conversation from "we have policies" to "we can prove enforcement occurred." For a financial CISO under SOX/DORA pressure, that shift is invaluable.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 92.5s

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

════════════════════════════════════════════════════════════════════════════════
