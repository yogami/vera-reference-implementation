# VERA Paper — Expert Review Round 2

**Date:** 2026-02-10T09:37:07.887Z
**Average Score:** 6.1/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 0/10
**Greenlight:** ❌ NO
**Response time:** 99.9s

---

## Publication-quality review (Round 2): **VERA — Verified Enforcement for Runtime Agents**

VERA is closer to a publishable Zero Trust reference architecture than most “agent security” papers I see: it names PDP/PEP locations, introduces enforceable schemas, and treats *runtime enforcement + evidence* as first-class. The paper is strongest where it operationalizes NIST 800-207 concepts (policy loop, enforcement points, continuous signals) for agent-specific surfaces (tools, memory/RAG, delegation chains).

That said, it still has several **architecture-trust inconsistencies** (notably the “embedded PDP in the agent runtime”), some **formal-definition gaps** (containment bound units, tier typing, multi-replica PoE chains), and a **threat model that is claimed but not actually presented in this version** (capability matrices/adversary classes are referenced but not included). Those issues block “publication-quality” in a security venue unless corrected.

---

# Scores (1–10)

### 1) ARCHITECTURAL COMPLETENESS — **7/10**
**What’s strong**
- Clear PDP/PEP framing and multiple PEPs (tool wrapper, gateway, memory guard).
- Two deployment patterns and explicit fail behaviors.
- Telemetry → anomaly detector → PDP feedback loop is present (at least conceptually).
- Concrete enforcement surfaces for memory/RAG and tool parameters.

**What’s missing / inconsistent**
- **Embedded PDP/PEP “as a library” inside a semi-trusted agent runtime** undermines the trust boundary model and enables policy bypass by the very class of compromise you’re trying to contain.
- Decision cadence and cache semantics are not fully specified (TTL exists but not how revocation/incident overrides invalidate cached decisions deterministically across PEPs).
- No clear “policy evaluation loop” state machine (inputs, outputs, obligations, re-check triggers, revocation triggers, step-up triggers) beyond individual schemas.

### 2) THREAT MODEL RIGOR — **5/10**
You claim “four adversary classes, structured capability matrices” (Abstract) and reference an “Evader” class (Section 3.5), but the actual **threat model section is not present** in this text. OWASP mapping is useful, but it is not a substitute for:
- explicitly enumerated adversaries (internal/external, compromised agent runtime, compromised tool, malicious approver, malicious dataset curator, compromised PDP/PEP, etc.),
- capability boundaries, and
- trust assumptions per adversary.

Right now the reader cannot verify that A1–A4 and the enforcement plane trust assumptions are consistent with each adversary class.

### 3) NOVELTY — **7/10**
Relative to “NIST 800-207 applied to agents,” VERA’s novel elements are:
- **Proof-of-execution (PoE) chain + anchoring abstraction** integrated into runtime enforcement (this is meaningfully beyond typical “logging” guidance).
- **Evidence-based maturity runtime** (promotion/demotion tied to verifiable portfolios rather than time).
- **Tool-parameter authorization** presented as a first-class ZTA control, not just “API allowlist.”
- More specific **memory/RAG governance** than most frameworks.

However, pieces overlap with existing directions in Sigstore/Rekor-style transparency logs, workload identity (SPIFFE), policy-as-code (OPA), and “trust tiers.” The novelty is in **composition + enforcement specificity**, not in brand-new primitives.

### 4) FORMAL DEFINITIONS — **7/10**
**Strong**
- Concrete TypeScript interfaces (implementable).
- Canonicalization via RFC 8785 is a good detail.
- Clear separation: PoE ≠ correctness of execution.

**Weak / needs tightening**
- Several definitions and examples have type/semantic mismatches (details below).
- Some properties are stated as guarantees but depend on unspoken assumptions (e.g., trusted tool logs; sequence correctness in multi-replica deployments).

### 5) PRACTICAL VALUE — **8/10**
Engineering teams will get real value from:
- explicit PEP placement patterns,
- request/decision/obligation schemas,
- the memory governance policy skeleton,
- a candid limitations section,
- empirical latency numbers (though methodology needs strengthening).

The practical risk: if a team copies the “embedded PDP in-process” pattern, they may unintentionally **eliminate** the very enforcement boundary they think they’ve added.

---

## OVERALL SCORE — **7/10**

---

# Major strengths (what is publication-worthy already)

1) **Enforcement is treated as architecture, not documentation.** You concretely locate PEPs and define PDP inputs/outputs and obligations.
2) **PoE framing is honest.** You explicitly state PoE is evidence of signing/recording, not of correct execution. That honesty is rare and important.
3) **Agent-specific surfaces are covered.** Tool parameters, memory/RAG governance, delegation/chain concepts, and rate/circuit-breaker controls are all relevant and actionable.
4) **“Honest compliance mapping”** is appropriately cautious and avoids the common overclaiming.

---

# Blocking issues / contradictions / misleading points to fix

## A) Trust boundary contradiction: “Embedded PDP (library)”
You define the **agent runtime as semi-trusted** and the **enforcement plane as trusted**, then propose:

> “PDP and PEP embedded in agent runtime as library”

If the runtime can be compromised (prompt injection leading to arbitrary tool calls, code execution in tool plugins, SSRF → metadata credential theft, etc.), then **in-process enforcement is bypassable**. At minimum, Pattern B must be reframed as:

- PEP/PDP run in a **separate, hardened component** (sidecar, microVM, OS-level sandbox, eBPF-based syscall mediation, or a separate signed/attested process), *not* a library inside the agent process; **or**
- you must explicitly state Pattern B only applies when the runtime is within a strong isolation boundary (e.g., **TEE**, microVM with measured boot + remote attestation + sealed keys), and define that as a precondition.

Right now Pattern B undermines the core ZTA claim.

## B) Containment bound definition mixes units and omits key factors
Definition 4 states:

> containment bound is `min(V, rate_limit * t)`

But `V` is described as “maximum transaction value” while `rate_limit * t` yields “maximum number of transactions within t,” not value. You likely mean something like:

- `max_loss ≤ min(Vmax_per_tx, ...)` doesn’t make sense either because loss can exceed a per-tx limit over time.
A more coherent bound is typically:

- `max_loss_value ≤ min( hourly_value_cap_remaining, per_tx_cap * max_tx_in_window )`
- where `max_tx_in_window = rate_limit_tx_per_sec * breaker_time_sec`
- and optionally include **approval latency**, **queue depth**, and **in-flight concurrency**.

