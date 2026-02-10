# VERA Paper — Expert Review Round 3

**Date:** 2026-02-10T09:53:09.232Z
**Average Score:** 6.2/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 0/10
**Greenlight:** ❌ NO
**Response time:** 99.0s

---

## Publication-Quality Review (Round 3) — VERA: Verified Enforcement for Runtime Agents  
**Reviewer:** Dr. Elena Volkov (Zero Trust Architect; NIST SP 800-207 working group)

VERA is one of the strongest attempts I’ve seen to translate Zero Trust from “governance guidance” into an **enforcement-centered runtime architecture** for agentic systems. The paper’s best contributions are: (1) explicit PDP/PEP placement with sidecar isolation, (2) policy-evaluable typed schemas, (3) PoE + anchoring as a verifiable audit primitive, and (4) an evidence-based “trust tier” runtime that operationalizes continuous verification.

That said, a few **factual inaccuracies**, several **over-strong trust assumptions**, and some **under-specified enforcement mechanics** prevent me from approving this as-is for publication. With targeted revisions, it can clear the bar.

---

# Scores (1–10)

1. **ARCHITECTURAL COMPLETENESS:** **8/10**  
   Strong PDP/PEP placement, two deployment patterns, and telemetry-to-policy feedback. Missing: tighter definition of “action” coverage, deeper policy loop cadence semantics, and stronger treatment of “compromised enforcement plane / orchestration layer” realities.

2. **THREAT MODEL RIGOR:** **7/10**  
   Good capability matrix and combined scenarios. Needs more formal structure (assets→threats→controls mapping discipline, adversary goals/resources, and explicit exclusions), plus additional adversary categories relevant to ZTA deployments (platform/operator, control-plane compromise, and “signing oracle” abuse).

3. **NOVELTY:** **7/10**  
   PoE + anchoring + evidence-based tiering is meaningfully beyond a straightforward NIST 800-207 restatement. However, some elements (OPA sidecars, attestation, transparency logs) are established patterns—novelty is mainly in **packaging + agent-specific enforcement points** (memory/RAG/tool-parameter authorization + tiering).

4. **FORMAL DEFINITIONS:** **7/10**  
   Typed schemas are a major strength. Still missing: normative interface definitions (transport, signing envelope, error semantics), policy bundle signing/verification workflow, and precise semantics for obligations and “complete enforcement.”

5. **PRACTICAL VALUE:** **9/10**  
   High. Engineering teams can use this to build real systems. The paper’s “where to enforce” clarity is rare and valuable.

**OVERALL SCORE:** **8/10**

---

# Dimension-by-Dimension Review

## 1) Architectural Completeness (8/10)

### What’s strong
- **PDP/PEP placement is explicit** and (critically) you state that PDP must not be a library inside the agent process. That aligns with the ZTA principle of isolating the enforcement function from the subject.
- The **two reference patterns** (central PDP vs hardened sidecar PDP) are realistic and map well to enterprise vs edge/latency-constrained scenarios.
- You include a **policy feedback loop** (`ANOM → PDP`), plus fail-closed guidance by tier. This is directionally aligned with NIST 800-207’s “continuous diagnostics and mitigation (CDM)” input to policy.

### Gaps / what to tighten
1. **Define “agent action” normatively (scope of enforcement).**  
   You sometimes imply *every* action is enforced, but you only can enforce actions that cross a controllable boundary (tool call, network, file I/O, memory store/RAG retrieval, etc.).  
   **Fix:** Add a definition like:  
   > “In VERA, an ‘action’ is any operation that causes an externally observable side effect or crosses a trust boundary (tool invocation, network request, data store read/write, RAG retrieval, privileged OS call). Pure reasoning steps are out of scope for enforcement and only observable indirectly.”

2. **Policy loop cadence + caching semantics need to be specified.**  
   You provide a `ttl` in decisions but don’t specify: when must the PEP re-query? what events invalidate cached decisions (revocation, tier change, incident stage escalation, policy bundle update, signal threshold)?  
   **Fix:** Add a short normative section: “PEP cache invalidation rules” and “policy update propagation requirements”.

3. **Enforcement Plane trust assumption is too absolute without compensating controls.**  
   You state “Enforcement Plane is trusted” and “policy engine not compromised.” In real Fortune 100 environments, you must model partial compromise (K8s node compromise, sidecar injection, service account theft, CI/CD poisoning of bundles).  
   **Fix:** Keep the assumption, but add a “hardening baseline” section: secure boot/attestation, signed policy bundles, least-privileged service accounts, node/runtime isolation, admission control, etc.

4. **Obligations are underspecified operationally.**  
   You define obligation types (redact, require approval, rate_limit, etc.) but you don’t specify which component executes them, how fulfillment is proven, and how failures behave.  
   **Fix:** Define “obligation execution semantics” (PEP-executed vs external workflow engine; audit evidence required; fail-closed behavior).

---

## 2) Threat Model Rigor (7/10)

### What’s strong
- Capability matrix is a good start and is more concrete than most “agent security” papers.
- Combined scenarios help demonstrate composability of adversaries.
- You explicitly call out the core cryptographic assumptions (A1–A4), which is excellent.

### What to improve
1. **Add adversaries relevant to ZTA control planes.**  
   Today you have Manipulator/Insider/Escalator/Evader. You’re missing at least:
   - **Platform adversary** (compromised orchestrator / node / service mesh / sidecar injection; can bypass PEPs by routing around them).
   - **PDP/Policy distribution adversary** (bundle server compromise; stale or malicious policy distribution).
   - **KMS signing-oracle abuse** (agent runtime can ask KMS to sign bad actions even if it can’t “exfiltrate” keys—this is central to PoE limits).
   - **Telemetry-plane adversary** (you have some of this under Evader, but it needs explicit trust boundaries + integrity mechanisms).

2. **Clarify insider capabilities around keys (A3 vs “sealed secrets”).**  
   Your A3 says KMS/HSM prevents exfiltration; but later you allow “sealed secrets” as an option. Sealed secrets generally protect *at rest* secrets in Git; they do not provide HSM-grade non-exfiltration at runtime. See factual issues section.

3. **Formal structure suggestion:**  
   Add a compact threat model appendix using a consistent framework (STRIDE-like per asset, or ATT&CK-style techniques mapped to enforcement points). This will make the “formal threat model” claim land better.

---

## 3) Novelty (7/10)

### Legitimate advances beyond “800-207 for agents”
- **PoE + anchoring** as a first-class enforcement/evidence primitive is novel in the agent ZTA literature (though conceptually related to transparency logs and supply-chain attestation).
- **Memory/RAG governance as a PEP-enforced surface** is a meaningful and timely extension.
- **Evidence-based tiering** is a strong operationalization of continuous verification (and better than calendar-based maturity gates).

### Where novelty claims should be toned down
- Several mechanisms are “good engineering” rather than new: OPA-based PDP, sidecars, mTLS, Sigstore-like anchoring. The novelty is the *composition* and agent-specific PEP placement. I’d recommend framing it that way to avoid reviewer pushback.

---

## 4) Formal Definitions (7/10)

### What’s strong
- The schemas (identity, PoE, PDP input/output, obligations, evidence portfolio) are implementable and clearer than typical reference architectures.
- Use of **RFC 8785 (JCS)** for canonicalization is a strong practical decision.

