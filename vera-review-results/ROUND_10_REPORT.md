# VERA Paper — Expert Review Round 10

**Date:** 2026-02-10T13:11:26.413Z
**Average Score:** 5.9/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 0/10
**Greenlight:** ❌ NO
**Response time:** 85.8s

---

## Publication-quality review (Round 10): VERA — *Verifiable Enforcement for Runtime Agents*

### Executive assessment
VERA is one of the more complete attempts I’ve seen to adapt **NIST SP 800-207** to **agentic, tool-chaining, non-deterministic** systems *and* to close the “governance vs. runtime enforcement” gap with implementable mechanisms. The paper’s strongest contributions are:

- Concrete **PDP/PEP placement** for agent action surfaces (tool, egress, storage, memory/RAG, delegation)
- A well-motivated shift from “signed logs” to **end-to-end verifiable enforcement** via **Tool Execution Receipts** with nonce-binding
- A credible, engineering-oriented **trust tier runtime** tied to evidence portfolios (promotion/demotion)
- Typed schemas and canonicalization (JCS/RFC 8785) that move the work closer to interoperability than typical “framework papers”

That said, there are several **trust-model inconsistencies**, some **overstated claims**, and a few **likely factual inaccuracies** (notably around cloud KMS/HSM algorithm support and anchoring finality/latency). The threat model is good but not yet “formal” in the way your abstract claims, and some security properties are stated with assumptions that need to be tightened (especially around the trusted computing base and what constitutes “completeness”).

---

## Scores (1–10)

1) **ARCHITECTURAL COMPLETENESS:** **8/10**  
Clear PDP/PEP placement, action mediation, decision caching/fail modes, telemetry feedback into PDP, and two deployable patterns. Gaps remain around: formal continuous evaluation loop semantics, PDP decision authenticity, and explicit TCB minimization.

2) **THREAT MODEL RIGOR:** **7/10**  
Good adversary classes + capability matrix and scenario composition. However, “formal threat model” is overstated: boundaries are sometimes contradictory, key adversaries are missing (compromised tool/service, compromised identity issuer, compromised model provider), and the structure isn’t aligned to a standard methodology (STRIDE/LINDDUN/ATT&CK) or expressed as a formal system model.

3) **NOVELTY:** **8/10**  
Receipts + nonce-binding as an enforcement-verification bridge is genuinely novel in this space (and materially beyond typical 800-207 restatements). The maturity runtime + memory governance enforcement is also strong. Some parts are “best-practice packaging,” but the combination is additive.

4) **FORMAL DEFINITIONS:** **7/10**  
The TypeScript schemas + JCS canonicalization are implementable, but several critical protocol edges are underspecified (state machines, error handling, replay windows under partition, multi-PDP behavior, key discovery, signed decision records, and registry trust). The “formal properties” are closer to well-written proof sketches than implementable formal specs.

5) **PRACTICAL VALUE:** **9/10**  
This is highly actionable for engineering teams: concrete enforcement points, fail behaviors, performance numbers, and migration tiers. Tool-signed receipts will be hard in SaaS-heavy environments, but you correctly degrade assurance levels.

**OVERALL SCORE:** **8/10**

**GREENLIGHT:** **NO** (approve after targeted revisions; the issues are fixable and mostly clarity/rigor/factual-tightening)

---

## Detailed dimension-by-dimension commentary

### 1) Architectural completeness (what’s strong, what’s missing)
**Strong:**
- You correctly anchor enforcement around **“agent actions” crossing trust boundaries**, which is the only tractable enforcement point for LLM agents.
- You explicitly separate **agent runtime (semi-trusted)** from **enforcement plane**, and you forbid in-process policy libraries for higher assurance.
- You include *both* **central PDP** and **sidecar PDP** patterns with latency, staleness, and fail behavior—this maps well to real enterprise constraints.
- You introduce an explicit **assurance ladder** (tool-signed → gateway-observed → log-correlated), which prevents the common “we have logs therefore we’re secure” fallacy.

**Missing / needs tightening:**
- **PDP decision authenticity & binding:** You log `pdpDecisionId` and `policyBundleHash`, but you do not require the **PDP to sign the decision** (or otherwise provide an unforgeable decision token) that the PEP can later present for independent verification. Right now, a compromised PEP (or log writer) can fabricate “decision provenance” fields unless you cryptographically bind them.
- **Continuous access evaluation semantics:** NIST 800-207 emphasizes continuous evaluation (CDM + policy updates). You describe telemetry → anomaly detector → PDP, but you should define:
  - What triggers a *re-evaluation* (every action? per TTL? per signal change?)
  - How cached decisions are invalidated (revocation push, signal thresholds, bundle updates)
  - What happens during partitions (e.g., policy update unavailable but signals indicate risk)
- **TCB minimization:** You “trust the enforcement plane,” but then model an adversary that compromises it (Class 5). That’s fine, but you need a clearer **TCB statement**: what must be trusted for which guarantees, and which guarantees degrade under partial compromise (PDP vs PEP vs Proof Engine vs KMS vs log).

### 2) Threat model rigor
**Strong:**
- Capability matrix is a good start; the combined scenarios are useful.
- You explicitly call out anchor honesty (A4) and KMS controls (A3) and treat enforcement-plane compromise as a first-class adversary.

**Major gaps to address if you want to keep calling it “formal”:**
- **Compromised tool/service is not fully modeled.** You discuss it in Limitations (10.7), but it should be an adversary class with capabilities (sign fraudulent receipts, replay nonces, selective execution, equivocation).
- **Identity/credential issuer compromise** is absent. If DID:web hosting, VC issuer keys, SPIRE CA, or workload identity control plane is compromised, many guarantees collapse. That needs explicit modeling and mitigations (HSM-backed issuer keys, CT-style publication, key transparency, revocation propagation SLOs).
- **Model/provider-level adversary** (hosted model endpoint, model update channel, or “weights supplier”) is treated partly as “Insider,” but the trust boundary implications differ materially when weights and inference come from a third party.
- Consider adding a lightweight formalism: e.g., define principals, channels, trusted components, and Dolev–Yao network adversary scope; then map each property to the minimal required trust set.

### 3) Novelty
The receipts mechanism plus assurance stratification is the standout. It’s conceptually adjacent to SCITT/in-toto, but applying it **at runtime for agent actions** (and binding it to PDP/PEP decisions) is a real advance.

One caution: some claims are too absolute (see “factual/misleading” section). Dial those back and cite concrete comparative work.