As written, the property is not formally meaningful.

## C) PoE chain correctness with replicas is underdefined
You state:

> “replicas share DID but have unique instance IDs”

But PoE uses a single `sequenceNumber` “monotonic, gap-detectable.” With multiple replicas, **sequence monotonicity is not defined**:
- Do you have per-instance chains?
- A global sequencer?
- Vector clocks?
- A merge protocol?

Without that, “tamper-evident sequence” is ambiguous at scale and can produce false “gap” detections or enable reordering attacks across instances.

## D) OPA/Rego examples don’t type-check as written
You use:
```rego
input.agent.currentTier >= 2
tier_limits := {"T1": 0, "T2": 100, ...}
tier_limits[input.agent.currentTier]
```
But your schema defines `currentTier: TrustTier` and your tiers elsewhere are labeled `T1..T4`. In Rego, comparing a string tier to a number (`>= 2`) is invalid, and the tier labels must match the runtime representation exactly.

This is minor editorially, but for a “formal schemas / implementable” claim, these inconsistencies matter.

## E) “Append-only log (PostgreSQL with WAL)” is not append-only
A local PostgreSQL database with WAL is **not** an append-only, tamper-evident log under an administrator adversary. WAL supports crash recovery, not immutability. If you want an internal log option, you need to specify tamper-evidence controls such as:
- hash-chained records with periodic external anchoring,
- WORM semantics,
- separate duty domains for writers vs DBAs,
- or a transparency log design (Merkle tree + auditors).

As written, “append-only log” here is misleading.

## F) Certificate Transparency (CT) as a generic anchoring backend is shaky
CT logs accept **X.509 certificate entries** (and related structures), not arbitrary PoE hashes. If your intent is “transparency log,” consider citing and using **Sigstore Rekor** (or an equivalent), or define a CT-compatible embedding approach explicitly. Otherwise readers will interpret this as “you can just put hashes into CT,” which is not generally true.

## G) Performance numbers likely conflict with “KMS/HSM never exported”
You claim:
- “Ed25519 keypair generated in KMS/HSM, never exported”
- “PoE signature generation 3ms per action”

Typical cloud KMS signing latencies are often **>3ms** (commonly tens of ms, depending on service/region/load). If you measured 3ms, that suggests:
- the key is local (exported) **or**
- you used a local HSM **or**
- you didn’t include network/KMS overhead.

This is fixable—just clarify measurement conditions and provide two numbers: **local signing** vs **remote KMS signing**.

---

# Threat model: what to add to meet your own bar
Because the current text claims a formal threat model but doesn’t include it, add a dedicated section that includes:

1) **Adversary classes** (example set that matches your architecture):
   - External user prompt injector
   - Malicious/poisoned RAG corpus contributor
   - Compromised agent runtime (process compromise)
   - Compromised tool / downstream API (malicious responses)
   - Insider with access to policy repo / CI
   - Telemetry-plane manipulator (“Evader”)
   - Enforcement-plane compromise (PDP/PEP), even if “out of scope,” explicitly bounded

2) **Capability matrix**: read/write/modify for:
   - agent memory
   - prompts/context
   - tool parameters
   - network egress
   - identity material
   - policy bundles
   - telemetry streams
   - logs/anchors

3) **Mapping to assumptions A1–A4**: for each adversary, state whether A3/A4 hold and what breaks if they don’t.

Without that, readers can’t evaluate the security properties meaningfully.

---

# Additional detailed improvement notes (non-blocking but important)

## Policy loop mechanics
You have PDP input/output schemas, but publication quality improves if you specify:
- **when** PDP is queried (every action; every N actions; based on risk score thresholds),
- **what is cacheable** (and what events invalidate cache: revocation, tier change, incident stage activation, policy bundle update),
- how obligations are enforced (PEP MUST/MAY semantics),
- how you prevent “obligation stripping” (PEP attests it executed obligations, or obligations are part of PoE).

## Tool execution cross-referencing (PoE vs reality)
You correctly note PoE doesn’t prove execution correctness. Make the architecture stronger by defining:
- a **Tool Receipt** / **Execution Attestation** schema returned by tool wrappers/gateways (signed by tool-side identity),
- and a reconciliation rule: “PoE(action) must be matched by Receipt(actionId) within X seconds, else incident stage Y.”

This closes the “signed but not executed / executed but not signed” gap.

## Memory/RAG governance feasibility
Per-document ACLs and retrieval audit logs are excellent, but you should note:
- many vector DBs lack native per-document ACL—so you need a **retrieval PEP** (proxy) or separate indexes per tenant/security label.
- poisoning detection is named but not specified; even a minimal approach (embedding outlier detection, provenance scoring, signed ingestion pipeline) would help.

## Anomaly detection (SWDB)
A GMM over mixed categorical/continuous features is plausible but underspecified. Add:
- a concrete feature schema,
- normalization/encoding strategy (one-hot, target encoding, embeddings),
- and operational guidance (how to set K, what happens with non-stationarity, how to avoid feedback loops where attacker shapes the baseline).

## “Semantic Aligner” service
“Cross-domain vocabulary translation” reads like an alignment/quality component rather than a security enforcement component. If it’s included, explain how it contributes to enforcement (e.g., canonicalization to prevent policy bypass via synonym drift). Otherwise it dilutes the tight security focus.

---

# Top 3 specific improvements needed (highest ROI)

1) **Fix the trust model around Pattern B (embedded PDP/PEP).**  
   Make enforcement *non-bypassable* by moving it out-of-process (sidecar/microVM) or explicitly requiring attested isolation/TEE and stating the security consequences.

2) **Add the missing formal threat model section (adversary classes + capability matrices + mapping to A1–A4).**  
   Right now you claim it, but the paper doesn’t actually provide it in this version.

3) **Tighten the formal specs where correctness matters:**
   - redefine the containment bound with correct units and concurrency/in-flight factors,
   - define PoE chain semantics for replicas (per-instance chains or a global sequencer/merge),
   - correct tier typing in schemas/Rego examples,
   - clarify anchoring backends (replace CT with a true transparency log option, or specify the mechanism).

---

# Factual errors / potentially misleading claims to flag