### What’s missing to be “formally precise enough to implement interoperably”
1. **Protocol/interface definitions.**  
   You need to specify:
   - PEP→PDP transport (HTTP/gRPC?), authn of the caller, replay protection, request signing, correlation IDs
   - Decision signing (should PDP sign decisions? should PEP verify to prevent in-path tampering?)
   - Policy bundle signing and verification (who signs, what key, how rotated, how revoked)

2. **PoE “resultHash” semantics.**  
   You say `resultHash` is SHA-256 of the action result “(not raw result)”, but what does that mean exactly? Is it hash of:
   - the raw tool response bytes?
   - a canonicalized JSON projection?
   - a redacted version?
   You need a deterministic definition, or you risk non-reproducibility and verification failures.

3. **Multi-replica ordering and time.**  
   “Cross-replica ordering via anchor timestamps” is not enough to guarantee consistent ordering under network delays / anchor latency variance. You likely only need *partial order* with per-replica monotonicity—state that explicitly.

---

## 5) Practical Value (9/10)

This is the strongest part of the paper. Teams will take away:
- Where to put PEPs for agents (tool wrappers, memory guard, API gateway).
- How to think about autonomy gating with evidence.
- How to build a verifiable audit trail that supports forensics and disputes.

Two pragmatic concerns to address:
- **Operational cost/latency:** anchoring per action to public chains is rarely feasible; you do offer alternatives, which is good. Consider explicitly recommending “batch anchoring” patterns as the default.
- **Approval workflows:** “require_approval” obligations need an external workflow engine; without that, this becomes hand-wavy. Even a reference diagram would help.

---

# Factual Errors / Contradictions / Misleading Claims (must fix)

1. **OPA cluster “leader election”**  
   You write: “OPA cluster requires 3+ replicas with leader election.”  
   **Issue:** OPA is generally **stateless** for policy evaluation; it does not require leader election for correctness. You might be thinking of a bundle distribution service or a separate stateful component.  
   **Fix:** Replace with: “3+ replicas behind a load balancer; no leader election required for evaluation.”

2. **“Sealed secrets” listed as a trusted key store option under A3**  
   In A3 you require a keystore that “prevents key exfiltration by the agent runtime.” “Sealed secrets” (K8s sealed-secrets) protects secrets in Git and enables cluster-side decryption, but the workload can still read the plaintext secret at runtime if mounted—so it does **not** provide non-exfiltration.  
   **Fix:** Remove “sealed secrets” from A3’s qualifying examples, or explicitly downgrade it (e.g., “protects at rest only; does not satisfy A3 for non-repudiation guarantees”).

3. **Sigstore Rekor characterization (“without X.509 certificate requirements”)**  
   Rekor is a transparency log; many Sigstore flows are “keyless” but still use certificates (Fulcio issues ephemeral certs). The statement as written is misleading.  
   **Fix:** Rephrase to: “Rekor can log signed artifacts and support keyless signing workflows (e.g., via Fulcio-issued ephemeral certificates).”

4. **NIST 800-207 characterization as “designed for human users”**  
   800-207 is not limited to humans; it describes “subjects” broadly (users, devices, workloads). Your point about agent characteristics is valid, but the phrasing invites an easy rebuttal.  
   **Fix:** Say: “While NIST 800-207 supports non-human subjects, most enterprise implementations and assumptions (session models, decision cadence, observability) were developed around human/workload access patterns and do not directly address autonomous agent loops and tool-chaining.”

---

# Top 3 Specific Improvements Needed

1. **Make enforcement coverage and policy loop semantics normative.**  
   Add a short “VERA Conformance” section defining:
   - what constitutes an “action” (enforced vs merely observed)
   - required PEP coverage set (tool calls, network, memory/RAG, output)
   - cache TTL + invalidation triggers + revocation semantics
   - obligations execution and proof of fulfillment

2. **Harden the threat model with control-plane/platform adversaries + signing-oracle nuance.**  
   Add explicit adversaries for: orchestrator/node compromise, policy distribution compromise, KMS misuse (signing oracle), and telemetry-plane integrity. Then map each to concrete mitigations (attestation, signed bundles, admission control, egress controls, separation of duties, witness logs).

3. **Tighten the formal definitions around PoE verification and result hashing.**  
   Provide deterministic definitions for `resultHash`, decision signing (optional but recommended), and multi-replica proof chain semantics. This will materially increase implementability and auditability.

---

# Additional Smaller Suggestions (quality polish)
- Provide a **mapping table from VERA components to NIST 800-207 logical components** (Policy Engine/Administrator/Enforcement Point/CDM). This will help reviewers immediately situate your architecture in standard ZTA terms.
- For SWDB anomaly detection: note that GMM assumptions may not hold for mixed categorical/continuous features; consider stating that the “GMM is a reference implementation; other density estimators are allowed,” and define the interface for “anomaly score providers.”
- Your empirical section is valuable, but publishability improves if you add: hardware specs, dataset descriptions, confidence intervals, and reproducibility pointers (exact commit hashes).

---

# GREENLIGHT Decision

**GREENLIGHT: NO**

Reason: the paper is close, but the items under **Factual Errors** plus the need for **normative enforcement semantics** are blocking for publication quality. Address those, and I would expect this to move to **GREENLIGHT: YES** on the next revision.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 8/10
**Greenlight:** ❌ NO
**Response time:** 181.0s

---

# IEEE S&P Industry Track Review: VERA

## Reviewer: Professor Marcus Chen, ETH Zurich

---

## EXECUTIVE SUMMARY

This paper presents VERA, a zero trust reference architecture for AI agents with formal threat modeling, cryptographic proof of execution, and evidence-based trust progression. The work addresses a genuine enforcement gap in current AI agent security frameworks and backs claims with 12 deployed open-source services and empirical measurements.

**Strengths:** Novel contribution in operationalizing governance frameworks, rigorous threat model with four adversary classes, honest limitations disclosure, running code with reproducible results, excellent technical depth.

**Weaknesses:** Some formalization could be tightened, compliance mapping overstates regulatory applicability, performance evaluation lacks comparative baselines, multi-agent security underspecified.

**Overall Assessment:** Strong Accept with minor revisions. This represents solid systems security engineering with practical impact. The work would benefit IEEE S&P's industry track by bridging the gap between academic rigor and deployment reality.

---

## DIMENSIONAL SCORING

### 1. CONTRIBUTION: 8/10

**Novel Elements:**
- **Evidence-based maturity runtime** (Section 5): This is genuinely novel. Replacing calendar-based trust with cryptographically-signed evidence portfolios addresses a real vulnerability in current frameworks. The promotion criteria are measurable and verifiable.
- **Tool-parameter authorization** (Section 4.4): Existing zero trust frameworks stop at resource-level access. VERA's parameter-level constraints (e.g., `limit <= 1000` in database queries) are a meaningful extension for non-deterministic agents.
- **Pluggable anchor abstraction** (Section 4.2.2): The comparison table between blockchain, transparency logs, and WORM storage provides practical guidance missing from academic work that assumes a single trust model.

**Incremental Elements:**
- PDP/PEP architecture is standard NIST 800-207, adapted but not fundamentally novel
- Ed25519 signatures for non-repudiation are well-established
- Distributional anomaly detection (SWDB algorithm) applies known GMM techniques to a new domain