### 4) Formal definitions / implementability
You’re close, but a publication-grade “reference architecture” needs a few more hard edges:

- **Protocol state machines** for:
  - nonce issuance/consumption under retries, partitions, and concurrency
  - decision caching TTL + invalidation rules
  - anchoring queues and “maximum rewrite window” semantics
- **Key discovery and registries:** you reference “PEP registry” and “tool registered identity,” but you don’t define:
  - registry trust anchors
  - update/auth rules (who can register tools?)
  - revocation and rotation semantics
- **Canonicalization scope:** You specify JCS for PoE, good. But you should also specify canonicalization for:
  - requestHash / receipt binding
  - parameter minimization rules (prefer normative tool schemas over prose)

### 5) Practical value
High. The paper gives teams something they can actually build, and it’s aligned with operational realities (latency budgets, fail-open windows for low-tier agents, explicit residual risk statements).

The two practical friction points you should address more explicitly:
- **SaaS tools won’t sign receipts** → your “gateway-observed” path is realistic, but you should state which guarantees remain meaningful and which become “best-effort.”
- **Policy authoring burden** at tool-parameter granularity → consider including a short section on policy generation patterns (templates, typed capability manifests → Rego compilation, or constraint DSL).

---

## Top 3 specific improvements needed (highest ROI)

1) **Cryptographically bind PDP decisions to PEP authorization and PoE (signed decision tokens).**  
   Add a normative requirement that PDP emits a signed “Decision Token” containing at least: `(agentDid, actionId, toolId/target, requestHash, obligations, expiry, policyBundleHash, pdpInstanceId)` and the PEP includes its hash in PoE and forwards it to the tool (directly or indirectly). This closes a major verification gap.

2) **Fix the trust model contradictions by explicitly defining the TCB per property and adding at least one new adversary class: “Compromised Tool / Receipt Signer.”**  
   Then update Definitions 1–3 to state *exactly* which guarantees hold under (a) compromised agent runtime, (b) compromised PEP, (c) compromised PDP, (d) compromised tool signer, (e) compromised anchor/log admin.

3) **Correct/qualify ecosystem claims (KMS/HSM algorithm support, blockchain anchoring “strongest,” anchoring latency/finality) and reduce absolutes.**  
   Publication-quality work must be precise here; these details materially affect deployability and security claims.

---

## Factual errors, contradictions, or potentially misleading claims to flag

### A) Cloud KMS/HSM algorithm support (likely inaccurate / too specific)
You state (A1) that as of Feb 2026:
- “AWS CloudHSM supports Ed25519; AWS KMS does not”
- “GCP Cloud KMS supports Ed25519”
- “Azure Key Vault does not”

These statements are **high-risk** because provider capabilities change frequently and differ between “KMS,” “HSM,” “Managed HSM,” and “BYOK/HYOK.” Unless you have citations or a reproducible compatibility matrix, this will be challenged. Recommend: move this to an appendix with **versioned citations** (provider docs snapshots) and phrase as “at time of writing, per vendor documentation …”.

### B) “Blockchain anchoring provides the strongest tamper-evidence guarantee”
This is **overstated**. Public chains differ in:
- reorg/finality behavior
- liveness (outages)
- validator centralization
- client verification assumptions
- cost volatility

Also Solana “~400ms confirmation” is not the same as *finality* for evidentiary purposes. If you keep blockchain anchoring, define:
- what you mean by “confirmation” (1 block? optimistic? finalized?)
- the evidentiary standard (e.g., X confirmations / finalized commitment)
- how verifiers validate inclusion proofs and handle chain halts

### C) Trust boundary contradiction: “Storage Plane is trusted” vs adversary Class 5
Section 2.1 says Storage Plane (KMS, logs, anchors) is trusted. Later, Class 5 includes forging PoE records and suppressing anchoring, and 4.2.2 notes internal logs are not tamper-evident against admins.

This is resolvable, but you must rewrite the trust statement as:
- KMS is trusted *for key non-exfiltration* under A3
- logs are *not trusted for integrity without A4 anchoring*
- anchors assume at least one honest backend (A4)

### D) “Formal threat model” and “formal security properties”
What you provide are **good structured definitions and proof sketches**, but “formal” will be interpreted by reviewers as mechanized proofs or at least a formally defined system model with explicit adversary interaction. Consider rephrasing to:
- “structured threat model”
- “formally stated properties with proof sketches”

### E) Minor technical precision notes
- Your Chain Tamper-Evidence argument uses collision resistance; in practice, **second-preimage resistance** is often the tighter property for “replace this record with a different one of same hash.” Collision resistance is stronger than needed, so you’re safe, but reviewers may nitpick the exact reduction.
- `resultHash` being over a redacted result is fine, but you should explicitly address the audit implication: independent verifiers cannot reconstruct the raw result, so they can only verify consistency *within the redaction policy*.

---

## Recommendation on publishability
This is close to publishable as a reference architecture paper, but I would not approve *as-is* because the current draft contains (1) trust-model inconsistencies, (2) missing cryptographic binding of PDP decisions, and (3) several ecosystem claims that are likely to be fact-checked and challenged.

If you address the Top 3 improvements above, this becomes a strong GREENLIGHT.

---

## GREENLIGHT: NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 6.5/10
**Greenlight:** ✅ YES
**Response time:** 156.8s

---

# IEEE S&P Industry Track Review: VERA

**Reviewer:** Professor Marcus Chen, ETH Zurich

---

## OVERALL ASSESSMENT

This paper presents a comprehensive reference architecture for AI agent security enforcement. The work demonstrates significant engineering depth, practical deployment experience, and addresses a real gap in current frameworks. However, it suffers from scope overreach, inconsistent formalization, and tone misalignment with academic security venues.

**SCORES (1-10 scale):**

1. **CONTRIBUTION: 7/10**
2. **RELATED WORK: 8/10**
3. **THREAT MODEL: 6/10**
4. **FORMALIZATION: 5/10**
5. **EVALUATION: 6/10**
6. **WRITING QUALITY: 6/10**
7. **LIMITATIONS: 8/10**

**OVERALL: 6.5/10**

**VERDICT: Weak Accept**

**GREENLIGHT: YES** (with major revisions required)

---

## DETAILED ASSESSMENT

### 1. CONTRIBUTION (7/10)