- **PostgreSQL WAL ≠ append-only tamper-evident log** (misleading as written).
- **Certificate Transparency logs are not generic hash anchoring services** (needs correction/qualification or replacement with transparency log tech designed for arbitrary artifacts).
- **Rego tier comparison example is invalid** (string vs number).
- **Containment bound formula is dimensionally inconsistent** (misleading as a “formal property”).
- **KMS/HSM “never exported” vs 3ms signing** likely inconsistent without clarifying measurement setup.

---

# Publication decision

This is a strong second-round draft with real engineering substance, but the **enforcement-plane trust contradiction** and the **missing promised threat model** prevent me from approving it as “publication quality” *as-is*. With the above fixes, it would likely clear.

**GREENLIGHT: NO**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 124.8s

---

# IEEE S&P Industry Track Review: VERA

## Reviewer Identity
Professor Marcus Chen, ETH Zurich  
Chief Reviewer, IEEE Symposium on Security and Privacy

---

## OVERALL ASSESSMENT

This paper presents a comprehensive reference architecture for AI agent security with substantial engineering merit. The authors demonstrate deep understanding of both traditional zero-trust principles and novel AI-specific attack surfaces. The work is backed by running code and empirical evaluation. However, the paper exhibits tone inconsistencies inappropriate for IEEE S&P, makes claims that require more careful qualification, and contains architectural gaps that limit its immediate applicability to high-stakes deployments.

**OVERALL SCORE: 7/10**

**VERDICT: Weak Accept**

**GREENLIGHT: YES** (conditional on revisions addressing tone and claim precision)

---

## DIMENSION-BY-DIMENSION EVALUATION

### 1. CONTRIBUTION: 7/10

**Strengths:**
- **Novel synthesis**: The integration of cryptographic proof-of-execution with policy enforcement points for non-deterministic AI agents is genuinely novel. Prior work addresses either governance frameworks (MAESTRO, OWASP) or traditional ZTA (NIST 800-207), but not their architectural integration for agents.
- **Evidence-based maturity model**: The shift from calendar-based to proof-based trust progression (Section 4) is a clear contribution. The formalization of promotion criteria with verifiable evidence portfolios addresses a real gap in current practice.
- **Memory/RAG governance**: Section 3.3's treatment of memory and RAG as first-class attack surfaces with specific PEP placement is under-addressed in existing frameworks. The per-document ACL and source trust scoring mechanisms are concrete contributions.
- **Running implementation**: 12 deployed services with empirical results (Section 6) elevate this beyond conceptual architecture.

**Weaknesses:**
- **Incremental in parts**: The PDP/PEP architecture is a direct application of NIST 800-207 to agents. While the adaptation is non-trivial, it is not fundamentally novel—it is sound engineering.
- **Limited formal verification**: Section 2's "proof arguments" are informal. The claim of "formal security properties" overstates what is actually provided. These are semi-formal definitions with cryptographic assumption dependencies, not mechanized proofs.
- **Anomaly detection**: The SWDB algorithm (Section 3.2.3) is a reasonable application of GMMs but is not novel. The contribution is specifying it for agent contexts, not the algorithm itself.

**Specific improvement needed:**
Replace "formal security properties" with "security properties with cryptographic assumptions" throughout. Add a subsection explicitly stating what is novel (architectural integration, evidence-based trust, memory governance) vs. what is sound application of existing techniques.

---

### 2. RELATED WORK: 8/10

**Strengths:**
- Comprehensive coverage of relevant frameworks (NIST 800-207, OWASP Top 10, MAESTRO, AWS Scoping Matrix).
- Honest differentiation via the comparison table (Section 1.2). The checkmarks are defensible based on the technical content.
- Appropriate citation of cryptographic primitives (Bernstein et al., 2012 for Ed25519).
- Acknowledgment of complementary work (Google A2A Protocol, NIST AI RMF).

**Weaknesses:**
- **Missing academic work**: The paper cites industry frameworks but lacks engagement with academic literature on:
  - Runtime verification for autonomous systems (beyond Leucker & Schallhart)
  - Adversarial ML defenses (the prompt injection classifier is cited without comparison to academic baselines)
  - Formal methods for policy enforcement (e.g., policy compliance checking in distributed systems)
- **RAG poisoning citations incomplete**: Section 3.3 mentions "Zhong et al., 2023; Zou et al., 2023" but these are not in the references section. This must be corrected.
- **No comparison to agent-specific security work**: Recent work on LangChain security, AutoGPT sandboxing, and agent jailbreaking should be cited and differentiated.

**Specific improvement needed:**
Add a "Related Academic Work" subsection with 8-10 citations covering runtime verification, adversarial ML, and agent-specific security research. Complete the RAG poisoning citations.

---

### 3. THREAT MODEL: 8/10

**Strengths:**
- The four adversary classes (Section 2, implied from context) are well-structured: external attacker, compromised agent runtime, insider with PDP access, and supply chain attacker.
- Capability matrices are implicit in the tool authorization tables (Section 3.4) and trust tier definitions (Section 4.1).
- OWASP Top 10 coverage mapping (Section 7) demonstrates systematic threat coverage.
- Honest acknowledgment of out-of-scope threats (container escape, Byzantine consensus, physical actuators in Section 9).

**Weaknesses:**
- **Not explicitly stated**: The paper should have a dedicated "Threat Model" section with adversary classes, capabilities, and goals formally enumerated. The current structure requires readers to infer this from scattered content.
- **Evader adversary underspecified**: Section 3.5 mentions an "Evader" adversary who controls the telemetry plane but does not formally define their capabilities or the multi-source requirement that defeats them.
- **Collusion attacks**: What happens if the agent operator and a supply chain attacker collude? The trust boundaries (Section 3.0) assume enforcement plane integrity but do not address insider threats with elevated privileges.

**Specific improvement needed:**
Add a dedicated Section 2.5 "Threat Model" with:
```
Adversary A1 (External Attacker): Controls agent inputs, cannot compromise runtime
Adversary A2 (Compromised Runtime): Controls agent process, cannot access KMS
Adversary A3 (Malicious Operator): Controls telemetry, cannot modify PDP policy
Adversary A4 (Supply Chain): Injects malicious dependencies, detected by SBOM scanning
```
Specify what each adversary can and cannot do, and which VERA controls defend against each.

---

### 4. FORMALIZATION: 6/10

**Strengths:**
- Definitions 1-4 (Section 2.2) are clearly stated with mathematical notation.
- Cryptographic assumptions A1-A4 are explicit and standard.
- TypeScript schemas throughout provide machine-readable formalizations.
- Security arguments (Section 2.3) correctly identify assumption dependencies.