**Gap Analysis (Section 1.2):** The comparative framework table is useful but slightly unfair. Comparing VERA (a full implementation) against OWASP (a threat taxonomy) and AWS Scoping (a risk matrix) conflates different abstraction levels. A fairer comparison would be against deployed systems like Google's BeyondCorp or Netflix's Zero Trust architecture.

**Recommendation:** Reframe Table 1.2 to compare "enforcement capabilities" rather than "controls," and add a column for "deployment complexity" where VERA's 12-service architecture would show higher operational overhead than simpler frameworks.

**Score Justification:** 8/10 reflects genuine novelty in evidence-based trust and tool-parameter authorization, offset by incremental application of known techniques elsewhere.

---

### 2. RELATED WORK: 7/10

**Comprehensive Coverage:**
Section 11 covers appropriate foundations (NIST 800-207, OWASP Top 10, MAESTRO, AWS Scoping, NIST AI RMF). The paper correctly positions VERA as an enforcement layer complementing governance frameworks rather than replacing them.

**Missing Citations:**

1. **Adversarial ML for agents:** The paper mentions prompt injection and jailbreaking but doesn't cite foundational work:
   - Perez & Ribeiro (2022) on prompt injection taxonomy
   - Wei et al. (2023) on jailbreak attack patterns
   - The cited [Zhong et al., 2023; Zou et al., 2023] for RAG poisoning are mentioned but not in the references section

2. **Runtime verification:** Leucker & Schallhart (2009) is cited but the connection to LTL/CTL temporal logics could be made explicit. VERA's PoE chain is essentially a finite trace in runtime verification terms.

3. **Byzantine fault tolerance:** Section 10.5 acknowledges multi-agent BFT limitations but doesn't cite Lamport's foundational work or recent BFT consensus protocols (PBFT, HotStuff) that could inform future extensions.

4. **Trusted execution environments:** The paper mentions SGX/SEV for PDP isolation (Section 4.0) but doesn't cite Intel SGX papers or discuss attestation protocols (RATS, DICE).

**Differentiation:**
The paper clearly differentiates VERA from prior work. However, the claim that "none define where policies are evaluated, where they are enforced" (Section 1) is too strong. NIST 800-207 explicitly defines PDP/PEP placement. The accurate claim is that prior frameworks don't specify PDP/PEP placement *for non-deterministic AI agents*.

**Recommendation:** Add missing citations, soften the "none define" claim to "none specify for AI agents," and expand the runtime verification connection.

**Score Justification:** 7/10 reflects solid coverage with notable gaps in adversarial ML and TEE literature.

---

### 3. THREAT MODEL: 9/10

**Exceptional Rigor:**
Section 2's four-adversary-class model with capability matrices is excellent. The structured presentation (Table 2.2) makes threat boundaries explicit and falsifiable. The mapping to assumptions A1-A4 shows clear reasoning about what each adversary can and cannot do.