**Strengths:**
- **Clear gap identification:** The "enforcement gap" between governance frameworks and runtime implementation is well-articulated and genuine. The comparative framework analysis (Table 1.2) effectively demonstrates what existing approaches lack.
- **Novel architectural elements:** Tool Execution Receipts with nonce-binding (§4.2.1a) represent a genuine contribution beyond existing work. The binding chain (PDP decision → PEP authorization → tool execution) addresses verifiability in a way that signed logging alone does not.
- **Evidence-based maturity:** Replacing calendar-based trust progression with cryptographic proof portfolios (§5) is conceptually sound and addresses a real weakness in current practices.
- **Practical deployment:** 12 deployed services with empirical results provide credibility that purely theoretical work lacks.

**Weaknesses:**
- **Incremental vs. transformative:** While the integration is valuable, individual components (DID-based identity, OPA policy enforcement, tamper-evident logging, anomaly detection) are not novel. The contribution is primarily *architectural integration* rather than fundamental innovation.
- **Scope creep:** The paper attempts to address too many problems simultaneously (identity, behavioral proof, data governance, segmentation, incident response, supply chain, multi-agent coordination, post-quantum migration). This dilutes focus and prevents deep treatment of any single area.
- **Missing comparative implementation:** The paper claims existing frameworks "do not fully define" enforcement architecture, but does not implement those frameworks for direct comparison. A head-to-head evaluation (e.g., VERA vs. MAESTRO + custom enforcement layer) would strengthen the contribution claim.

**Specific concern:** The abstract states "cryptographic proof over policy assertions" but the PoE mechanism provides *non-repudiation of enforcement records*, not proof of correct execution (acknowledged in §10.3). This distinction must be clarified upfront to avoid overselling.

**Recommendation:** Narrow scope to 3-4 core pillars (Identity, Behavioral Proof, Tool Authorization, Evidence-Based Maturity). Move supply chain, multi-agent BFT, and PQ migration to "Future Work." This would allow deeper formalization of the core contributions.

---

### 2. RELATED WORK (8/10)

**Strengths:**
- **Comprehensive coverage:** Section 11 demonstrates excellent awareness of relevant standards (NIST, OWASP), academic work (runtime verification, TEEs, BFT), and industry practice (Guardrails AI, SLSA, Sigstore).
- **Honest differentiation:** The paper clearly states where VERA complements vs. replaces existing work. Example: "VERA provides the enforcement layer that operationalizes risks identified through MAESTRO" (§11).
- **Cross-domain synthesis:** Connecting capability-based security (Dennis & Van Horn, 1966) to modern agent authorization is intellectually sound and well-executed.