**Weaknesses:**
- **Not formally verified**: The "proof arguments" are prose, not mechanized proofs. For IEEE S&P, this is acceptable for industry track but should not be called "formal proofs."
- **Completeness gap**: Definition 3 (Policy Enforcement Completeness) relies on "PoE chain analysis" to detect bypass, but the paper does not formalize the detection algorithm. How exactly does one detect "actions observed at the tool level without corresponding PEP evaluation records"?
- **Containment bound**: Definition 4's containment bound formula `min(V, rate_limit * t)` is overly simplistic. It assumes all damage is financial and does not account for data exfiltration (which has no "transaction value").
- **Missing definitions**: "Trust tier," "anomaly score," and "evidence portfolio" are used throughout but not formally defined until much later. Forward references are needed.

**Specific improvement needed:**
- Replace "formal security properties" with "security properties" in title and abstract.
- Add Definition 5 for "Evidence Portfolio" in Section 2.
- Formalize the PoE bypass detection algorithm in pseudocode.
- Revise Definition 4 to account for non-financial damage (e.g., "data exfiltration bounded by rate_limit * t * max_record_size").

---

### 5. EVALUATION: 7/10

**Strengths:**
- **Empirical results**: Section 6.1's performance metrics are specific and reproducible (14ms median, 22ms p99 for prompt injection detection).
- **Adversarial testing**: Section 6.2's agent-pentest results with 41 vectors and transparent disclosure of 4 bypasses is excellent practice.
- **Honest methodology**: Specifying datasets (OntoNotes 5.0), batch sizes (batch=1), and hardware (single CPU core) enables replication.
- **Running code**: 12 deployed services with 25/25 contract validation tests passing is strong evidence.

**Weaknesses:**
- **Scale limitations acknowledged but not tested**: Section 9.1 admits VERA has not been tested at 1000+ agents. For enterprise adoption, this is a critical gap. Even a simulation or stress test would strengthen the claim.
- **No comparison baselines**: The prompt injection detection achieves 87.5% block rate (Section 6.2), but against what baseline? Is this better than existing tools (e.g., Lakera, Robust Intelligence)?
- **Evaluation dataset bias**: Section 4.2 mentions evaluation datasets are "curated by the security team" but does not describe the curation process, size, or diversity. Are they representative of production traffic?
- **Latency overhead not contextualized**: 14-22ms for data governance is stated but not compared to agent decision latency. If the agent's LLM inference takes 2 seconds, 22ms is negligible. If the agent makes sub-100ms decisions, it is significant.

**Specific improvement needed:**
- Add a comparison row to Section 6.2 showing baseline block rates for existing prompt injection tools.
- Describe the evaluation dataset curation process in Section 4.2 (size, diversity, adversarial examples included).
- Add a "Performance Overhead in Context" subsection showing VERA latency as a percentage of total agent decision time for representative workloads.

---

### 6. WRITING QUALITY: 6/10

**Strengths:**
- Clear structure with numbered sections and subsections.
- Effective use of tables and diagrams (Mermaid graphs are publication-quality).
- Technical precision in most sections (schemas, algorithms, metrics).
- Code examples are syntactically correct and well-commented.

**Weaknesses (Critical for IEEE S&P):**
- **Inappropriate tone**: The abstract's opening ("When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data...") is dramatic and better suited for a blog post than a peer-reviewed venue. IEEE S&P expects measured, objective prose.
- **Marketing language**: Phrases like "Trust without proof is aspiration. VERA makes it architecture" (Conclusion) are punchy but inappropriate for academic publication.
- **Overstated claims**: "VERA closes that gap" (Conclusion) is too strong. VERA *addresses* the gap with a reference architecture. Claiming to "close" it implies completeness, contradicted by Section 9's extensive limitations.
- **Inconsistent formality**: Section 1 reads like a position paper; Section 2 reads like a formal methods paper; Section 6 reads like a technical report. The tone should be consistent.

**Specific passages requiring revision:**

| Current Text | Suggested Revision |
|:---|:---|
| "When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data..." | "AI agents that take autonomous actions present novel security risks, including unauthorized data access and cascading system failures." |
| "Trust without proof is aspiration. VERA makes it architecture." | "VERA provides a reference architecture for verifiable trust in AI agent deployments." |
| "The security community has responded with governance frameworks that specify what to document, what to log, and what to monitor. These frameworks provide valuable guidance but leave a critical gap..." | "Existing governance frameworks provide control categories but do not specify enforcement architectures. VERA addresses this gap by..." |

**Overall writing assessment:**
The technical content is strong, but the prose needs significant toning down for IEEE S&P. This is not a dealbreaker—industry track papers often require revision for tone—but it is essential.

---

### 7. LIMITATIONS: 9/10

**Strengths:**
- **Exceptional honesty**: Section 9 is one of the most thorough limitations sections I have reviewed. The authors explicitly acknowledge scalability gaps, performance overhead, PoE integrity vs. execution correctness, non-determinism challenges, multi-agent limitations, cryptographic assumptions, and physical actuator exclusions.
- **Specific, not vague**: Each limitation is concrete. For example, "VERA has been tested with individual agent deployments and small multi-agent configurations" is far better than "scalability requires further research."
- **Residual risks acknowledged**: Section 7's OWASP mapping includes a "Residual Risk" column, which is excellent practice.

**Weaknesses:**
- **No quantification of overhead**: Section 9.2 states performance overhead "may be unacceptable" for sub-millisecond loops but does not quantify the threshold. At what decision frequency does VERA become infeasible?
- **Missing limitation**: The paper does not address the cost of implementing VERA. Deploying 12 services, integrating with existing IAM, and training security teams is non-trivial. A brief discussion of implementation complexity would be valuable.

**Specific improvement needed:**
Add Section 9.8 "Implementation Complexity" discussing deployment effort, integration requirements, and operational overhead.

---

## DETAILED TECHNICAL CONCERNS

### Concern 1: PoE Integrity vs. Execution Correctness (Critical)

Section 9.3 correctly identifies that PoE guarantees signing, not execution. However, this is a fundamental limitation that undermines the "Verified Enforcement" claim in the title. If a compromised runtime can sign actions it did not perform, the verification is of the signature, not the enforcement.