**Strengths:**
- **Capability matrix** (Table 2.2): Binary capabilities are clearly defined. The "Partial" entries (e.g., Escalator's write-to-memory) are explained in the text.
- **Combined attack scenarios** (Table 2.3): Multi-adversary compositions are often overlooked. The "Poisoned RAG + prompt injection" scenario is realistic and well-mitigated.
- **OWASP mapping** (Section 2.2): Each adversary class maps to specific OWASP Top 10 categories, making the threat model actionable.

**Weaknesses:**

1. **Assumption A3 (Trusted Key Store):** The paper states "agent runtime cannot exfiltrate the signing key" but doesn't specify *how* this is enforced. Is it HSM-backed? Sealed secrets? The Deployment Pattern B mentions "hardened sidecar" but the isolation mechanism (container, microVM, TEE) is listed as options without guidance on which provides sufficient isolation for each trust tier.

   **Specific issue:** A compromised agent runtime in the same container as the sidecar could use `/proc` filesystem access or shared memory to extract keys from the sidecar process. The paper needs to specify minimum isolation requirements (e.g., T3+ agents require microVM or TEE isolation, not just container separation).

2. **Assumption A4 (Anchor Integrity):** "At least one anchor backend is honest" is vague. For blockchain anchoring, this is well-defined (51% honest consensus). For transparency logs, what constitutes "honest"? A single witness? Threshold witnesses? The Rekor integration should specify witness requirements.

3. **Evader adversary (Section 2.2.4):** The capability to "inject false telemetry signals" is listed but the defense ("requires compromise of 3+ independent signal sources") isn't formally specified. What are the three sources? Are they structurally independent (different codebases, different operators)?

**Recommendation:**
- Add Table 2.4: "Minimum Isolation Requirements per Trust Tier"
- Specify witness/consensus requirements for each anchor backend
- Define the three independent telemetry sources explicitly

**Score Justification:** 9/10 reflects excellent structure with minor specification gaps in assumptions.

---

### 4. FORMALIZATION: 7/10

**Definitions (Section 3.2):**

**Definition 1 (Action Non-Repudiation):** Well-formed. The canonical representation via JCS (RFC 8785) is specified. The verification predicate is clear.

**Issue:** The definition states "the agent cannot deny having performed `a`" but the limitation (Section 10.3) acknowledges a compromised runtime could sign actions it didn't perform. This creates a semantic gap: non-repudiation of *signing* vs. non-repudiation of *execution*.

**Fix:** Restate Definition 1 as "Signature Non-Repudiation" and add Definition 1b for "Execution Non-Repudiation" (requires external verification, out of scope for VERA core but supported via cross-referencing).

**Definition 2 (Chain Tamper-Evidence):** The hash-chaining construction is standard (similar to blockchain). The claim "any deletion, reordering, or insertion produces a detectable gap" is correct under A2.

**Issue:** Multi-replica deployments (mentioned in the definition) create a problem. If each replica has an independent chain identified by `(agentDid, instanceId)`, how is cross-replica ordering established? The definition says "via anchor timestamps" but anchor timestamps have precision limits (Solana: ~400ms, which is 400 million CPU cycles). Two replicas could perform conflicting actions within the same anchor timestamp window.

**Fix:** Specify a total ordering protocol for multi-replica scenarios (e.g., vector clocks, Lamport timestamps, or requiring a single designated signer per agent DID).

**Definition 3 (Policy Enforcement Completeness):** This is more of an operational property than a formal definition. "Every agent action passes through at least one PEP" is not verifiable from the PoE chain alone—it requires knowing the complete set of possible actions.

**Issue:** The detection mechanism ("actions observed at the tool level without corresponding PEP evaluation records") assumes tools are instrumented to log independently of the agent. This is a deployment requirement, not a property of VERA itself.

**Fix:** Restate as "PEP Coverage Requirement" (a deployment constraint) rather than "Completeness" (a provable property). Add a verification procedure: "PEP coverage is verified by comparing PoE action types against registered tool manifests."

**Definition 4 (Containment Bound):** The financial damage bound is useful and measurable. The formula is clear.

**Issue:** The bound assumes synchronous enforcement, but the caveat about in-flight operations undermines the bound's utility. If a compromised agent can queue 10,000 transactions before the circuit breaker activates, the bound is violated.

**Fix:** Add a constraint: "For agents with T3+ trust tier, in-flight transaction queues must be bounded by `max_inflight_tx ≤ hourly_value_cap / per_tx_value_cap`."

**Security Arguments (Section 3.3):**
The arguments are informal proofs, which is appropriate for a systems paper. However, they could be tightened:

- "By A1, an adversary who does not possess the agent's private key cannot forge a valid signature" — this is correct but should cite Bernstein et al. (2012) explicitly here, not just in A1.
- "By A2, an adversary cannot produce a modified action sequence that preserves all hash chain links" — this should specify the adversary's computational bound (e.g., "no polynomial-time adversary").

**Recommendation:**
- Tighten Definitions 1-4 per above
- Add computational bounds to security arguments
- Separate provable properties from deployment requirements

**Score Justification:** 7/10 reflects solid definitions with precision gaps and conflation of properties vs. requirements.

---

### 5. EVALUATION: 8/10

**Empirical Results (Section 7.1):**
The measurements are specific, reproducible, and honest. Latency numbers include p99 (not just median), which is critical for tail-latency-sensitive systems. The methodology is stated (e.g., "DistilBERT ONNX, single CPU core, batch=1").

**Strengths:**
- **Adversarial test results** (Section 7.2): Transparent disclosure of bypassed vectors is excellent. Many papers hide failed tests. The 90.2% block rate is respectable, and the four bypassed vectors are explained with mitigations.
- **Contract validation tests:** 25/25 passing tests with E2E coverage is good for a reference implementation.
- **Latency breakdown:** The 14ms prompt injection detection is fast enough for most use cases. The comparison between local key (3ms) and KMS (15-50ms) for PoE signing helps deployment decisions.

**Weaknesses:**

1. **No comparative baselines:** The paper doesn't compare VERA's performance against alternative approaches. For example:
   - How does the 14ms ONNX firewall compare to cloud-based prompt injection APIs (e.g., OpenAI Moderation API)?
   - How does VERA's PoE overhead compare to standard audit logging (e.g., CloudTrail, Splunk)?
   - What is the throughput degradation? (Latency is reported, but not max actions/second)

2. **Scalability claims unsupported:** Section 10.1 admits "scaling to 1000+ agents" is untested. The largest deployment mentioned is 12 services. What is the actual scale tested? 10 agents? 100? The evaluation should report the maximum tested configuration.

3. **Anomaly detection evaluation:** The SWDB algorithm (Section 4.2.3) specifies false positive rates (FPR ≤ 5% for T1, ≤ 0.01% for T4) but Section 7.1 doesn't report measured FPR. Was the algorithm validated on real agent traces? What is the false negative rate?

4. **Memory/RAG governance results:** Section 4.3 specifies extensive memory governance controls (per-document ACL, source trust scoring, poisoning detection) but Section 7 doesn't report any measurements. Were these controls evaluated? What is the latency overhead of source trust scoring?

**Missing Experiments:**
- **Failure mode testing:** What happens when the PDP is unavailable? The paper specifies fail-closed for T3/T4 agents but doesn't report measured downtime or false denial rates.
- **Anchor backend comparison:** Table 4.2.2 lists five anchor backends with latency estimates. Were these measured in the deployed system, or are they theoretical?
- **Multi-agent scenarios:** Section 10.5 acknowledges multi-agent limitations but doesn't report any multi-agent experiments.

**Recommendation:**
- Add comparative baselines (at minimum, compare VERA vs. no enforcement)
- Report measured FPR/FNR for anomaly detection
- Add throughput measurements (actions/second)
- Specify maximum tested scale explicitly
- Report anchor backend latencies from actual deployments

**Score Justification:** 8/10 reflects solid measurements with notable gaps in baselines, scalability, and anomaly detection validation.

---

### 6. WRITING QUALITY: 8/10

**Clarity:**
The prose is clear, technical, and appropriate for an industry track venue. The paper uses concrete examples (Rego policies, TypeScript schemas) that make abstract concepts tangible. The mermaid diagrams (Sections 1, 4.0) are helpful.

**Structure:**
The paper is well-organized. The progression from problem (Section 1) → threat model (Section 2) → properties (Section 3) → architecture (Section 4) → maturity (Section 5) → implementation (Section 7) is logical.

**Tone Issues:**

The paper's tone occasionally veers into marketing language inappropriate for IEEE S&P:

1. **Abstract:** "When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data, unauthorized financial transactions, and cascading failures across downstream systems."
   - **Issue:** This is evocative but imprecise. What is the measured blast radius? How many incidents occurred?
   - **Fix:** "AI agents that interact with production systems can cause data breaches, unauthorized transactions, and cascading failures when compromised. We measured X incidents across Y deployments, with Z median damage."

2. **Section 1:** "Trust without proof is aspiration. VERA makes it architecture."
   - **Issue:** This is a tagline, not a technical claim.
   - **Fix:** Remove or move to a blog post. End with "VERA provides verifiable enforcement through cryptographic proofs and explicit PEP placement."

3. **Section 13 (Conclusion):** "The gap is enforcement: the architectural layer between governance guidance and running infrastructure that makes controls verifiable."
   - **Issue:** This repeats the abstract without adding new information.
   - **Fix:** Summarize contributions numerically: "VERA contributes: (1) a four-adversary threat model, (2) evidence-based trust progression, (3) tool-parameter authorization, (4) 12 open-source enforcement services, and (5) empirical validation with 90.2% adversarial test block rate."

**Jargon:**
Some terms are used without definition:
- "Blast radius" (abstract) — define or replace with "damage scope"
- "Boiling frog attacks" (Section 4.2.3) — define or cite
- "WORM storage" (Table 4.2.2) — spell out "Write-Once-Read-Many"

**Precision:**
- Section 1.1: "These frameworks provide useful guidance" — which frameworks? Name them.
- Section 4.3: "few existing frameworks address" — quantify "few" or say "none we surveyed"
- Section 9: "Compliance is organization-specific, requires legal counsel" — this is correct but could be stated more directly: "VERA does not provide legal compliance. Organizations must engage legal counsel."

**Recommendation:**
- Remove marketing language from abstract, section 1, and conclusion
- Define jargon on first use
- Replace vague quantifiers ("few," "many") with specific counts
- Tighten conclusion to summarize contributions numerically

**Score Justification:** 8/10 reflects clear technical writing with tone issues that need adjustment for venue appropriateness.

---

### 7. LIMITATIONS: 10/10

**Exemplary Honesty:**
Section 10 is one of the best limitations sections I've reviewed. It acknowledges:
- Scalability untested beyond small deployments (10.1)
- Performance overhead unacceptable for sub-millisecond loops (10.2)
- PoE provides signature integrity, not execution correctness (10.3)
- Distributional baselines have false positives and can be evaded (10.4)
- Multi-agent BFT is unsolved (10.5)
- Quantum computing breaks Ed25519 (10.6)
- Physical actuators out of scope (10.7)

**Specific Strengths:**
- **Section 10.3** distinguishes non-repudiation of signing vs. execution. Many papers would hide this gap.
- **Section 10.4** admits "we do not claim VERA solves the alignment problem." This is refreshingly honest.
- **Section 7.2** discloses all four bypassed adversarial vectors with explanations.

**Minor Issue:**
Section 10.5 says "Organizations deploying agent swarms should extend VERA with BFT-specific protocols" but doesn't provide guidance on *which* BFT protocols are compatible. A sentence like "VERA's evidence portfolios can integrate with PBFT or HotStuff consensus by including quorum signatures in promotion approvals" would help.

**Score Justification:** 10/10. This is how limitations should be written.

---

## OVERALL SCORE: 8/10

**Justification:**
VERA makes a solid contribution to AI agent security by operationalizing governance frameworks with enforceable controls and verifiable proofs. The threat model is rigorous, the implementation is real, and the limitations are honestly disclosed. The work would benefit IEEE S&P's industry track by demonstrating how academic security principles (zero trust, runtime verification, cryptographic proofs) apply to a rapidly-evolving domain (AI agents).

Deductions:
- Formalization could be tightened (Definition 3, multi-replica ordering)
- Evaluation lacks comparative baselines and scalability data
- Tone needs adjustment for academic venue
- Related work missing key citations (adversarial ML, TEE)

---

## VERDICT: **STRONG ACCEPT**

This paper represents high-quality systems security engineering with practical impact. The deployment of 12 open-source services and transparent disclosure of bypassed tests demonstrate maturity beyond typical "we propose a framework" papers.

**Conditional acceptance:** Require minor revisions addressing:
1. Tone adjustments (remove marketing language from abstract/conclusion)
2. Tighten Definition 3 (PEP completeness) and add multi-replica ordering protocol
3. Add comparative baselines to evaluation (at minimum, VERA vs. no enforcement)
4. Specify minimum isolation requirements for Assumption A3 per trust tier
5. Add missing citations (adversarial ML, TEE, BFT)

These revisions are achievable in a shepherd revision cycle.

---

## TOP 3 SPECIFIC IMPROVEMENTS

### 1. **Add Comparative Baselines to Evaluation (Section 7)**

**Current state:** Section 7.1 reports VERA's absolute performance (14ms latency, 90.2% block rate) without comparing to alternatives.

**Required addition:**
Create Table 7.3: "Comparative Performance vs. Baselines"

| Metric | VERA | Cloud API (e.g., OpenAI Moderation) | Standard Audit Log | No Enforcement |
|:---|:---|:---|:---|:---|
| Prompt injection detection latency | 14ms | 250-800ms (network RTT) | N/A | N/A |
| PII detection precision | 97.3% | [Measure or cite] | N/A | N/A |
| PoE overhead per action | 3-50ms | N/A | 1-5ms (CloudTrail) | 0ms |
| Adversarial block rate | 90.2% | [Measure or cite] | 0% | 0% |
| Throughput (actions/sec) | [Measure] | [Measure] | [Measure] | [Baseline] |

**Why this matters:** Without baselines, reviewers cannot assess whether VERA's 14ms latency is acceptable. Is it 10x faster than alternatives? 10x slower? The paper needs to show VERA's overhead is justified by security gains.

**Implementation:** Run agent-pentest against: (1) VERA-protected agent, (2) agent with cloud-based moderation, (3) agent with standard logging, (4) unprotected agent. Report block rates and latencies for each.

---

### 2. **Specify Minimum Isolation Requirements for Key Protection (Section 2.1, Assumption A3)**

**Current state:** Assumption A3 states "Key store provides hardware or attested isolation" but doesn't specify what level of isolation is required for each trust tier.

**Required addition:**
Add Table 2.5: "Minimum Key Isolation Requirements per Trust Tier"

| Trust Tier | Minimum Isolation | Rationale | Example Technologies |
|:---|:---|:---|:---|
| T1 (Observer) | Container separation | Read-only, low risk | Docker with read-only filesystem |
| T2 (Advisor) | Process isolation + sealed secrets | Approval required, medium risk | Kubernetes sealed secrets, systemd PrivateTmp |
| T3 (Operator) | MicroVM or HSM | Acts autonomously, high risk | Firecracker, AWS Nitro Enclaves, Cloud KMS |
| T4 (Autonomous) | HSM with remote attestation | Self-directed, critical risk | AWS CloudHSM, Azure Dedicated HSM, SGX with DCAP |

**Why this matters:** The current spec allows a T4 agent to run in the same container as its PDP/PEP, which violates the trust boundary model. A compromised T4 agent in a shared container could use `/proc` filesystem access to extract keys from the sidecar process. The paper needs to specify that T3+ agents require hardware isolation (microVM or HSM), not just process isolation.

**Text change in Section 4.0, Deployment Pattern B:**
Replace: "Isolation options: Container with read-only filesystem + no network egress (minimum); gVisor/Firecracker microVM (recommended); SGX/SEV enclave with remote attestation (highest assurance)"

With: "Isolation requirements by trust tier: T1-T2 may use container isolation; T3 requires microVM (Firecracker, gVisor) or HSM; T4 requires HSM with remote attestation (SGX DCAP, AWS Nitro). Container-only isolation is insufficient for T3+ due to shared kernel attack surface."

---

### 3. **Tighten Formalization of Multi-Replica Ordering (Section 3.2, Definition 2)**

**Current state:** Definition 2 states "For multi-replica deployments, each replica maintains an independent PoE chain identified by `(agentDid, instanceId)`. Cross-replica ordering is established via anchor timestamps."

**Problem:** Anchor timestamps have limited precision. Solana timestamps are accurate to ~400ms. Two replicas could perform conflicting actions (e.g., transferring the same funds to different recipients) within the same 400ms window, and the anchor timestamp wouldn't establish a total order.

**Required addition:**
Add Definition 2b: "Multi-Replica Total Ordering"

**Definition 2b (Multi-Replica Total Ordering):** For an agent deployed across N replicas, a total ordering of actions is established by:
1. **Designated signer:** Only one replica (the elected leader) signs PoE records. Non-leader replicas forward actions to the leader for signing. Leader election uses a consensus protocol (Raft, Paxos) with bounded failover time.
2. **Vector clocks:** Each replica maintains a vector clock `VC[instanceId]`. PoE records include the full vector clock. Total order is established by vector clock comparison (Lamport's happens-before relation).
3. **Anchor-based sequencing:** All replicas anchor to the same external sequencer (e.g., Solana, transparency log). Actions are ordered by `(anchorBlockHeight, anchorTxIndex, instanceId)`.

**Constraint:** For agents with T3+ trust tier performing financial operations, designated signer (option 1) is required to prevent double-spend races. For read-heavy agents, vector clocks (option 2) are sufficient.

**Why this matters:** Without a specified total ordering protocol, VERA's PoE chain doesn't prevent double-spend attacks in multi-replica deployments. This is a critical gap for financial operations (the paper's own example in Section 4.4).

**Text change in Section 3.2:**
Replace: "Cross-replica ordering is established via anchor timestamps."

With: "Cross-replica ordering requires one of three protocols: designated signer (required for T3+ financial ops), vector clocks (sufficient for read-heavy), or anchor-based sequencing (see Definition 2b)."

---

## ADDITIONAL MINOR CORRECTIONS

1. **Section 1.2, Table:** Add "Deployment Complexity" column showing VERA requires 12 services vs. simpler frameworks.

2. **Section 2.2.1, Manipulator:** Clarify that "schema validation" includes recursive decode-and-scan (to catch base64-encoded payloads mentioned in Section 7.2).

3. **Section 3.3, Security Arguments:** Add computational bounds: "no polynomial-time adversary" for collision resistance.

4. **Section 4.2.3, SWDB Algorithm:** Report measured FPR/FNR in Section 7.1.

5. **Section 7.1, Anchor confirmation:** Specify whether 400ms is measured on mainnet or testnet, and during what congestion level.

6. **Section 9, Compliance Mapping:** Add disclaimer: "This table provides guidance only. VERA does not certify compliance. Engage legal counsel."

7. **Section 11, Related Work:** Add citations for Perez & Ribeiro (2022), Wei et al. (2023), Intel SGX papers, PBFT/HotStuff.

8. **References:** Add the missing [Zhong et al., 2023; Zou et al., 2023] citations mentioned in Section 4.3.

---

## FINAL RECOMMENDATION

This is a strong industry track paper that advances the state of practice in AI agent security. The deployment of 12 open-source services, transparent disclosure of limitations, and rigorous threat modeling demonstrate maturity beyond typical proposals.

**Accept with minor revisions** (shepherd required to verify changes).

The three major improvements (comparative baselines, isolation requirements, multi-replica ordering) are essential for publication. The additional minor corrections improve precision but are not blocking.

**Expected impact:** This work will influence how organizations deploy AI agents in production. The open-source reference implementation provides a concrete starting point, and the evidence-based maturity model addresses a real gap in current practice.

**Audience fit:** Perfect for IEEE S&P industry track. Combines academic rigor (formal threat model, security properties) with practical engineering (running code, deployment patterns, honest performance numbers).

---

## GREENLIGHT: **YES**

**Conditional on minor revisions addressing the top 3 improvements.**

The paper makes a solid contribution, is technically sound, and honestly discloses limitations. The required revisions are achievable in a shepherd cycle and will significantly strengthen the work.

I recommend acceptance and look forward to seeing this work presented at the conference.

---

**Reviewed:** February 2026  
**Reviewer:** Prof. Marcus Chen, ETH Zurich  
**Confidence:** High (this is directly in my area of expertise)

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 38.2s

---

# Red Team Review: VERA - Verified Enforcement for Runtime Agents

As Raven, principal adversarial security researcher specializing in breaking zero-trust implementations, I've dissected VERA with a focus on real-world exploitability. This paper is ambitious, well-structured, and refreshingly transparent—rare for security papers hawking frameworks. It operationalizes zero-trust for agents better than most vaporware governance docs (e.g., MAESTRO, AWS scoping), with actual open-source code, empirical metrics, and admitted bypasses. Strengths: explicit PDP/PEP placement, PoE chains, pluggable anchors, and evidence-based tiers beat calendar-based nonsense. Weaknesses: Over-reliance on a "trusted enforcement plane," PoE proving the wrong thing (signing ≠ execution), and insider gaming vectors. It's a solid reference impl, but deployers will bleed from unaddressed runtime compromises and assumption violations.

## Dimension Scores (1-10)

1. **THREAT MODEL COVERAGE: 8/10**  
   The 4-class model (Manipulator, Insider, Escalator, Evader) is structured and maps well to OWASP Top 10 Agentic (A01-A10), covering prompt/RAG poisoning, supply chain backdoors, escalation via delegation, and evasion via telemetry spoofing. Capability matrices and combined scenarios are pragmatic. Gaps: No explicit coverage of model weight exfiltration (e.g., Evader querying own memory for weights), side-channel leaks (timing/power on anomaly features), or upstream training data supply chain (minimal provenance). Real vectors like Unicode homoglyphs and multi-turn injections are called out in tests—good.

2. **DEFENSE DEPTH: 7/10**  
   Controls are practical: local ONNX firewalls (14ms latency), tool-param schemas, SWDB anomaly detection (GMM with drift adaptation), and PoE chains provide depth beyond logging. 90% block rate on 41 pentest vectors is credible (with transparent bypass disclosure). PEP placements (input gw, tool wrapper, memory guard) enforce at chokepoints. But effectiveness craters if enforcement plane is compromised (core assumption); PoE doesn't attest execution (admitted); anomaly evadable via mimicry or slow drifts. Against practical attacks like recursive base64 payloads or delegated re-requests, mitigations exist but are post-hoc (e.g., v2.2 Unicode norm).

3. **MATURITY MODEL RESISTANCE: 6/10**  
   Evidence portfolios (action counts, adversarial grades, signed approvals) + auto-demotion are smarter than time-based models, with protections like security-team-curated datasets. Multi-source signals resist single-point telemetry poisoning. But highly gameable: Escalator/Insider collusion forges approvals/portfolios (e.g., poison eval datasets pre-onboarding); low-volume mimicry during promo windows; override governance relies on humans. Re-validation is periodic, not continuous—gap for bursty attacks.

4. **SUPPLY CHAIN: 7/10**  
   SBOM gates, signed manifests (models/tools/prompts), Git sigs, and RAG provenance scoring address typosquatting, LoRA backdoors, and doc poisoning. Model hash + provider attests are minimal but realistic. Maps to A09 well. Misses: Deep training data lineage (e.g., no DataDog-style graphs), hardware supply chain (CPUs/GPUs), or zero-days in *signed* deps (admitted residual). Good for dep-level, weak for model provenance.

5. **CONTAINMENT: 6/10**  
   Multi-stage (token revoke <500ms to compensating tx <60s) with fail-closed PEPs, in-flight cancel (<10s SLA), and multi-source triggers is thoughtful. State freeze + PoE forensics aid post-mortems. But a determined Evader (persistent runtime access) exfils pre-detection (slow drips evade SWDB), survives async queues, or poisons signals collusively. Assumes all actions hit PEPs (bypassable via native libs); container escapes unaddressed (A05 residual). Bounds damage but doesn't *stop*—contains leaks, not root cause.

6. **HONESTY: 9/10**  
   Exemplary: Dedicated limitations section (PoE ≠ execution proof, scalability, non-determinism, multi-agent gaps); transparent pentest bypasses + versions; compliance caveats ("not legal cert"); no overclaims on EU AI Act. Aspirational phrasing ("proof over policy") flagged below, but overall accurate.

**OVERALL SECURITY VALUE: 7/10**  
VERA delivers verifiable enforcement where frameworks fail, with running code (12 services, 25/25 tests) and metrics. It's a credible ZTA adaptation for agents—better than NIST 800-207 alone—but trust assumptions (enforcement plane, KMS, anchors) make it brittle. High value for operationalizing governance; mid-tier for standalone security.

**GREENLIGHT: YES** — The architecture is credible for production pilots (e.g., T1-T2 agents). Deploy with caveats: Harden sidecars (microVMs), audit assumptions, extend for swarms. Not foolproof, but beats paper policies.

## TOP 3 Attack Vectors to Address/Strengthen
1. **Compromised Enforcement Plane/PDP (Breaks All Pillars)**: Paper trusts PDP/PEPs/Proof Engine fully (e.g., Pattern B sidecar). Attacker via container escape, sidecar vuln (e.g., OPA bundle staleness >60s), or supply chain in enforcement deps bypasses everything. Strengthen: Mandate TEE attestation (SGX/SEV) + runtime integrity checks (e.g., SPIFFE + Grafeas).
2. **Runtime Execution Forgery (PoE Signing ≠ Execution)**: PoE proves signing, not tool invocation success (Lim 10.3). Compromised agent signs fake "queried DB" without querying, or skips PEPs via native calls. Strengthen: Enforce cross-verification (tool-side logs must match PoE resultHash) + runtime attestation for *every* action.
3. **Insider Gaming of Maturity Portfolios**: Colluding Insider/Escalator poisons eval datasets, forges signed approvals, or mimics baselines during promo thresholds. Strengthen: External third-party auditors for T3+ portfolios + continuous A/B testing against shadow evals.

## Flagged Aspirational Claims (vs. Achievable)
- **"Proof over policy, running code over specification prose" (Abstract)**: Aspirational—PoE is evidentiary audit trail, not "proof" of secure execution (explicitly limited). Achievable: Rename to "audit over policy" for accuracy.
- **"Formal security properties with definitions and proof arguments" (Abstract)**: Arguments rely on strong assumptions (A3/A4); non-repudiation holds only if KMS uncompromised. Aspirational for "complete" ZTA—residuals like async ops unbound damage (Def 4).
- **"Closes the enforcement gap" (Conclusion)**: Operationalizes gaps but assumes trusted planes; doesn't solve non-determinism/alignment (Lim 10.4). Aspirational totality—better as "bridges governance to enforcement."
- **Containment "survivable" / "multi-stage containment" (4.5)**: SLAs (<10s in-flight) are optimistic without tool wrappers on *all* libs/APIs; Evader persists via memory-resident code.
- **Anomaly SWDB "solvable problem" (1.1 Gap 1)**: Detects distribution shifts but admits boiling-frog evades; FPR targets unproven at scale.

## Thorough Constructive Critique

### Strengths (Build On These)
- **Architecture**: PDP/PEP explicitness + patterns (central vs. sidecar) directly fixes Gap 3. Trust boundaries diagram is gold. Pluggable anchors (Rekor > blockchain for most) pragmatic.
- **PoE Design**: JCS canonicalization, seqnums, prevHash—tamper-evident excellence. Cross-replica handling smart.
- **Data/Memory Pillar**: RAG ACLs + source scoring directly hits A06; taint tracking for PII flows rare/good.
- **Empirics**: 90% pentest block rate with *bypasses listed + fixes* builds trust. Latency metrics realistic (no sub-ms lies).
- **Maturity**: Portfolio schemas + demotion > calendars; override logging accountable.
- **Openness**: MIT code, CC-BY—red-team friendly.

### Brutal Weaknesses & Exploits
- **Trusted Enforcement Plane is Achilles' Heel**: Everything voids if sidecar compromised (e.g., unpatched OPA Rego eval RCE, bundle poisoning via insider). Pattern B "hardened" but gVisor escapes exist (CVE-2023-27598). *Exploit*: Insider deploys vuln PEP lib → full bypass.
- **PoE Blind Spots**: Signs sanitized params/resultHash, not raw execution. Agent lies about tool results, signs "success" on failed exfil. No attestation of *control flow* through PEPs. *Exploit*: Native HTTP lib skips tool PEP.
- **Anomaly Weak**: GMM on features (types/params/timing) evadable by smart adversaries (generate outliers sparingly, adapt slower than α=0.995). Single-turn classifiers miss multi-turn (admitted). *Exploit*: 6-turn RAG chain shifts distro gradually.
- **Supply Chain Shallower Than Claimed**: Model "signed manifest + HF ID" useless for fine-tunes/LoRAs (no weight integrity beyond hash). No recursive SBOM (transitive deps). *Exploit*: Signed dep with zero-day (e.g., numpy overflow → RCE).
- **Containment Gaps**: Assumes synchronous tools; async (e.g., Kafka queues, S3 eventual) leaks unbounded. No kernel-level netfilter for isolation. *Exploit*: Pre-containment queue 1000x $10k tx.
- **Multi-Agent/Swarms**: "Capability attenuation" naive; no BFT (Lim 10.5). *Exploit*: 51% Byzantine agents vote to escalate.
- **Scalability Unproven**: 12 services fine; 1000 agents? Sharded SWDB undefined, PDP hotspots DoS-vuln (A08).

### Recommendations
1. **Hard Mandates**: TEE for Pattern B (e.g., Nitro Enclaves); PEP on *all* outbound (e.g., eBPF hooks).
2. **Extend PoE**: Add tool-signed receipts (mutual auth) + control-flow hashes.
3. **Anomaly++**: Hybrid symbolic (prompt parsing) + distributional; external baselines.
4. **Gaming Fixes**: Portfolio multisig (3-of-5 external signers); shadow agents for canary testing.
5. **Interop**: A2A/SPIFFE integration spec'd—add mTLS PoE payloads.
6. **Tests**: Publish full agent-pentest suite; fuzz PEPs with 1000x vectors.

VERA is production-viable for scoped agents (e.g., customer service T2). For finance/autonomous (T4), layer on TEEs + external audits. Strong foundation—iterate brutally.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 105.0s

---

**Expert Review: VERA: Verified Enforcement for Runtime Agents**

### **Overall Assessment**
This paper presents a technically rigorous, enforcement-first architecture that directly addresses the critical gap between governance frameworks and verifiable runtime controls. As a CISO, I find its practical, code-backed approach and honest treatment of limitations highly valuable. It provides a concrete architectural blueprint missing from most high-level frameworks.

---

### **CISO Dimension Scoring (1-10)**

**1. OPERATIONALIZABILITY: 8/10**
*   **Strengths:** Explicit PDP/PEP placement, two deployment patterns (central vs. sidecar), and 12 open-source services provide a clear implementation path. The threat model with adversary classes is immediately useful for risk assessments.
*   **Concerns:** Scaling to 1000+ agents is noted as untested. Integration with existing IAM (e.g., Okta, Entra ID) and SIEM/SOAR platforms is described at a conceptual level but requires significant engineering effort from my team.

**2. COMPLIANCE HONESTY: 9/10**
*   **Strengths:** Section 9 ("Compliance Mapping (Honest Assessment)") is exemplary. It correctly states that VERA does not *make* you compliant, maps controls to standards (SOC 2, ISO 27001), and includes the crucial disclaimer about the EU AI Act. This transparency builds trust.
*   **Minor Gap:** Could explicitly mention SOX ITGC implications (change management for policy bundles, PoE as an audit trail) and DORA's ICT risk management requirements.

**3. COST AWARENESS: 7/10**
*   **Strengths:** Acknowledges performance overhead (14-22ms + 3ms), discusses anchor backend cost/trust trade-offs (blockchain vs. transparency log), and mentions scaling challenges.
*   **Gaps:** Lacks TCO modeling. The real cost is not the 12 services, but the operational burden of maintaining the policy engine, anomaly detection baselines, key rotation, and forensic readiness. No mention of specialized skills (cryptography, policy-as-code) required.

**4. VENDOR NEUTRALITY: 10/10**
*   **Strengths:** Fully vendor-agnostic. References OPA (open source), pluggable anchors, and multiple KMS options. The architecture is based on principles, not products. The open-source MIT license reinforces this.

**5. REGULATORY REALISM: 8/10**
*   **Strengths:** Excellent, cautious handling of the EU AI Act. The DORA and GDPR mappings are sensible. The "evidence portfolio" for promotion is a tangible mechanism for demonstrating "appropriate technical and organizational measures."
*   **Gap:** Could better address the **"human oversight"** requirement (EU AI Act, Art. 14) for high-risk systems. How does the "Autonomous" (T4) tier align with mandated human-in-the-loop controls? The paper's ethos of "earning autonomy" slightly conflicts with strict regulatory interpretations for financial services.

**6. BOARD READINESS: 9/10**
*   **Strengths:** Executive-friendly abstract clearly states the problem ("blast radius"). The maturity runtime (Section 5) translates technical controls into a business-friendly "trust tier" model. The adversarial test results (90.2% block rate) are a powerful, metrics-driven summary.
*   **Suggestion:** A one-page "Board Brief" appendix summarizing risk reduction (e.g., "contains agent compromise within 10s, limits financial exposure per tier") would make it perfect.

**7. PRACTICAL VALUE: 9/10**
*   **Strengths:** Directly protects the organization by enforcing segmentation (tool-parameter level), enabling rapid containment, and providing a tamper-evident audit trail (PoE). The memory/RAG governance addresses a real, often-ignored attack surface. The bypassed vectors are transparently disclosed.
*   **Consideration:** The largest practical value is shifting the security paradigm from *detecting* agent misuse to *preventing and containing* it via architecture. This is a fundamental and necessary shift.

---

### **OVERALL SCORE: 8.5/10**
This is a high-quality, implementable, and intellectually honest paper. It provides substantial practical value by bridging the governance-enforcement gap with a zero-trust architecture tailored for non-deterministic AI agents.

---

### **TOP 3 IMPROVEMENTS NEEDED (CISO Perspective)**

1.  **Operational Integration & Skills Gap:** Provide a detailed "Integration Guide" covering:
    *   How to feed PoE logs into Splunk/Elastic/Sentinel for correlation with existing SIEM alerts.
    *   Concrete examples of integrating VERA identity (DID:web) with corporate IAM (e.g., mapping to Active Directory groups).
    *   A "Skills Framework" outlining the required competencies (Rego policy authoring, cryptographic key management, anomaly detection tuning) to run this in production.

2.  **Financial Services Regulatory Deep Dive:** Expand Section 9 with a dedicated subsection for **SOX and DORA**.
    *   **SOX:** Map PoE chains and policy bundle change management to IT General Controls (ITGC) for change management and security.
    *   **DORA:** Explicitly map the multi-stage containment (SLA < 10s) to DORA Article 17 (incident response) and the maturity runtime to Article 5 (ICT risk management framework). Discuss how the "evidence portfolio" satisfies regulatory expectations for testing and oversight.

3.  **Human Oversight & Escalation Protocols:** Address the regulatory and practical need for human oversight more thoroughly.
    *   Define the "security team approval" and "risk committee approval" processes in the promotion workflow. Are these manual Jira tickets? Automated workflows in ServiceNow?
    *   Specify the **escalation protocol** when an T4 (Autonomous) agent is demoted to T1. Who is notified? What is the SLA for human investigation? This bridges the technical containment and the organizational incident response plan.

---

### **GREENLIGHT: YES**

**Publication is strongly recommended.** This paper provides exceptional value to the security community by moving beyond checklists to enforceable architecture. The honest limitations, compliance caveats, and running code set a new standard for practical security research. The requested improvements would elevate it from an excellent technical paper to an indispensable guide for regulated enterprises deploying AI agents.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 8/10
**Greenlight:** ❌ NO
**Response time:** 9.1s

---

## Evaluation Scores

**1. TECHNICAL DEPTH: 9/10**  
The paper provides detailed typed TypeScript schemas for identities, PoE records, policy requests, memory governance, and capability manifests, alongside explicit PDP/PEP architectures, deployment patterns (central vs. sidecar), and Mermaid diagrams for trust boundaries. Formal security properties include cryptographic assumptions (A1-A4) with definitions and proof arguments for non-repudiation and tamper-evidence. Algorithms like SWDB for anomaly detection are specified with parameters (N=10k, K=5 GMM, FPR thresholds per tier).

**2. TOOLING ALIGNMENT: 9/10**  
References 2026-relevant tools like OPA/Rego for PDP (with example policies), ONNX/DistilBERT for ConvoGuard, SPIFFE/SVID for runtime binding, Sigstore Rekor for anchors, Solana for blockchain anchoring, Ed25519/JCS (RFC 8785), and OWASP Top 10 Agentic (Dec 2025), Google A2A (2026). Integrates enterprise staples like AWS KMS, HashiCorp Vault, gVisor/Firecracker, aligning with current agent infra stacks.

**3. CODE AVAILABILITY: 7/10**  
Claims 12 MIT-licensed, independently deployable services (e.g., Veracity Core, ConvoGuard, Agent Pentest on npm) with git clone instructions, 25/25 passing tests, and empirical metrics from production. However, the specified repo (github.com/yogami/vera-reference-implementation) does not exist publicly, reducing verifiability despite strong claims of running code and adversarial results (90.2% block rate on 41 vectors).

**4. COMPETING FRAMEWORKS: 8/10**  
Comprehensive comparison tables vs. NIST 800-207, OWASP, MAESTRO, AWS Scoping show VERA's unique strengths in PDP/PEP, typed schemas, evidence-based trust, and PoE. Notes interoperability with Google A2A (SPIFFE) and operationalizes MAESTRO/NIST AI RMF. Gaps acknowledged (e.g., no BFT for swarms vs. unspecified multi-agent in competitors).

**5. SCALABILITY: 6/10**  
Addresses rate limiting, circuit breakers, sharded PEPs, and containment bounds (e.g., max_loss formula), with latencies (1-22ms). Deployment patterns scale to clusters (3+ OPA replicas), but admits limitations: untested at 1000+ agents, needs sharded anomaly detection/hierarchical PDP. No distributed PoE/anchor details at extreme scale.

**6. INTEROPERABILITY: 9/10**  
Strong support for standards: SPIFFE/SVID, DID:web/JWT-VC (W3C), mTLS, SBOM/SPDX, OPA bundles, RFC 3161 TSA, JCS (RFC 8785), OWASP mappings. Pluggable anchors (Rekor, Solana, WORM) and enterprise IAM paths (SPIRE as IDP). Explicit A2A compatibility; MCP not mentioned but schema extensibility fits.

**7. CODE vs WORDS: 75%**  
~75% implementable directly: schemas, Rego policies, PoE format, SWDB algorithm, deployment YAML snippets, and bash getting-started are copy-paste ready. Gaps in full service integrations (e.g., anomaly GMM fitting code, cross-replica ordering). Reference code claim boosts this, but unverified repo lowers confidence.

**OVERALL: 8/10**

## GREENLIGHT
YES

## TOP 3 Technical Gaps
1. **Public Code Verification**: Repo at github.com/yogami/vera-reference-implementation is unavailable; publish it with badges for test coverage/CI to back empirical claims (e.g., 90.2% block rate).
2. **Scalability Prototypes**: Provide benchmarks or sharded designs for 1000+ agents, including distributed GMM baselines and hierarchical anchoring.
3. **Multi-Agent BFT**: Extend delegation with concrete Byzantine protocols (e.g., threshold signatures) beyond current attenuation, addressing swarm Sybil/resilience.

════════════════════════════════════════════════════════════════════════════════