**Weaknesses:**
- **Placement:** Related work appears in Section 11, after the full specification. For an academic venue, related work should appear in Section 2-3 to contextualize contributions early.
- **Missing comparisons:** While the paper cites AgentGuard, Zero-Trust Identity for Agentic AI, and Zero-Trust Capability Grants, it does not provide detailed technical comparison. A table showing architectural differences (centralized vs. distributed PDP, enforcement mechanism, verification method) would clarify positioning.
- **Industry product gap:** The paper mentions "some agent-security products define partial enforcement points (e.g., gateway proxies, sandboxed runtimes)" but does not name or compare against commercial offerings (e.g., LangChain Enterprise Security, Anthropic's Constitutional AI enforcement). This creates an incomplete competitive landscape.

**Recommendation:** Move related work to Section 2. Add a detailed comparison table for the 3-4 most closely related academic systems (AgentGuard, Zero-Trust Identity, Zero-Trust Capability Grants). Acknowledge commercial products even if detailed comparison is not possible.

---

### 3. THREAT MODEL (6/10)

**Strengths:**
- **Structured adversary classes:** Five adversary classes with explicit capability matrices (Table 2.2) provide clarity beyond typical "insider/outsider" dichotomies.
- **OWASP mapping:** Section 8's mapping to OWASP Top 10 for Agentic Applications demonstrates practical grounding.
- **Combined attack scenarios:** Table 2.3 shows realistic multi-adversary compositions (e.g., poisoned RAG + prompt injection).

**Weaknesses:**
- **Informal presentation:** The threat model lacks formal structure expected in a security venue. Compare to Dolev-Yao models or UC framework presentations. Capabilities are described in prose rather than formal predicates.
- **Assumption clarity:** Assumptions A1-A4 are stated, but their interactions and failure modes are underspecified. Example: What happens if A4 (anchor integrity) fails but A1-A3 hold? The paper states "an adversary with log write access could theoretically rewrite unanchored chain entries" but does not formalize the security degradation.
- **Threat coverage gaps:** The paper acknowledges but does not address:
  - **Side-channel attacks:** Timing, power, EM side-channels on PEP/PDP enforcement decisions
  - **Covert channels:** Agent-to-agent communication via timing, resource consumption, or shared state
  - **Social engineering:** Adversary manipulating human approvers in the evidence portfolio review process (mentioned as "residual" but not modeled)
  
**Specific issue:** Adversary Class 5 (Enforcement-Plane Compromiser) is critical but underspecified. The paper states "residual: compromiser with cloud admin access can modify IAM policies" but does not provide a formal security reduction showing what properties survive this compromise. If the enforcement plane is the trusted base, its compromise invalidates all guarantees—this needs explicit treatment.

**Recommendation:** 
1. Formalize adversary capabilities as predicates: `CanModifyCode(A) ⇒ Insider(A)`, etc.
2. Provide a formal game-based definition for each adversary class (similar to Security Arguments 1-2 but for threat modeling)
3. Add a "Assumptions Failure Analysis" table showing which properties hold/fail under each assumption violation

---

### 4. FORMALIZATION (5/10)

**Strengths:**
- **Property definitions:** Definitions 1-4 (Non-Repudiation, Chain Tamper-Evidence, Policy Enforcement Completeness, Containment Bound) are clearly stated.
- **Cryptographic rigor:** Assumptions A1-A2 reference standard cryptographic definitions (EU-CMA, collision resistance).
- **Security arguments:** Arguments 1-2 provide structured reasoning with explicit reductions to cryptographic assumptions.

**Weaknesses:**
- **Incomplete formalization:** Security Arguments are "proof sketches" (acknowledged in §3.3) rather than full proofs. For IEEE S&P, even industry track, more rigor is expected. The paper should either:
  - Provide full proofs in an appendix, OR
  - State clearly that formal verification is future work and provide only informal arguments
  
- **Definition gaps:**
  - **Definition 1 (Non-Repudiation):** Does not specify what "canonical(a)" means. Is it JCS-canonicalized JSON (mentioned in §4.2.1)? This should be stated in the definition.
  - **Definition 3 (Policy Enforcement Completeness):** The phrase "with respect to the controlled action surface S" is crucial but S is defined informally ("the set of action types mediated by PEPs"). What about actions *not* in S? The definition should explicitly state completeness is *conditional* on S covering all security-relevant actions.
  - **Definition 4 (Containment Bound):** Assumes synchronous enforcement. The disclaimer about in-flight async operations is buried in the definition text. This should be a separate "Assumption A5" or a formal caveat in the definition.

- **Missing formalisms:**
  - No formal specification of the PDP policy language semantics (OPA/Rego is mentioned but not formalized)
  - No formal state machine for trust tier transitions (promotion/demotion)
  - No formal definition of "evidence portfolio validity"

**Specific concern:** Security Argument 3 (Policy Enforcement Completeness) relies on "constrained egress invariant" which is an *operational* property, not a cryptographic one. The argument states "bypass requires container escape, which is detectable via kernel-level audit" but does not formalize detectability or provide guarantees about detection latency. This weakens the argument significantly.

**Recommendation:**
1. Move Security Arguments to an appendix and expand them to full proofs (or acknowledge they are informal)
2. Add formal syntax/semantics for the PDP policy language (even a simplified subset)
3. Provide a formal state machine for trust tier transitions with invariants
4. Clearly label which properties are cryptographically guaranteed vs. operationally enforced

---

### 5. EVALUATION (6/10)

**Strengths:**
- **Real deployment data:** Empirical results from 12 deployed services (§7.1) provide valuable validation that lab-only systems lack.
- **Adversarial testing:** Agent-pentest results (§7.2) with 41 vectors across 7 categories demonstrate practical security validation. The 90.2% block rate is respectable.
- **Transparent disclosure:** The paper honestly reports 4 bypassed vectors with root cause analysis (§7.2). This is commendable and rare in security papers.
- **Performance metrics:** Latency measurements (14ms median for prompt injection detection, 3ms for PoE signing) are concrete and reproducible.

**Weaknesses:**
- **Limited scale validation:** The paper acknowledges testing at "individual agent deployments and small multi-agent configurations" (§10.1). Scalability projections (§10.10) are analytical, not empirical. For an industry track paper, larger-scale validation is expected.
- **No baseline comparison:** The paper does not compare VERA's performance/security against:
  - Existing frameworks (MAESTRO, AWS Scoping Matrix) implemented with custom enforcement
  - Commercial agent security products
  - "No enforcement" baseline (to quantify overhead)
  
- **Evaluation methodology gaps:**
  - **Adversarial test suite:** The agent-pentest vectors are not publicly specified. Without reproducible test cases, the 90.2% block rate cannot be independently verified.
  - **Dataset details:** PII detection is "tested on OntoNotes 5.0 + synthetic PII" but the synthetic PII generation method is not described. This affects reproducibility.
  - **Performance environment:** Latency measurements lack environment details (CPU model, memory, OS, containerization overhead). "single CPU core, batch=1" is insufficient for reproducibility.

- **Missing evaluations:**
  - **Usability:** No evaluation of policy authoring complexity, operator learning curve, or false positive impact on agent developers
  - **Cost analysis:** Section 10.9 provides cost estimates but no empirical validation from real deployments
  - **Security vs. performance tradeoff:** No evaluation of how enforcement overhead affects agent decision quality or task completion rates

**Specific concern:** The paper claims "25+ contract tests" pass (§7.1) but does not describe what these tests validate. Are they unit tests? Integration tests? Security-specific tests? Without test specifications, this metric is not meaningful.

**Recommendation:**
1. Provide detailed adversarial test suite specification (ideally open-source the agent-pentest tool)
2. Add baseline comparisons: VERA vs. no-enforcement, VERA vs. Guardrails AI + custom policy layer
3. Scale validation: deploy to 100+ agents and report empirical results vs. analytical projections
4. Add usability evaluation: developer survey, policy authoring time, false positive rates in production

---

### 6. WRITING QUALITY (6/10)

**Strengths:**
- **Clear structure:** The five-pillar organization (§4) provides a logical framework for the architecture.
- **Concrete examples:** TypeScript schemas, OPA/Rego policy snippets, and Mermaid diagrams make abstract concepts concrete.
- **Honest limitations:** Section 10 is exemplary in acknowledging what VERA does *not* solve.

**Weaknesses:**
- **Tone misalignment:** The paper reads like a technical whitepaper or engineering blog post, not an academic security paper. Examples:
  - "AI agents take real actions with real data at machine speed" (Abstract) — colloquial, not formal
  - "This is a solvable problem (Section 4.2.3), but it requires specification" (§1.1) — editorial commentary inappropriate for academic writing
  - "We do not claim VERA solves the alignment problem. We claim it makes misalignment detectable and containable" (§10.4) — defensive tone suggests a blog rebuttal, not academic discourse
  
- **Excessive length:** At 13 sections + 10 subsections of limitations, the paper is unfocused. IEEE S&P industry track typically expects 10-12 pages (double-column). This paper would exceed 20 pages in conference format.

- **Marketing language:** Phrases like "VERA is backed by reference implementations" (Abstract), "Running Code" (§7 title), and "Getting Started" (§12) are appropriate for a GitHub README, not a peer-reviewed paper.

- **Inconsistent formalism:** The paper oscillates between formal definitions (§3.2) and informal prose (§4). Example: Section 4.2.1a introduces Tool Execution Receipts with a TypeScript interface, then describes nonce lifecycle in normative prose. Either formalize throughout or acknowledge the specification is semi-formal.

**Specific issues:**
- **Abstract:** "The security community has responded with governance frameworks that specify what to document, what to log, and what to monitor. These frameworks provide valuable guidance but leave a critical gap..." — This reads as criticism of competitors rather than objective problem statement. Rephrase to focus on the technical gap, not framework inadequacy.
- **Section 1.1 title:** "Three Structural Gaps in Current Approaches" — sounds like a consulting report. Rename to "Motivation" or "Problem Statement."
- **Section 12:** "Getting Started" with installation instructions does not belong in an academic paper. Move to supplementary material or GitHub.

**Recommendation:**
1. Rewrite Abstract and Introduction in formal academic tone
2. Remove Sections 12 (Getting Started) and consolidate Sections 1.1, 1.2 into a single "Motivation" section
3. Reduce length by 30%: move detailed schemas to appendix, consolidate Pillars 3-5 into "Data and Access Governance"
4. Replace "we claim" language with objective statements: "VERA provides X" not "We do not claim VERA solves Y"

---

### 7. LIMITATIONS (8/10)

**Strengths:**
- **Comprehensive:** Section 10 covers 10 distinct limitation categories, demonstrating intellectual honesty rare in security papers.
- **Specific technical details:** Limitations are not vague ("future work needed") but concrete. Example: "Multi-turn indirect injection across 5+ turns evaded single-turn classifier" (§7.2).
- **Quantified tradeoffs:** Section 10.9 provides cost estimates; Section 10.10 provides scalability projections with explicit assumptions.

**Weaknesses:**
- **Buried critical limitations:** Some limitations are mentioned only in passing or in footnotes:
  - Cloud KMS trust assumption (A3) is critical but only discussed in a note. If cloud admin is compromised, all guarantees fail — this deserves prominent treatment.
  - Tool identity compromise (§10.7) is acknowledged but mitigation is weak ("cross-referencing receipts against independent observability signals" assumes those signals are available and trustworthy).
  
- **Missing limitations:**
  - **Regulatory compliance:** Section 9 disclaims compliance but does not address the limitation that VERA's enforcement model may conflict with certain regulations (e.g., GDPR right to explanation for automated decisions — how does PoE interact with explainability requirements?).
  - **Open-source security:** All 12 services are MIT-licensed. What are the security implications of open-source enforcement infrastructure? Adversaries can study the code to find bypasses.
  - **Operational complexity:** Section 10.9 estimates personnel cost but does not address the limitation that many organizations lack the expertise to deploy/maintain VERA.

**Specific concern:** Section 10.3 (PoE Integrity vs Execution Correctness) is critical but underemphasized. The paper's abstract and introduction emphasize "verifiable enforcement" but the limitation section reveals this is conditional on tool-signed receipts at `tool-signed` assurance. Many readers will assume "verifiable" means end-to-end correctness, not just signed logging. This gap should be stated upfront in the abstract.

**Recommendation:**
1. Move critical limitations (Cloud KMS trust, PoE vs. execution correctness) to Section 1 or 3
2. Add limitations: regulatory compliance conflicts, open-source security implications, operational expertise requirements
3. Create a "Threat Model Limitations" subsection explicitly stating which adversaries VERA does *not* defend against

---

## TOP 3 SPECIFIC IMPROVEMENTS NEEDED

### 1. **Formalization Rigor (CRITICAL)**

**Problem:** The paper presents "proof sketches" and informal security arguments where formal proofs are expected for a top-tier security venue.

**Required changes:**
- Provide full formal proofs for Security Arguments 1-3 in an appendix, OR clearly state upfront that formal verification is future work and present only informal reasoning
- Formalize the PDP policy language semantics (even a simplified subset of OPA/Rego)
- Add formal state machine for trust tier transitions with invariants and proof that demotion is irreversible without evidence portfolio
- Formalize "evidence portfolio validity" as a predicate with verification algorithm

**Justification:** IEEE S&P expects cryptographic rigor even in industry track. The current "proof sketches" are insufficient for claims like "Under assumptions A1 and A3, this proves that the enforcement plane authorized and recorded action a."

---

### 2. **Scope Reduction and Focus (CRITICAL)**

**Problem:** The paper attempts to solve too many problems (identity, behavioral proof, data governance, segmentation, incident response, supply chain, multi-agent coordination, post-quantum migration) and lacks depth in any single area.

**Required changes:**
- Reduce to 3-4 core pillars: Identity (§4.1), Behavioral Proof (§4.2), Tool Authorization (§4.4), Evidence-Based Maturity (§5)
- Move to "Future Work": Supply chain verification (§6), Multi-agent BFT (§10.5), Post-quantum migration (§10.6)
- Expand core pillars with deeper formalization, more extensive evaluation, and comparative analysis

**Justification:** A focused paper on "Verifiable Enforcement for AI Agent Tool Authorization" with formal proofs, extensive adversarial testing, and baseline comparisons would be a stronger contribution than a sprawling reference architecture.

---

### 3. **Evaluation Depth and Reproducibility (MAJOR)**

**Problem:** Empirical results lack baseline comparisons, reproducible test specifications, and large-scale validation.

**Required changes:**
- **Baseline comparison:** Implement VERA vs. no-enforcement, VERA vs. Guardrails AI + custom policy layer. Measure: latency overhead, security (adversarial test block rate), usability (policy authoring time)
- **Reproducible test suite:** Open-source the agent-pentest tool with full vector specifications, or provide detailed appendix with test case descriptions
- **Scale validation:** Deploy to 100+ agents (even in simulation) and report empirical results vs. analytical projections in §10.10
- **Performance environment:** Specify CPU model, memory, OS, containerization for all latency measurements

**Justification:** Without baseline comparisons and reproducible tests, the evaluation does not meet IEEE S&P standards. The paper's claims about enforcement effectiveness cannot be independently verified.

---

## MINOR ISSUES

1. **Section 4.0:** "Normative definition of 'agent action'" appears mid-architecture. Move to Section 2 (Threat Model) or 3 (Preliminaries).

2. **Table 4.0 (Action Coverage Matrix):** "Compare tool-side invocation logs vs PoE records" assumes tool logs are trustworthy. Add a column for "Trust assumption" to clarify.

3. **Section 4.2.1:** `resultHash` semantics are buried in a paragraph. Extract to a formal definition box for clarity.

4. **Section 5.2:** "Evaluation datasets are curated by the security team (not the agent's operators)" — this is a critical security property but presented as implementation detail. Formalize as "Assumption A5: Evaluation Dataset Integrity."

5. **Section 7.2:** "Bypassed vectors (transparent disclosure)" is excellent but should include CVE-style identifiers for tracking (e.g., VERA-2026-001: Unicode homoglyph injection).

6. **Section 11:** Related work cites arXiv preprints extensively (AgentGuard, Zero-Trust Identity, CP-WBFT, BlockAgents). For IEEE S&P, prefer peer-reviewed publications or clearly label preprints as "under review."

7. **References:** Missing page numbers for many citations (e.g., "Bernstein et al., 2012" for Ed25519 should cite the specific paper, not just the year).

---

## VERDICT JUSTIFICATION

**Why Weak Accept:**

This paper addresses a real and important problem (enforcement gap in AI agent security frameworks) with a well-engineered solution backed by real deployment experience. The contributions are valuable to practitioners, the limitations section is exemplary, and the related work demonstrates strong scholarship.

However, the paper suffers from:
- **Scope overreach** that prevents deep treatment of core contributions
- **Formalization gaps** that weaken security claims
- **Evaluation limitations** (no baselines, limited scale, non-reproducible tests)
- **Tone misalignment** with academic security venues

**Why not Reject:** The core ideas (Tool Execution Receipts, evidence-based maturity, enforcement architecture) are sound and novel enough to merit publication. The deployment experience and honest limitations add significant value.

**Why not Accept:** The paper needs major revisions to meet IEEE S&P standards. The formalization must be strengthened, scope must be reduced, and evaluation must include baselines and reproducible tests.

**Conditional acceptance path:**
1. Address the three critical improvements (formalization, scope reduction, evaluation depth)
2. Rewrite in academic tone (remove marketing language, installation instructions)
3. Reduce length by 30% (move schemas/details to appendix)
4. Add formal threat model with predicate-based adversary capabilities

With these revisions, this would be a strong Accept for IEEE S&P industry track.

---

## GREENLIGHT: YES

**Rationale:** Despite significant weaknesses, the paper makes a genuine contribution to an important problem, demonstrates real-world deployment, and provides unusual transparency about limitations. The required revisions are substantial but achievable. The core technical content is sound.

**Recommendation to authors:** Focus the revision on formalizing the core enforcement architecture (Pillars 1, 2, 4, 5) with rigorous proofs, baseline comparisons, and reproducible evaluation. Move peripheral content (supply chain, multi-agent, PQ migration) to a separate "extended architecture" paper. The current paper tries to be both a research contribution and a reference manual — choose one.

**Recommendation to program committee:** Accept conditionally pending major revision. Assign a shepherd to ensure formalization rigor and evaluation depth improvements are implemented. This paper could be a landmark contribution to agent security if properly focused and formalized.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 26.2s

---

# Red Team Review: VERA - Verifiable Enforcement for Runtime Agents

As Raven, principal adversarial security researcher specializing in breaking zero trust implementations, I've dissected VERA with a focus on real-world exploitability. This paper is ambitious, well-structured, and unusually honest for an AI security framework—rare in a field bloated with vaporware. It operationalizes NIST ZTA for agents via PDP/PEP, PoE chains, and receipts, with open-source refs and formal sketches. Strengths: typed schemas, crypto agility, pluggable anchors, evidence-based tiers over calendar BS. It maps OWASP Top 10 thoughtfully and admits gaps (e.g., no execution correctness, tool compromise risks).

However, it's no silver bullet. VERA shines as an *audit layer* (tamper-evident logging + policy mediation) but weakens on *prevention* against adaptive adversaries. Enforcement assumes perfect PEP coverage (hard in messy agent runtimes), receipts degrade to "log-correlated" quickly, and maturity gaming remains feasible via insider collusion. Empirical results (90.2% block rate on 41 vectors) are transparent but expose gaps like multi-turn injections. Scalability unproven beyond small clusters.

Brutal critique below, scored per dimensions. Scores reflect *practical resistance* to red-team attacks I've seen (or simulated) in agent deployments.

## Dimension Scores

1. **THREAT MODEL COVERAGE: 8/10**  
   The 5-class model (Manipulator → Compromiser) is solid—better than most "frameworks" with vague personas. Capability matrices are granular (e.g., Evader's telemetry injection), combined scenarios realistic (RAG poison + injection), OWASP mappings explicit. Covers prompt/RAG poisoning, supply chain, escalation, evasion well. Gaps: (a) Shallow on *model weight poisoning* (Insider "possible" modify, but no runtime model integrity checks like hash-binding outputs to weights); (b) Ignores *supply chain timing attacks* (e.g., just-in-time dep injection during CI); (c) No "physical actuator" class despite mentioning IEC 61508; (d) Assumes "at least one honest anchor" but doesn't model anchor DoS/starvation. Still, covers 80-90% real vectors (e.g., aligns with my pentests on LangChain/crewAI).

2. **DEFENSE DEPTH: 7/10**  
   Controls are effective *in isolation* but shallow against chains. PoE + receipts provide strong non-repudiation (EU-CMA under A1/A3), nonce-binding smart for replays. Input firewall (14ms ONNX) blocks 90% injections per tests. Tool-param auth granular (e.g., DB limit=1000). But: (a) PEP bypasses easy if agents use raw sockets (relies on "constrained egress invariant"—network policy fails on host escapes); (b) Receipts often Level 2/3 (gateway/log), not tool-signed (admits <70% target); (c) Anomaly SWDB evadable via gradual drift (boiling frog) or mimicry; (d) No input sanitization beyond schema (e.g., no recursive base64/Unicode decode in core flow, despite test disclosure). Depth good for T1-T2; T4 needs TEEs (recommended but optional).

3. **MATURITY MODEL RESISTANCE: 6/10**  
   Evidence portfolios > calendar time—huge win (e.g., 10k actions + pentest grade B). Signed approvals + rotated evals reduce gaming. Auto-demotion multi-signal (3+ sources) resists Evader. But gameable: (a) *Insider collusion* forges approvals/portfolio (e.g., securityTeamApproval signed by compromised key); (b) *Test suite poisoning* (operator-curated datasets memorized by agent); (c) *Metric inflation* (Escalator pads actionsThisHour via low-risk loops); (d) No quantitative risk scoring (e.g., portfolio weights arbitrary). Rebuild on demote helps, but promotion = insider lottery.

4. **SUPPLY CHAIN: 7/10**  
   Addresses real attacks: SBOM + vuln gates, signed manifests (model/prompts/tools), SLSA L2+ for PEPs. RAG provenance scores novel/good. Empirical: npm/pip audits in CI. Gaps: (a) *Training data shallow* ("minimum viable"—no lineage graphs, vulnerable to upstream poison like HuggingFace trojans); (b) *Zero-days in signed deps* (e.g., typosquat bypassed by vuln-scan false neg); (c) No *build-time PoE* (in-toto-like for deps); (d) Config tampering post-deploy (immutable? But K8s mutates). Covers 70% (beats SLSA-only), but not Sigstore-full.

5. **CONTAINMENT: 6/10**  
   Multi-stage solid (500ms token revoke → 10s in-flight cancel), bounds max_loss mathematically. Circuit breakers + compensating tx proactive. Anti-demotion (3-source signals) smart. But fails determined attacker: (a) *Async/in-flight races* (e.g., queued API tx commits post-freeze; 10s SLA too slow for finance); (b) *Slow exfil* (below hourly caps, mimics baseline); (c) No *memory wipe* (RAG poison lingers); (d) Tools must support cancel (SaaS won't); (e) Evader suppresses via telemetry poison if 3 sources collude. Stops casual breaches; nation-state laughs.

6. **HONESTY: 9/10**  
   Exemplary: §10 details PoE ≠ execution proof, receipt levels matrix, scalability limits, PQ migration timeline, tool compromise risks, unvalidated scales. Admits 90% block rate + 4 bypasses. Compliance "not automatic." Flags aspirations (e.g., "verifiable enforcement" = tool-signed only). Minor puff: "12 services validated in controlled environments" (not production at 1k+ agents); "extracted from production" but §10.1 says small-scale.

## OVERALL SECURITY VALUE: 7/10
VERA delivers *credible enforcement primitives* (PoE/receipts > logging), operationalizing ZTA for agents better than OWASP/MAESTRO. Value in ref impls + schemas for interop. But brittle under Class 5 (enf plane compromise) or adaptive chains. Production-ready for T1-T3 small fleets; T4 needs hardening. Beats guardrails (in-process bypassable); complements TEEs/Omega.

## GREENLIGHT: YES
Architecture credible as reference (not panacea). Deployable today for audit/enforcement; strengthens vs. naked LangGraph/crewAI. Ships code—test it yourself.

## TOP 3 Attack Vectors to Address/Strengthen
1. **Enforcement Plane Compromise (Class 5 Amplification)**: Cloud admin rotates KMS IAM to allow agent-direct Sign(), or CI/CD injects rogue PEP image (bypass Kyverno via sig spoof). Strengthen: Mandate runtime SPIFFE attestation *per PoE* + external witness quorum for T4.
2. **Tool Receipt Forgery/Compromise**: Malicious tool signs fake receipts (e.g., exfil success as "no-op"). Undermines "end-to-end verifiability." Strengthen: Receipt cross-check vs. independent signals (e.g., netflow hashes) + tool key rotation w/ historical invalidation.
3. **Maturity Gaming via Collusion/Test Weakness**: Insider forges portfolio approvals or poisons evals (memorized datasets). Strengthen: External pentest mandate (e.g., via HackerOne) + quantitative portfolio scoring (e.g., CVSS-weighted incidents).

## Flagged Aspirational Claims
- **"Cryptographic proof over policy assertions" (Abstract)**: PoE proves *enforcement record*, not execution/policy correctness (admits in §10.3). Aspirational for "verifiable governance"—more "verifiable audit."
- **"Complete policy enforcement" (Def 3)**: Conditional on "egress invariant"—aspirational; real agents leak via UDP/escapes. No proof of 100% coverage.
- **"90.2% block rate → production safe" (7.2)**: Tests small (41 vectors); adaptive red-teaming (e.g., my GCG-multi-turn) bypasses disclosed gaps. Aspirational without continuous evals.
- **"Max_loss bounded" (Def 4)**: Ignores async races/partial commits; "<10s SLA" unproven at scale.
- **"Evidence-based maturity resistant to gaming" (§1.1 Gap 2)**: Claims fix, but human-signed portfolios gameable (no crypto quorum).

**Constructive Roadmap**: Fork the repo, add TEE PoC for PDP (SEV-SNP), integrate in-toto for runtime deps, run 100-agent chaos tests. Publish pentest CRs. This could hit 9/10. Solid start, Berlin AI Labs—keep shipping code over prose.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 39.0s

---

## Expert Review: VERA Paper from a CISO Perspective

As Sarah Blackwell, CISO of a European financial services company, I've evaluated this paper against my pressing need to deploy AI agents while maintaining SOX, DORA, and EU AI Act compliance. Here's my detailed assessment across all requested dimensions.

### **SCORING**

**1. OPERATIONALIZABILITY: 7/10**
The paper provides concrete reference implementations (12 services) with deployment patterns, which is valuable. The typed schemas, OPA/Rego examples, and clear trust boundaries make implementation technically feasible for a competent platform team. However, the complexity is substantial - deploying all five pillars with cryptographic proofs, KMS integration, and anchor backends would require 2-3 senior engineers for 8-12 weeks. The gap between reference implementation and production-grade deployment in a regulated financial environment is significant.

**2. COMPLIANCE HONESTY: 9/10**
This is the paper's strongest aspect. Section 9 provides an exceptionally honest assessment: "Implementing VERA does not automatically make an organization compliant with any regulation." The explicit warning about EU AI Act interpretation versus certification is precisely what I need - no overselling. The mapping to SOC2, ISO 27001, GDPR, and DORA is appropriately qualified with "potentially supports" rather than definitive claims.

**3. COST AWARENESS: 8/10**
Section 10.9 provides specific cost estimates that are crucial for budgeting: KMS signing costs ($1/10K operations), anchor transaction costs, compute overhead, and personnel requirements (1-2 engineers × 8-12 weeks). The phased adoption approach acknowledges practical constraints. Missing: total cost of ownership projections for 3-5 years and regulatory audit preparation costs.

**4. VENDOR NEUTRALITY: 8/10**
The paper maintains good neutrality with multiple anchor backend options (Solana, Rekor, WORM storage), cloud provider-agnostic KMS abstraction, and algorithm flexibility (Ed25519, ECDSA P-256, ML-DSA-65). The references to AWS, GCP, Azure are factual about capability differences rather than endorsements. Minor deduction for GitHub reference to author's implementation.

**5. REGULATORY REALISM: 9/10**
Excellent handling of regulatory implications. The DORA Article 17 mapping for incident response is appropriate. SOX implications for financial transaction agents are addressed through value caps and compensating transactions. The EU AI Act caution is exactly right - the paper acknowledges this is interpretive guidance, not legal certification. The cryptographic proof of execution directly supports audit trail requirements across all regulations.

**6. BOARD READINESS: 6/10**
The executive summary is strong, but the technical depth (formal security properties, cryptographic assumptions, adversary classes) would overwhelm most boards. The paper needs an executive briefing appendix translating: "We can prove every AI action was authorized, recorded immutably, and contained within financial limits." The risk quantification (Definition 4: containment bound) is board-ready but buried in technical sections.

**7. PRACTICAL VALUE: 8/10**
For financial services, the tool-parameter authorization, transaction value caps, and evidence-based promotion provide tangible risk reduction. The memory/RAG governance addresses real attack surfaces we're concerned about. The PoE chain with anchoring creates the immutable audit trail required for SOX. Practical limitations: the 90.2% block rate against adversarial tests means residual risk requiring additional controls.

### **OVERALL SCORE: 8/10**

This paper provides the most comprehensive, honest, and technically substantiated framework I've seen for AI agent security. It bridges the critical gap between governance documentation and enforceable controls.

### **GREENLIGHT: YES**

This paper should be published. It represents a significant contribution to the field with exceptional honesty about limitations and compliance realities.

### **TOP 3 IMPROVEMENTS NEEDED FROM A CISO PERSPECTIVE**

1. **Executive Translation Layer:** Add a "CISO Briefing Package" appendix that distills the 100+ page technical paper into:
   - One-page risk quantification: "Maximum financial exposure per agent tier"
   - Compliance mapping matrix with implementation priority (Phase 1/2/3)
   - Board-ready narrative: "How we prove AI actions were authorized and contained"
   - 90-day implementation roadmap with resource estimates

2. **Financial Services Specific Extensions:** 
   - Explicit mapping to PCI DSS for payment agents
   - Model risk management (MRM) integration for model validation requirements
   - Trading surveillance integration for market abuse detection
   - Specific EU DORA operational resilience testing requirements for AI agents

3. **Third-Party Risk Management:** 
   - Expand Section 10.7 on tool identity compromise with concrete key rotation procedures
   - Add guidance for SaaS tool receipts (most financial APIs are external)
   - Specify how to handle legacy system integration where tool signing isn't possible
   - Provide template for third-party attestation requirements in vendor contracts

### **ADDITIONAL CISO INSIGHTS**

**What makes this paper valuable for my organization:**
- The evidence-based maturity model replaces subjective "trust" with verifiable proof
- The containment bound (Definition 4) directly addresses my board's question: "What's the maximum damage an AI agent can cause?"
- The honest compliance assessment prevents legal/regulatory overreach
- The phased adoption path acknowledges we can't implement everything at once

**What I would need to supplement:**
- Integration with existing GRC platforms for policy management
- Specific SIEM/SOAR integration patterns for incident response
- Internal audit team training materials on verifying PoE chains
- Legal review of the cryptographic proof's admissibility in EU jurisdictions

This paper provides the architectural foundation we need. Implementation would require significant investment, but the risk reduction and compliance evidence justify it for high-value financial operations agents.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 8/10
**Greenlight:** ❌ NO
**Response time:** 12.5s

---

## Evaluation Scores

**1. TECHNICAL DEPTH: 9/10**  
The paper provides detailed typed schemas (e.g., ProofOfExecution, ToolExecutionReceipt, VeraAgentIdentity in TypeScript), explicit PDP/PEP architectures with deployment patterns (centralized OPA vs. sidecar), formal security properties with game-based proofs, and action coverage matrices. These are sufficiently granular for building core components like PoE chains and tool wrappers, including normative details like nonce lifecycles and JCS canonicalization (RFC 8785). Minor deduction for lacking full pseudocode in anomaly detection (SWDB algorithm) and multi-agent delegation flows.

**2. TOOLING ALIGNMENT: 9/10**  
References 2026-relevant tools like OPA/Rego for PDP, cosign/Kyverno for artifact signing, Sigstore Rekor for anchoring, SPIFFE/SVID for runtime attestation, Solana for blockchain anchors, ONNX/DistilBERT for input firewalls, and post-quantum standards (ML-DSA-65 from FIPS 204, 2024). Aligns with current cloud KMS realities (e.g., AWS KMS Ed25519 absence) and Kubernetes-native enforcement (seccomp/eBPF). Deduction for not mentioning emerging 2026 agent runtimes like Omega TEE platform beyond related work.

**3. CODE AVAILABILITY: 7/10**  
Claims 12 MIT-licensed services (e.g., Veracity Core for PoE, ConvoGuard for firewalls, Agent Pentest npm package) with 25+ contract tests passing, plus git clone instructions to github.com/yogami/vera-reference-implementation. Empirical metrics (e.g., 14ms latency, 90.2% block rate on 41 vectors) suggest validated code exists. However, no inline code snippets beyond schemas/policies, and repository verification failed—assumed available but unconfirmed publicly.

**4. COMPETING FRAMEWORKS: 8/10**  
Strong comparative tables vs. NIST 800-207, OWASP Top 10 Agentic (2025), MAESTRO, AWS Scoping—highlighting VERA's unique PDP/PEP completeness, PoE, and evidence-based trust. Related work covers Google A2A (SPIFFE interop), LangChain (out-of-process superiority), but lacks quantitative benchmarks (e.g., latency vs. NeMo Guardrails) or cost comparisons to AWS agent services.

**5. SCALABILITY: 6/10**  
Addresses sharded anomaly detection, hierarchical PDP, and projections (e.g., 10k agents: 50ms p99 latency, 860GB/day storage), with deployment patterns for multi-agent. Acknowledges gaps like unbuilt 1000+ agent sharding and KMS throughput. Lacks details on distributed nonce tracking, cross-region anchoring, or handling 1M+ actions/sec—section 10.10 is analytical but unvalidated.

**6. INTEROPERABILITY: 9/10**  
Explicit support for A2A (SPIFFE delegation), MCP (implied via tool manifests), SPIFFE (runtime binding), DID:web/JWT-VC, OPA bundles, SLSA Level 2+. Schemas enable pluggable anchors (Rekor, Solana) and crypto agility (Ed25519 to ML-DSA). PDP input/output schemas integrate with existing IAM; residual gaps in BFT for multi-agent (references CP-WBFT but not implemented).

**7. CODE vs WORDS: 75%**  
~75% implementable: full schemas, Rego examples, deployment YAML patterns, PoE spec, and claimed OSS services allow direct builds for pillars 1-3 (identity/PoE/data sovereignty). ~25% requires engineering: custom anomaly SWDB/GMM fitting, multi-source containment orchestration, TEE integrations. Reference code fills most gaps per claims.

**OVERALL: 8/10**

## GREENLIGHT
YES

## TOP 3 Technical Gaps
1. **Public Code Verification**: GitHub repo (yogami/vera-reference-implementation) unverified/unavailable—publish with badges (e.g., test coverage, SLSA provenance) and Docker images for instant reproducibility.
2. **Scalability Prototypes**: Build/test sharded PDP/nonce stores for 10k+ agents; include K8s Helm charts with autoscaling and real-world benchmarks vs. baselines like AWS Bedrock Guardrails.
3. **Tool Receipt Full Spec**: Detail key provisioning/rotation/revocation flows for `tool-signed` receipts; add protocol for SaaS tools (e.g., Stripe API gateways) with normative OpenAPI extensions.

════════════════════════════════════════════════════════════════════════════════