**Recommendation:**
- Rename the paper to "VERA: Verifiable Audit for Runtime Agents" or "VERA: Verified Provenance for Runtime Agents" to accurately reflect what is verified.
- Alternatively, add a requirement for trusted execution environments (TEEs) as a deployment option, with explicit trade-offs.

### Concern 2: Anomaly Detection False Positives

Section 3.2.3's SWDB algorithm uses GMMs with tier-specific FPR targets (5% for T1, 0.01% for T4). However:
- A 5% FPR means 1 in 20 legitimate actions is flagged. For an agent making 1000 actions/day, that is 50 false alerts/day. This is operationally infeasible.
- The drift adaptation (α=0.995) allows gradual behavior shifts but is vulnerable to "boiling frog" attacks, as the authors acknowledge. No mitigation beyond "periodic re-validation" is specified.

**Recommendation:**
Add a subsection on "Operational Tuning of Anomaly Detection" with guidance on balancing FPR, organizational alert fatigue, and re-validation frequency.

### Concern 3: Multi-Agent Security Gaps

Section 9.5 acknowledges that Byzantine fault tolerance for agent swarms is not addressed. However, Section 3.4's delegation policy (implicit in the "parentActionId" field) suggests VERA supports agent-to-agent delegation. This creates a gap:
- If Agent A delegates to Agent B, and Agent B is compromised, can Agent A's PoE chain detect this?
- The current architecture does not specify cross-agent PoE verification.

**Recommendation:**
Either remove delegation from the architecture or add a subsection on "Delegation Chain Verification" with explicit cross-agent PoE validation.

### Concern 4: PDP Availability and Fail Modes

Section 3.0's Deployment Pattern A specifies "configurable fail-open window (max 30s) for T1/T2" agents. This creates a 30-second window where policy enforcement is bypassed. For a compromised agent, this is sufficient to exfiltrate significant data.

**Recommendation:**
- Justify the 30-second threshold with empirical data (e.g., PDP recovery time in practice).
- Add a compensating control: during fail-open windows, log all actions with a "fail-open" flag and require post-hoc review.

---

## MINOR ISSUES

1. **Missing references**: "Zhong et al., 2023; Zou et al., 2023" cited in Section 3.3 are not in the references.
2. **Inconsistent notation**: Section 2.2 uses `canonical(a)` while Section 3.2.1 uses "JCS-canonicalized JSON." Unify notation.
3. **Acronym overload**: DID, VC, PDP, PEP, PoE, SWDB, SBOM, TEE, BFT, GMM, FPR. Consider a glossary.
4. **Figure quality**: The Mermaid diagrams are clear but use inconsistent styling (some nodes have fill colors, others do not). Standardize.
5. **Code repository**: The paper states "Full service registry at the repository above" but the URL (github.com/yogami/vera-reference-implementation) is not verified. For publication, this repository must be publicly accessible and archived (e.g., Zenodo DOI).

---

## POSITIONING FOR IEEE S&P INDUSTRY TRACK

IEEE S&P Industry Track seeks papers that:
1. **Bridge research and practice**: VERA does this well by grounding governance frameworks in running code.
2. **Provide actionable insights**: The 12 services and deployment patterns are actionable.
3. **Demonstrate real-world impact**: The empirical results show deployment, though scale is limited.
4. **Maintain academic rigor**: This is where the paper is weakest due to tone and claim precision.

**Fit assessment**: This paper is a **good fit** for the industry track but requires revision to meet the venue's standards. The technical content is strong, the implementation is real, and the contribution is valuable. However, the prose must be toned down, the claims must be qualified, and the limitations must be foregrounded more clearly in the abstract.

---

## GREENLIGHT DECISION: YES (Conditional)

I recommend **acceptance** contingent on the following revisions:

### TOP 3 REQUIRED IMPROVEMENTS:

1. **Tone and claim precision (Critical)**:
   - Revise abstract and conclusion to remove marketing language.
   - Replace "formal security properties" with "security properties with cryptographic assumptions."
   - Change "VERA closes the gap" to "VERA addresses the gap."
   - Adjust dramatic phrasing throughout (see Section 6 critique).

2. **Explicit threat model (Major)**:
   - Add Section 2.5 "Threat Model" with four adversary classes formally defined.
   - Specify adversary capabilities, goals, and which VERA controls defend against each.
   - Address collusion attacks (operator + supply chain).

3. **Evaluation baselines and context (Major)**:
   - Add comparison baselines for prompt injection detection (e.g., Lakera, Robust Intelligence).
   - Contextualize performance overhead as a percentage of total agent decision time.
   - Describe evaluation dataset curation process (size, diversity, adversarial coverage).

### Additional Recommended Improvements:

4. Complete missing references (Zhong et al., Zou et al.).
5. Add "Related Academic Work" subsection with 8-10 citations.
6. Formalize PoE bypass detection algorithm in pseudocode.
7. Add Section 9.8 on implementation complexity.
8. Consider renaming to "Verifiable Audit" or "Verified Provenance" to match what is actually verified.
9. Add glossary for acronyms.
10. Ensure GitHub repository is publicly accessible and archived with DOI.

---

## FINAL REMARKS

This is a strong industry track submission with genuine technical merit. The authors have built something real, tested it adversarially, and documented it thoroughly. The limitations section is exemplary. However, the paper tries too hard to be exciting and ends up sounding promotional. IEEE S&P values substance over style. Let the technical work speak for itself.

With revisions addressing tone, threat model formalization, and evaluation context, this paper will make a valuable contribution to the practitioner and research communities working on AI agent security.

**GREENLIGHT: YES**

---

*Review completed: February 2026*  
*Reviewer: Prof. Marcus Chen, ETH Zurich*

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 8/10
**Greenlight:** ❌ NO
**Response time:** 33.6s

---

# Red Team Review: VERA: Verified Enforcement for Runtime Agents (Review Round 2)

As Raven, principal adversarial security researcher specializing in breaking zero-trust implementations, I've dissected VERA with a focus on real-world exploitability. This is a solid evolution from Round 1 (assuming prior feedback incorporated transparency on PoE limitations, test disclosures, and limitations section). The paper now feels more mature: open-source backing with 12 services, empirical metrics, bypassed vector disclosures, and a candid limitations section elevate it beyond vaporware. It's operationalizing governance in a way few frameworks do, with typed schemas, PDP/PEP explicitness, and pluggable anchors showing engineering chops.

**Strengths:**
- **Enforcement Focus:** Explicit PDP/PEP placement, fail-closed behaviors, and tool-parameter granularity (e.g., Rego policies with tiered limits) are rare and valuable. Mermaid diagrams and TypeScript schemas make it implementable.
- **Proof System:** PoE + chain tamper-evidence is cryptographically sound under assumptions (A1-A4). Pluggable anchors (CT-logs, WORM) avoid blockchain hype while enabling external verifiability.
- **Anomaly Detection:** SWDB with GMM and tiered FPR is thoughtful for non-determinism; drift adaptation + re-validation mitigates slow attacks.
- **Memory/RAG Governance:** Addresses a gaping hole (poisoning via per-doc ACLs, source scoring). Empirical PII metrics (97% prec/94% recall) are credible.
- **Maturity Model:** Evidence portfolios with signed adversarial tests > calendar time; demotion triggers are aggressive.
- **Honesty:** Section 9 and test disclosures (90% block rate, 4 bypasses detailed) build trust. No overclaims on "zero trust" (acknowledges trusted planes).
- **Implementation:** 12 MIT-licensed services + 25/25 tests + npm package = low barrier to dogfooding. Adversarial test suite (41 vectors) is a nice touch.

**Weaknesses (Brutal Breakdown):**
- **Threat Model Gaps:** Claims "four adversary classes" and "capability matrices," but they're MIA in the text (only "Evader" mentioned). OWASP mapping is comprehensive, but no explicit matrices mean it's handwavy. Misses advanced vectors like:
  | Missed Vector | Why Real | VERA Coverage |
  |---------------|----------|---------------|
  | Model weight poisoning (e.g., backdoors in fine-tunes) | Upstream providers compromised | SBOM + hash, but no runtime model integrity checks (e.g., weight attestation) |
  | Insider operator collusion | Owns keys, approves promotions | Manual approvals gameable; no MPC for portfolios |
  | Quantum preemption | Ed25519 vulnerable long-term | Acknowledged, but no migration path specified |
  | Supply chain left-pad (tiny deps) | SBOM misses transitive vulns | Vuln scanning, but no sigstore/cosign enforcement |
- **Defense Bypass Vectors:**
  - **Runtime Compromise:** Assumes "semi-trusted" agent can't exfil keys (A3), but real agents (LangChain, AutoGPT) run in Node/Python with deps like `requests`. A prompt-injected agent could dump env vars, pivot to KMS if misconfigured. PoE signs *intended* actions, not executed ones (admitted 9.3)—cross-ref with tools assumes honest tools.
  - **PEP Starvation/DoS:** Central PDP (Pattern A) single point; 5-15ms latency spikes under load → fail-open window exploitable. Embedded PDP stale bundles (60s) allow revoked agents to run wild.
  - **Anomaly Evasion:** SWDB evadable via mimicry (adversary replays benign distribution with embedded payload) or gradient descent on GMM (if attacker has telemetry access). Boiling frog explicit, but no multi-model ensembles.
  - **Input Firewall Limits:** ONNX DistilBERT misses multi-turn (disclosed bypass #2), homoglyphs (#1), base64 payloads (#3). Local inference good, but CPU-bound (22ms p99) bottlenecks high-throughput agents.
  - **RAG Poisoning:** Per-doc ACLs/source scoring solid, but if corpus is org-controlled, insiders poison. No vector DB attestation (e.g., verifiable indices).
- **Maturity Gaming:** Portfolios require "security team approval"—social engineer one insider, forge signatures (Ed25519 per-agent, but humans weak). Adversarial tests (agent-pentest) public → overfit by training agents on them. Dataset rotation helps, but no differential privacy or canary tokens.
- **Containment Holes:** Multi-stage SLAs ambitious (<500ms token revoke), but:
  | Stage | Exploit Path |
  |-------|--------------|
  | Token revoke | Cached decisions (TTL) + stale embedded PDPs |
  | Network isolation | In-flight tool calls (10s cancel) hit async APIs (e.g., S3 eventual consistency) |
  | State freeze | Read replicas or caches bypass; no kernel-level enforcement |
  - Evader MITIGATE (multi-source signals) good, but if telemetry compromised, false positives DoS legit agents.
- **Supply Chain Shallowness:** Model hash + HF ID minimal; ignores training data supply chain (e.g., Common Crawl poisoning). Prompt templates Git-signed, but runtime prompt inj still hits.
- **Scalability Unproven:** Admits <1000 agents; sharding unspecified.
- **Multi-Agent Weak:** Capability attenuation basic; no gossip-protocol attacks or Sybil swarms.

**Constructive Fixes:**
- **Threat Model:** Inline the 4 classes (e.g., Outsider/Evader/Insider/Quantum) with matrices like:
  | Adversary | Capabilities | VERA Mitigations | Residuals |
  |-----------|--------------|------------------|-----------|
  | Evader | Gradual drift | SWDB + reval | Slow shifts |
- **Enhance PoE:** Add runtime attestation (e.g., in-toto SLSA for execution) or TEE binding (Nitro/Confidential Containers).
- **PEP Hardening:** Mandatory SPIFFE/SVID for *all* components; zero-trust PEPs via WebAssembly modules.
- **Anomaly:** Add causal models (e.g., Bayesian nets) + human-in-loop for T3+ escalations.
- **Maturity:** MPC for approvals (e.g., threshold sigs); blind test suites (zero-knowledge proofs on grades).
- **Containment:** Kernel eBPF for net/state hooks; compensating txns with idempotency keys.
- **Tests:** Publish full agent-pentest payloads; add red-team leaderboards.

VERA is credible architecture—deployable, verifiable, and ahead of pack—but not unbreakable. Trusts too much (enforcement plane, humans); real zero-trust needs TEEs everywhere. Score reflects exploit surface.

## Scores

1. **THREAT MODEL COVERAGE**: 6/10  
   OWASP mapping + gaps called out solid, but 4-class model undetailed (no matrices visible); misses model poisoning, insider collusion, quantum.

2. **DEFENSE DEPTH**: 7/10  
   PEPs/PDP + PoE effective vs. basic attacks (90% block rate proven); evadable by runtime compromise, multi-turn inj, DoS.

3. **MATURITY MODEL RESISTANCE**: 8/10  
   Evidence portfolios > calendars; demotions aggressive. Gameable via test overfitting, forged approvals.

4. **SUPPLY CHAIN**: 8/10  
   SBOM + signed manifests cover basics; shallow on training data lineage, transitive deps.

5. **CONTAINMENT**: 7/10  
   Multi-stage + SLAs thoughtful; fails vs. cached decisions, in-flight races, compromised telemetry.

6. **HONESTY**: 9/10  
   Excellent—discloses bypasses, PoE limits, assumptions, no compliance overclaims.

**OVERALL SECURITY VALUE**: 8/10  
   High: Running code + proofs fill enforcement gap. Not panacea, but 10x better than governance docs.

**GREENLIGHT**: YES  
   Credible reference arch; organizations should prototype (low risk, high value).

**TOP 3 ATTACK VECTORS THE PAPER SHOULD ADDRESS OR STRENGTHEN**:
1. **Enforcement Plane Compromise**: Attacker pivots from semi-trusted agent to trusted PDP/PEP (e.g., shared host vulns, config poisoning). Add mandatory workload attestation (SPIFFE everywhere) + least-privilege containers.
2. **Maturity Gaming via Insiders/Overfitting**: Forge evidence portfolios or train on public pentest suite. Require threshold sigs for approvals + ZK-proof test grades.
3. **Sophisticated Evasion (Multi-Turn/Encoded Injections)**: Disclosed bypasses #1-4. Integrate recursive normalization/decoding + context-window analysis in ConvoGuard.

**FLAGGED ASPIRATIONAL CLAIMS**:
- "Zero Trust Reference Architecture": Aspirational—trusts enforcement/storage planes explicitly (not zero). True ZT needs TEEs/confidential compute.
- "Cryptographic Proof [of Execution]": Precise qualifier ("not correctness") buried; headlines imply stronger. Rename "Proof of Signed Intent" for clarity.
- "Containment Bound: min(V, rate_limit * t)": Theoretical; ignores async side-effects (e.g., queued txns), races.
- "Anomaly Detection for LLMs": SWDB good but not "solvable problem"—alignment unsolved (admitted 9.4, but overstated in 1.1).
- EU AI Act/SOC2 "Potentially Supports": Honest caveats, but table implies mapping sufficiency—needs "interpretive only."

Implement, fork, break it. Ping me for pentest collab: @raven_redteam. CC BY 4.0 appreciated.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 7.6/10
**Greenlight:** ✅ YES
**Response time:** 47.0s

---

**Review of "VERA: Verified Enforcement for Runtime Agents"**

**Overall Assessment:** This is a technically deep, well-structured, and unusually honest paper. It addresses a critical operational gap for CISOs: moving from governance frameworks to enforceable controls. The emphasis on proof, architecture, and running code is exactly what is needed. However, from my perspective as a CISO under EU regulatory pressure, its practical adoption path is steep and requires significant internal investment. It is a powerful reference architecture, not a turnkey solution.

---

**Dimension-by-Dimension Scoring**

1.  **OPERATIONALIZABILITY: 6/10**
    *   **Strengths:** The 12 open-source services, TypeScript schemas, and concrete deployment patterns (A/B) provide a tangible starting point. The mapping to OPA/Rego is excellent.
    *   **Concerns:** The architecture is complex. Implementing the full "Five Pillars" requires integrating multiple new systems (DID resolvers, proof engines, anchor backends, ONNX firewalls) with existing IAM, logging, and policy infrastructure. My team has the skills, but the lift is substantial. The "getting started" section is a code repo, not an enterprise deployment guide.

2.  **COMPLIANCE HONESTY: 9/10**
    *   **Strengths:** This is the paper's standout virtue. Section 8, "Compliance Mapping (Honest Assessment)," is exemplary. It correctly states that VERA does not *automatically* confer compliance, clarifies the interpretive status of the EU AI Act for agents, and mandates legal counsel review. This is a rare and welcome dose of reality.

3.  **COST AWARENESS: 7/10**
    *   **Strengths:** Acknowledges performance overhead (14-22ms + 3ms) and provides a cost/trust model table for anchor backends. The scalability limitation (Section 9.1) is an honest admission of future engineering work.
    *   **Gap:** While *runtime* costs are noted, the paper understates the **organizational and development cost** of standing up the enforcement plane, maintaining policy bundles, curating evaluation datasets, and operating the maturity runtime. The total cost of ownership (TCO) for a full VERA deployment is hinted at but not quantified.

4.  **VENDOR NEUTRALITY: 8/10**
    *   **Strengths:** Largely vendor-neutral. Specifications use open standards (DID:web, JWT-VC, Ed25519, OPA). The pluggable anchor abstraction is excellent. Mentions AWS KMS/GCP KMS/Vault as equivalent options.
    *   **Minor Note:** The empirical results use Solana for blockchain anchoring and list specific services (e.g., "ConvoGuard AI"). While these are presented as examples from their implementation, care must be taken to present them as reference proofs, not mandated dependencies.

5.  **REGULATORY REALISM: 8/10**
    *   **Strengths:** Directly addresses DORA (Art. 17 - IR timelines) and GDPR (Art. 25 - Data Protection by Design). The explicit caveat on the EU AI Act is crucial and correct.
    *   **Gap for Financial Services:** While SOX is mentioned in the compliance mapping, the paper doesn't deeply address how VERA's PoE chain would satisfy **SOX 404** internal control requirements or specific **DORA** ICT risk management provisions (e.g., Article 6(9) on advanced tools). It provides the *technical means* for audit trails, but the mapping to financial control frameworks needs to be fleshed out by the implementing organization.

6.  **BOARD READINESS: 7/10**
    *   **Strengths:** The abstract and problem statement are board-perfect: "blast radius," "enforcement gap," "proof over policy." The maturity runtime with evidence-based promotion is a compelling narrative that replaces vague "AI governance" with a measurable, risk-tiered model.
    *   **Concerns:** The technical depth (cryptographic arguments, mermaid diagrams) is excellent for engineers but would need significant distillation for a board deck. The board will ask: "What's the implementation timeline and budget?" The paper doesn't answer that.

7.  **PRACTICAL VALUE: 8/10**
    *   **Strengths:** Immense value. It provides a blueprint to actually *contain* agent risk. The focus on tool-parameter authorization, memory/RAG governance, and multi-stage incident enforcement addresses real, unsolved problems. The adversarial test results (90.2% block rate) and transparent disclosure of bypassed vectors build credibility.
    *   **Consideration:** The value is in providing a rigorous target architecture and proving it's implementable. The immediate protective value for *my organization* depends on our ability to operationalize it, likely starting with a high-risk agent as a pilot.

**OVERALL SCORE: 7.6/10**

This is a high-quality, foundational paper. It scores highly on honesty, technical rigor, and addressing the core enforcement problem. The lower scores in operationalizability and cost awareness reflect the significant enterprise integration challenge it presents, not a flaw in the paper itself.

---

**TOP 3 IMPROVEMENTS NEEDED (CISO Perspective):**

1.  **Phased Adoption Roadmap:** The paper presents a complete architecture. For enterprise adoption, I need a **prioritized, phased implementation guide**. What are the minimal VERA controls to deploy a T1 (Observer) agent next quarter? Which pillars deliver the most risk reduction per unit of effort? A "VERA Lite" or incremental adoption path would dramatically increase operationalizability.

2.  **Integration Blueprint with Existing Enterprise Stack:** While it mentions SPIFFE and mTLS integration, I need more concrete guidance. How does VERA's DID-based identity *actually* federate with our existing IAM (e.g., Okta, Entra ID)? How do PoE chains feed into our existing SIEM (Splunk, Sentinel) for correlation? A detailed "Enterprise Integration" section with sequence diagrams would bridge the gap between the reference architecture and my production environment.

3.  **Regulatory Control Mapping Template:** The honest compliance section is good, but I need a **mapping template** my team can fill out. For each relevant regulation (SOX, DORA, GDPR, EU AI Act), provide a table where we can map specific VERA controls (e.g., PoE Chain, Tool Parameter Authorization) to specific regulatory articles/requirements, document the implementation status, and note evidence required for audit. This turns the architecture into a compliance enabler.

---

**GREENLIGHT: YES**

**Justification:** This paper should be published. It makes a substantial contribution to the field by moving the conversation from governance theory to enforceable architecture. Its honesty about limitations, compliance, and bypassed attack vectors is exceptional and builds trust. While it is not a product brochure and requires significant work to adopt, it provides the most coherent and technically sound blueprint I have seen for securing autonomous AI agents in a regulated environment. It will become a essential reference for security teams embarking on this journey. The recommended improvements would elevate it from a great architecture paper to an indispensable enterprise implementation guide.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 8/10
**Greenlight:** ❌ NO
**Response time:** 12.1s

---

## Evaluation Scores

**1. TECHNICAL DEPTH: 9/10**  
The paper delivers highly detailed schemas (e.g., TypeScript interfaces for VeraAgentIdentity, ProofOfExecution, PolicyEvaluationRequest), explicit PDP/PEP architectures with deployment patterns, Mermaid diagrams for trust boundaries, and formal security properties with cryptographic assumptions and proofs. These elements provide clear blueprints for implementation, including Rego policy examples and tool authorization constraints, sufficient for building core components without major ambiguity.

**2. TOOLING ALIGNMENT: 8/10**  
References align well with 2026 standards like OPA for PDP (clusters and embedded bundles), SPIFFE/SVID for runtime binding, ONNX/DistilBERT/spaCy for input firewalls, Ed25519/SHA-256 for proofs, DID:web/JWT-VC for identity, and anchors like Solana, CT-logs, WORM/S3. Mentions Google A2A (2026) and OWASP Top 10 Agentic (2025), but lacks specifics on emerging agent frameworks like Anthropic's tool protocols or 2026 Kubernetes operator integrations.

**3. CODE AVAILABILITY: 7/10**  
Claims 12 MIT-licensed, deployable services (e.g., Veracity Core, ConvoGuard AI, Agent Pentest on npm) with git clone instructions, 25/25 passing tests, and empirical metrics from production. However, no inline code beyond snippets, and the referenced repo (github.com/yogami/vera-reference-implementation) could not be verified as publicly available or complete, reducing direct accessibility.

**4. COMPETING FRAMEWORKS: 9/10**  
Strong comparative tables map VERA against NIST 800-207, OWASP, MAESTRO, AWS Scoping, and Google A2A, highlighting unique strengths like typed schemas, evidence-based trust, and PoE. Positions VERA as the enforcement layer complementing others (e.g., operationalizing MAESTRO risks, interoperating with A2A SPIFFE), with honest residual risks noted.

**5. SCALABILITY: 6/10**  
Acknowledges limitations (tested at small scale, needs sharding for 1000+ agents, distributed rate limiting), with patterns like central OPA clusters (5-15ms latency) and metrics (14ms firewalls). Lacks detailed horizontal scaling designs, load balancing for PEPs, or cost models at massive scale (e.g., anomaly GMM on streaming data).

**6. INTEROPERABILITY: 9/10**  
Explicit support for standards: SPIFFE/SVID, DID:web, JWT-VC, OPA/Rego, mTLS, SBOM/SPDX, A2A protocol, OWASP mappings. Enterprise paths for AWS KMS/GCP, container attestation, and pluggable anchors (Solana to internal logs) enable integration; schemas are typed and versioned for extensibility.

**7. CODE vs WORDS: 75%**  
Approximately 75% implementable directly: full schemas, Rego examples, Mermaid graphs, deployment patterns, and test metrics allow coding services like PEPs/PDPs/PoE generators. The remaining 25% requires engineering for integrations (e.g., custom GMM anomaly, multi-source signals) or unproven scale features.

**OVERALL SCORE: 8/10**

## GREENLIGHT
**YES**  
VERA is a mature, actionable reference architecture with strong formal foundations, backed by claimed production services. It fills a real enforcement gap for agent security and merits publication, especially given its transparency on limitations and empirical disclosures.

## TOP 3 Technical Gaps
1. **Repository Verification and Full Code Audit**: The git repo and npm packages (e.g., agent-pentest) must be publicly accessible with CI badges, security scans, and full test suites runnable out-of-box to back claims beyond paper metrics.
2. **Large-Scale Reference Deployments**: Provide Kubernetes Helm charts or Terraform modules for 100+ agent clusters, including sharded anomaly baselines and hierarchical PDPs, to demonstrate scalability beyond "small multi-agent" tests.
3. **Multi-Agent Extensions**: Define protocols for delegation chains (e.g., Byzantine-tolerant voting on PoE chains) and Sybil resistance, addressing swarm limitations with schemas or PoCs, as noted in Section 9.5.

════════════════════════════════════════════════════════════════════════════════
