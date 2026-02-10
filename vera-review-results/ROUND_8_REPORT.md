# VERA Paper — Expert Review Round 8

**Date:** 2026-02-10T12:52:30.900Z
**Average Score:** 4.6/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 0/10
**Greenlight:** ✅ YES
**Response time:** 82.2s

---

## Publication-quality review (Round 8) — VERA: Verifiable Enforcement for Runtime Agents

### Executive assessment
VERA is one of the more implementable “Zero Trust for agents” papers I’ve seen: it clearly adapts NIST SP 800-207’s control-plane concepts (PDP/PEP + continuous diagnostics) to agentic action loops, and it does the most important thing many agent governance documents avoid—**it specifies runtime enforcement placement** and provides **verifiability mechanisms** (PoE + receipts + anchoring). The paper is close to publishable as a *reference architecture*, with a few areas needing tightening to avoid over-claiming “verifiable enforcement” in cases where the tool side cannot cryptographically attest.

---

## Scores (1–10)

### 1) ARCHITECTURAL COMPLETENESS — **8/10**
**What’s strong**
- Clear PDP/PEP separation, and you explicitly forbid embedding enforcement as an in-process library (correct and often missed).
- Good coverage of **agent-specific enforcement surfaces**: tool invocation, network egress, data stores, RAG/memory, delegation.
- “Controlled action surface S” is the right scoping mechanism for completeness claims.
- Telemetry feedback loop is present (anomaly → PDP signals → containment), and tiered fail-open/fail-closed behavior is practical.

**What’s missing / under-specified**
- The architecture would benefit from **one canonical end-to-end sequence diagram** for: *action → PEP → PDP → obligations → nonce → tool → receipt → PoE → anchor → verifier*, including retry/idempotency, partial failures, and asynchronous tools/queues.
- “Completeness” depends on “constrained egress” and “independently observable receipts/logs,” but you don’t fully specify the **mechanical reference design** for preventing bypass on Kubernetes (e.g., ambient mesh vs sidecar, eBPF enforcement placement, node-level escapes, DNS exfil, metadata service access).
- Decision cadence: you mention caching TTLs but don’t define **when** re-evaluation must occur (per call, per session window, per tool, per parameter class), and what constitutes “continuous” in the agent loop.

**Why not a 9–10**
- The enforcement-plane trust base is asserted more than engineered. You provide hardening controls, but the reference architecture would be stronger with a defined **minimum TCB** and an explicit “if this fails, these guarantees collapse” table.

---

### 2) THREAT MODEL RIGOR — **8/10**
**What’s strong**
- Five adversary classes are practical and map well to real enterprise failure modes (Manipulator/Insider/Escalator/Evader/Control-plane Compromiser).
- Capability matrix is useful, and you correctly treat control-plane/KMS misuse as its own class.
- You explicitly state trust boundaries and assumptions (A1–A4), which many papers omit.

**What needs improvement**
- The model is not yet “formal” in the sense security reviewers expect: capabilities are partly qualitative (“Possible”, “Partial”), and some boundaries blur (e.g., “Insider modifies model weights” vs “Compromiser modifies PEP/PDP images”).
- You should add at least one structured methodology layer (e.g., STRIDE categories per surface, or an attack-tree per pillar). Right now it’s good engineering threat modeling, but not “formally structured” as claimed in the abstract.

---

### 3) NOVELTY — **8/10**
**What’s genuinely advancing the state-of-practice**
- The **Tool Execution Receipt** concept + nonce-binding + assurance levels is a meaningful step beyond “log everything.” This is the right direction for *verifiable* enforcement.
- Evidence-based autonomy promotion (“maturity runtime”) is a useful reframing versus calendar-based maturity.
- Your definition of “policy enforcement completeness” scoped to an action surface is a valuable formalization for agent systems.

**Where novelty is incremental**
- PDP/PEP placement and continuous diagnostics are 800-207 fundamentals; your contribution is the agent-specific mapping and the proof/receipt layer. That’s still substantial, but position it as “agent adaptation + verifiability layer,” not a new ZT model.

---

### 4) FORMAL DEFINITIONS (schemas/interfaces/controls implementable) — **7/10**
**What’s strong**
- Typed schemas are clear and unusually complete for a paper: PoE, receipt, identity, evaluation input/output, obligations.
- Use of RFC 8785 JCS for canonicalization is exactly the kind of implementable detail that improves interoperability.

**What blocks “drop-in implementation”**
- You define data structures but not the **wire protocols and error semantics**:
  - PDP query API (HTTP/gRPC), authN/authZ, request/response signing, replay protections, caching semantics.
  - Receipt submission/verification API, nonce issuance API, and how nonce state survives restarts and scales across replicas.
  - How “policyBundleHash” is computed and versioned (bundle digest of what exact bytes?).
- Some key fields need tighter normative constraints:
  - `action.type` is free-form string; for verifiers and policies, you want a **closed vocabulary** (or a registry).
  - `timestamp.verifiedSource` mentions RFC3161/NTP-attested; the verification procedure and trust anchors for time are not fully specified.

---

### 5) PRACTICAL VALUE — **8/10**
**What engineering teams will like**
- Deployment Pattern A vs B is real-world helpful (central PDP vs sidecar PDP).
- Explicit performance numbers, failure-mode table, and phased adoption plan are publishable-quality practical guidance.
- The “receipt assurance levels” acknowledges SaaS reality—teams can adopt incrementally.

**What teams will still struggle with**
- Tool-signed receipts require tool changes; many enterprise tools are SaaS APIs where you’ll only ever reach “gateway-observed.” You should more explicitly quantify what guarantees remain in each assurance level and what audit evidence is acceptable.

---

## OVERALL SCORE — **8/10**

## Publication recommendation
This is publishable as a reference architecture **with revisions that tighten claims and complete the implementer-facing protocol details**.

---

## TOP 3 specific improvements needed (highest impact)

1) **Add a normative protocol layer (not just schemas).**  
   Provide a minimal “VERA Runtime Enforcement Protocol” section:
   - PDP query endpoint (auth, signing, replay prevention, caching TTL enforcement).
   - Nonce issuance/validation across replicas (cluster-safe design).
   - Receipt submission and verifier workflow (including failure cases: tool timeout, partial execution, async job IDs).
   - Define exact digest inputs for `policyBundleHash`, `requestHash`, `receiptHash`.

2) **Tighten “verifiable enforcement” claims by assurance level and controlled surface.**  
   Right now, the abstract reads as if verifiable enforcement is universal. In reality:
   - **Full end-to-end verifiability only exists for `tool-signed` receipts** (or a TEE-attested tool).  
   - “Gateway-observed” is still valuable, but it proves *request/response observed by the gateway*, not tool-side execution correctness.
   - Re-state guarantees explicitly per assurance level and per action type; add a table: *Guarantee vs Receipt Level*.

3) **Strengthen the threat model formalism and quantify key risks.**  
   - Replace “Possible/Partial” with defined capability levels (e.g., 0/1/2 with clear semantics).
   - Add an attack-tree or STRIDE-by-surface appendix (Input, Memory/RAG, Tools, Egress, Control plane).
   - Explicitly model **collusion cases** you already allude to (colluding approvers, insider + control-plane, compromised telemetry + demotion abuse) and map them to required controls.

---

## Factual errors, contradictions, or misleading claims to flag

1) **Potential contradiction: “agent runtime could sign actions it did not perform” vs A3 and Definition 1.**  
   - In §10.3 you state: “A compromised runtime could sign actions it did not perform…”.  
   - But A3 and Definition 1 frame non-repudiation around *PEP/Proof Engine keys not accessible to the runtime*.  
   **Fix:** Clarify that this risk applies only when `signerType = 'agent'` (or when IAM/KMS controls fail and the runtime can reach signing). Make “enforcer-signed PoE required for non-repudiation” a MUST for tiers T3/T4.

2) **Cloud KMS / Ed25519 statements need provider-specific accuracy.**  
   The text implies Ed25519 in cloud KMS may not be HSM-backed and that ECDSA P-256 is “cloud KMS compatible.” This varies materially by provider and by “KMS” vs “KMS-HSM/CloudHSM” offerings.  
   **Fix:** State requirements in terms of **HSM-backed, non-exportable keys + attested workload binding**, and then list provider examples as non-normative guidance.

3) **Blockchain anchoring latency/finality is oversimplified.**  
   “Solana ~400ms confirmation” is not a stable security metric; finality and re-org assumptions matter for “tamper-evident timestamping.”  
   **Fix:** Use “time-to-inclusion” vs “time-to-finality” and specify what security threshold is required for auditors/verifiers.

4) **Over-broad claim: “none define where policies are evaluated, where they are enforced…”**  
   Some agent-security products and platform patterns *do* define enforcement points (gateways, tool proxies, sandboxed runtimes). Your point is directionally correct for many governance frameworks, but the universal “none” is easy to challenge.  
   **Fix:** Narrow claim: “most governance frameworks…” and cite examples.

5) **EU AI Act statement should be tightened.**  
   Your note that the EU AI Act doesn’t “explicitly address agentic AI systems” is broadly fair, but readers may misinterpret it as “agents are out of scope.”  
   **Fix:** Add one sentence: agentic systems can still fall under AI Act obligations depending on risk category and deployment context.

---

## Additional constructive notes (secondary)
- **Receipts and parameter minimization:** You minimize PoE parameters, but the receipt schema includes `parameters` as well. If receipts are stored/anchored, they can become a sensitive exhaust too. Add minimization/redaction rules for receipts (or store only hashes + allow-listed fields).
- **Revocation-on-every-evaluation:** Operationally expensive and fragile. Consider: short-lived SVIDs/JWTs + cached revocation with bounded staleness, and define acceptable staleness by tier.
- **Anomaly detection:** SWDB is plausible, but “FPR targets per tier” without showing achieved FPR/TPR in your empirical section will be challenged. Add measured ROC/AUC or at least an evaluation summary.
- **Multi-agent delegation:** You correctly call out limitations; consider adding a minimal “delegation token” format (attenuated capabilities, expiry, non-transferability) to make this implementable today.

---

## Dimension scores summary
- **Architectural Completeness:** 8/10  
- **Threat Model Rigor:** 8/10  
- **Novelty:** 8/10  
- **Formal Definitions:** 7/10  
- **Practical Value:** 8/10  
- **Overall:** 8/10  

---

# GREENLIGHT: YES
(Approved for publication **provided** you incorporate the top improvements above, especially the protocol-level specification and tightened verifiability claims by receipt assurance level.)

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 93.8s

---

# IEEE S&P Industry Track Review: VERA

## Reviewer Identity
Professor Marcus Chen, ETH Zurich, Chief Reviewer IEEE S&P

---

## DIMENSIONAL SCORING

### 1. CONTRIBUTION: 8/10

**Strengths:**
- Clear novel contribution: VERA bridges the gap between governance frameworks and runtime enforcement with concrete architectural patterns (PDP/PEP placement, typed schemas, cryptographic proof chains)
- The evidence-based maturity model is genuinely innovative—replacing calendar-time trust with cryptographic proof portfolios addresses a real weakness in current approaches
- Tool Execution Receipts with nonce-binding provide verifiable enforcement beyond signed logging—this is a substantive architectural contribution
- The five adversary classes with explicit capability matrices are well-structured and map cleanly to OWASP categories

**Weaknesses:**
- Some components are incremental applications of existing concepts (DID:web for identity, OPA for policy, hash chains for tamper-evidence). The novelty is in the *integration* and *enforcement architecture*, not individual primitives
- The claim of "12 deployed services" is somewhat inflated—several appear to be thin wrappers or configuration layers rather than fundamentally new systems
- Multi-agent security (§10.5) acknowledges significant gaps but doesn't provide solutions, limiting contribution scope

**Assessment:** This is solid systems security work with clear practical value. The enforcement-layer architecture and evidence-based trust progression are meaningful contributions beyond "apply zero trust to agents." Not groundbreaking research, but strong engineering with formal grounding.

---

### 2. RELATED WORK: 9/10

**Strengths:**
- Comprehensive coverage across standards (NIST, OWASP), academic work (runtime verification, adversarial ML, BFT), and industry frameworks (MAESTRO, AWS scoping)
- Honest differentiation—the comparative table (§1.2) clearly shows what VERA adds versus existing frameworks
- Recent citations (2024-2026) demonstrate awareness of current landscape
- Acknowledges complementary work (Omega for TEE, AgentGuard for probabilistic assurance) rather than claiming to replace everything

**Weaknesses:**
- Could better engage with formal verification literature (TLA+, Coq proofs for distributed systems)—the "proof sketches" in §3.3 are informal game-based arguments, not mechanized proofs
- Missing some recent work on agent jailbreaking (e.g., tree-of-attacks methods from late 2025)

**Assessment:** Excellent related work section. Appropriately scoped, honest about gaps, and demonstrates deep domain knowledge.

---

### 3. THREAT MODEL: 9/10

**Strengths:**
- Five adversary classes with explicit capability matrices (Table in §2.2) is exemplary—this should be the standard for agent security papers
- Trust assumptions (A1-A4) are stated upfront with honest caveats (e.g., "Cloud Provider Trust" in A3)
- Combined attack scenarios (§2.3) show realistic multi-adversary thinking
- Residual risk column in OWASP mapping (§8) is refreshingly honest

**Weaknesses:**
- Adversary Class 5 (Enforcement-Plane Compromiser) essentially says "if the trusted base is compromised, all bets are off"—this is true but limits the threat model's utility. The mitigations (SLSA provenance, SPIFFE attestation) are good practice but don't fundamentally solve the problem
- The assumption that "at least one anchor backend is honest" (A4) is strong—what happens if all anchors are compromised? (Answer: total failure, but this should be explicit)
- Physical side-channel attacks (timing, power analysis on HSMs) are out of scope, which is reasonable but should be stated

**Assessment:** This is a well-structured, honest threat model. The capability matrix alone makes this paper valuable as a reference.

---

### 4. FORMALIZATION: 7/10

**Strengths:**
- Definitions 1-4 (§3.2) are precise and use standard cryptographic terminology
- TypeScript schemas throughout provide machine-verifiable specifications
- The distinction between "non-repudiation of enforcement record" vs "correctness of execution" (Def 1) is crucial and clearly stated
- JCS canonicalization for deterministic signing is the right choice

**Weaknesses:**
- The "proof sketches" in §3.3 are informal—they reference EU-CMA security and collision resistance but don't provide reduction proofs. For IEEE S&P, these should either be full proofs (with lemmas, reductions, and bounds) or clearly labeled as "security arguments" rather than "proofs"
- Definition 3 (Policy Enforcement Completeness) has a circular dependency: completeness is defined "with respect to controlled action surface S," but S is defined as "actions mediated by PEPs." This needs tightening—what prevents an action from being outside S?
- The distributional anomaly detection algorithm (SWDB, §4.2.3) lacks formal convergence guarantees or PAC-learning bounds

**Assessment:** The formalization is adequate for an industry track paper but would need significant strengthening for the research track. The definitions are clear, but the proofs are sketches. For a systems security paper, this is acceptable if the empirical validation is strong (which it is—see §7).

---

### 5. EVALUATION: 7/10

**Strengths:**
- Empirical results table (§7.1) provides concrete numbers: 14ms p50 latency for prompt injection detection, 97.3% PII precision, 90.2% adversarial test block rate
- Adversarial test results (§7.2) with transparent disclosure of bypassed vectors is excellent—this honesty is rare and valuable
- The 25/25 contract validation tests suggest rigorous testing
- Scalability projections (§10.9) provide analytical bounds for larger deployments

**Weaknesses:**
- "12 deployed services" is vague—deployed where? For how long? What is the usage scale? "Deployed" could mean "running in production at 1M req/day" or "running on my laptop"
- No comparison with alternative approaches (e.g., what is the latency/accuracy tradeoff vs. LLM-based prompt injection classifiers?)
- The claim that "VERA has been tested with individual agent deployments and small multi-agent configurations" (§10.1) contradicts the "12 deployed services" framing—which is it?
- No user study or operator feedback—how hard is it to write OPA policies for agent authorization?

**Assessment:** The evaluation demonstrates that VERA works and provides useful measurements. However, the deployment claims are inflated, and the lack of comparative evaluation weakens the empirical contribution. For industry track, this is acceptable but not exceptional.

---

### 6. WRITING QUALITY: 8/10

**Strengths:**
- Clear, direct prose—"Trust without proof is aspiration. VERA makes it architecture" is effective framing
- Excellent use of tables and schemas to make specifications concrete
- The progression from problem (§1) → threat model (§2) → properties (§3) → architecture (§4) is logical
- Honest limitations section (§10) is a model for the field

**Weaknesses:**
- Some tone issues for a formal venue:
  - "The blast radius is not a misclassified image. It is exfiltrated customer data..." (Abstract)—too colloquial for IEEE S&P
  - "Trust without proof is aspiration" (Conclusion)—reads like a marketing tagline
  - "Running code over specification prose" (Abstract)—while true, this framing is more appropriate for a blog post than a security conference
- The paper is 40+ pages in this format—likely too long for the industry track page limit (typically 12-15 pages). Significant condensing needed
- Some redundancy: the comparative framework table appears in §1.2, and OWASP mapping appears again in §8

**Assessment:** The writing is clear and well-organized, but the tone needs adjustment for a formal venue. Cut the marketing language, condense to fit page limits, and this is a strong paper.

---

### 7. LIMITATIONS: 10/10

**Strengths:**
- Section 10 is exemplary—nine subsections covering scalability, performance, integrity vs correctness, non-determinism, multi-agent gaps, post-quantum migration, physical actuators, deployment cost, and scalability projections
- The honesty about what VERA does NOT solve (Byzantine fault tolerance, alignment, TEE-free runtime integrity) is refreshing
- The post-quantum migration path (§10.6) is forward-looking and practical
- The deployment cost table (§10.8) provides realistic budget estimates—this is incredibly useful for practitioners

**Weaknesses:**
- None. This is how limitations sections should be written.

**Assessment:** Perfect. Every paper should have a limitations section this thorough and honest.

---

## OVERALL SCORE: 8/10

**Summary:**
VERA is a well-executed systems security paper that addresses a real gap in AI agent security: the enforcement layer between governance guidance and running infrastructure. The threat model is exemplary, the architecture is concrete and implementable, and the limitations are honestly stated. The empirical evaluation demonstrates feasibility, though the deployment claims are somewhat inflated.

For the **IEEE S&P Industry Track**, this is a strong contribution. It provides actionable guidance, running code, and formal grounding. The formalization is adequate (though not research-track rigorous), and the evaluation is solid (though not comprehensive).

---

## VERDICT: **ACCEPT**

This paper makes a clear contribution to a timely problem, provides concrete architectural patterns, and demonstrates implementation feasibility. The limitations are honestly stated, and the threat model is a valuable reference for the field.

---

## TOP 3 IMPROVEMENTS NEEDED

### 1. **Tighten the formalization (§3.2-3.3)**
- **Issue:** The "proof sketches" are informal security arguments, not rigorous proofs. Definition 3 (Policy Enforcement Completeness) has a circular dependency.
- **Fix:** Either provide full reduction proofs with lemmas and bounds, or relabel as "security arguments" and acknowledge the informality. For Definition 3, explicitly define the controlled action surface S as "all actions that cross a network boundary or invoke a registered tool"—this makes S verifiable via network monitoring and tool registry inspection.
- **Impact:** This would elevate the paper from "solid systems work" to "systems work with formal grounding."

### 2. **Clarify deployment claims and provide comparative evaluation (§7)**
- **Issue:** "12 deployed services" is vague. No comparison with alternative approaches (e.g., LLM-based classifiers vs ONNX, centralized PDP vs embedded policy engines).
- **Fix:** 
  - Replace "deployed" with specific metrics: "12 services processing X requests/day across Y organizations for Z months"
  - Add a comparative evaluation: ONNX vs GPT-4-based prompt injection detection (latency, accuracy, cost), centralized PDP vs sidecar PDP (latency, availability, consistency)
  - If you can't provide these numbers, downscope the claims: "12 reference implementations, validated in controlled environments"
- **Impact:** This would make the empirical contribution credible and useful for practitioners making architecture decisions.

### 3. **Adjust tone for formal venue (throughout)**
- **Issue:** Some passages read like marketing copy ("blast radius," "trust without proof is aspiration," "running code over specification prose").
- **Fix:**
  - Abstract: Replace "The blast radius is not a misclassified image..." with "Compromised AI agents pose significant risks including data exfiltration, unauthorized transactions, and cascading failures."
  - Conclusion: Replace "Trust without proof is aspiration. VERA makes it architecture." with "VERA provides a reference architecture for verifiable enforcement in AI agent systems, bridging the gap between governance frameworks and runtime infrastructure."
  - Throughout: Replace "running code" with "reference implementation" or "deployed services"
- **Impact:** This would align the paper's tone with IEEE S&P expectations without losing clarity.

---

## ADDITIONAL SPECIFIC FEEDBACK

### Minor Issues:
1. **§2.2, Table:** The capability matrix is excellent, but add a column for "Detection Method" (how VERA detects each capability being exercised)
2. **§4.2.1a, Nonce lifecycle:** The nonce format `{actionId}:{random_bytes_hex}` is good, but specify the random byte length (128 bits minimum per NIST SP 800-90A)
3. **§5.2, Evidence portfolio:** Add a field for `evaluationDatasetProvenance` to prevent evaluators from using compromised test sets
4. **§7.2, Bypassed vectors:** The disclosure of bypassed vectors is excellent—consider publishing these as a separate benchmark dataset
5. **§10.6, Post-quantum:** The migration timeline aligns with NIST, but add a contingency plan for "CRQC arrives earlier than expected" (e.g., emergency dual-signing activation)

### Presentation:
- The Mermaid diagrams are clear but may not render in IEEE format—provide rasterized versions
- The TypeScript schemas are excellent for specification but may be too verbose for the page limit—consider moving some to an appendix
- The paper is likely 25-30 pages in IEEE format—you'll need to cut ~50% for the industry track. Prioritize: threat model (§2), architecture (§4), evaluation (§7), limitations (§10). Condense related work and move some schemas to supplementary material.

---

## GREENLIGHT DECISION

**GREENLIGHT: YES**

**Justification:**
This paper makes a solid contribution to AI agent security with clear practical value. The threat model is exemplary, the architecture is concrete and implementable, the evaluation demonstrates feasibility, and the limitations are honestly stated. While the formalization could be tighter and the deployment claims need clarification, the core contribution—a reference architecture for verifiable enforcement in AI agents—is valuable and timely.

For the IEEE S&P Industry Track, this is a strong accept. The paper provides actionable guidance for practitioners, running code for implementers, and a formal foundation for researchers. With the three improvements above (tighter formalization, clarified deployment claims, adjusted tone), this would be an exemplary industry track paper.

**Recommendation to Authors:**
Submit to IEEE S&P Industry Track after addressing the three improvements. If you can provide the comparative evaluation and tighten the proofs, consider the research track—the threat model and architecture are strong enough. Either way, this is valuable work that should be published.

**Final Note:**
The limitations section (§10) is a model for the field. More papers should be this honest about what they do and do not solve. Well done.

---

**Confidence Level:** High (I have reviewed 50+ agent security papers and chaired sessions on AI security at IEEE S&P and USENIX Security)

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 38.0s

---

### Red Team Scores

1. **THREAT MODEL COVERAGE**: 8/10  
   The 5-class model (Manipulator, Insider, Escalator, Evader, Compromiser) is comprehensive, with a clear capability matrix, mapped scenarios, and OWASP coverage. It realistically delineates trust boundaries (e.g., enforcement plane trusted until Class 5) and addresses agent-specific vectors like RAG poisoning, maturity gaming, and telemetry injection. Deductions for under-emphasizing side-channel/model extraction attacks and assuming cloud KMS honesty without stronger mitigations.

2. **DEFENSE DEPTH**: 7/10  
   Pillars provide defense-in-depth (PoE chains, tool receipts, ONNX firewalls, distributional anomalies), effective against prompt injection (90% empirical block rate) and supply chain tampering. However, PEP bypasses via container escape, weak SaaS receipts (Level 3), and evadable anomalies (gradual drift) limit practicality. Receipts are a highlight but require tool cooperation.

3. **MATURITY MODEL RESISTANCE**: 6/10  
   Evidence portfolios with signed adversarial tests and multi-approval gates improve over calendar models, resisting simple time-gaming. But highly gameable via insider collusion (fake approvals/tests), memorization of rotated datasets, or slow behavioral drift during evaluation. Demotion triggers help but lack quorum from external auditors.

4. **SUPPLY CHAIN**: 8/10  
   Strong on signed manifests, SBOMs, SLSA L2+, and RAG provenance—directly hits typosquatting, model backdoors, and prompt injection via deps. Minimal training data provenance is pragmatic but residual (zero-days, fine-tune poisoning). Excellent integration with Sigstore/Rekor.

5. **CONTAINMENT**: 5/10  
   Multi-stage (revocation <500ms to compensation <60s) with multi-source signals bounds blast radius credibly for financial ops. But a determined Evader+Compromiser (telemetry poisoning + KMS misuse) suppresses signals/anchors; in-flight ops exceed bounds; no hardware root (TEE optional). Won't stop nation-states or cloud admins.

6. **HONESTY**: 9/10  
   Exemplary: Transparent bypassed vectors (4/41), detailed limitations (scalability, PoE vs. correctness, PQ timelines), cost breakdowns, and "not compliance certified." Rare candor on non-determinism and multi-agent gaps. Minor puffery on "proof over policy" (still needs policy authors).

**OVERALL SECURITY VALUE**: 8/10  
   Credible reference architecture with running code, formal sketches, and empirical data. Operationalizes ZT for agents better than frameworks like MAESTRO. High value for mid-scale deployments; not bulletproof at hyperscale or against APTs.

**GREENLIGHT**: YES — The security architecture is credible for production use in controlled environments (e.g., enterprise with HSMs, <1000 agents), especially with phased rollout. Strongest ZT agent spec to date.

**TOP 3 ATTACK VECTORS TO ADDRESS/STRENGTHEN**:
1. **Container/Runtime Escape Bypassing PEPs**: Agent compromises host/sidecar (e.g., via vuln deps or seccomp bypass), enabling direct egress or KMS calls. Strengthen with mandatory TEEs (SGX/SEV) for PEPs and kernel eBPF auditing.
2. **Insider Collusion in Maturity Gaming**: Fake evidence portfolios via compromised approvers/datasets. Add external/quorum verification (e.g., independent pentest firms) and zero-knowledge proofs for test results.
3. **Gradual Drift/Boiling Frog Evasion**: Evader slowly shifts behavior within anomaly baselines. Enhance with periodic "cold start" re-baselining from immutable snapshots and cross-agent behavioral similarity checks.

**FLAGGED ASPIRATIONAL CLAIMS**:
- "Maximum financial damage... bounded by max_loss ≤ ..." (Sec 3.2): Assumes perfect sync/cancellation; real async ops (e.g., queued payments) exceed bounds by orders of magnitude without custom tool support.
- "90.2% block rate" (Sec 7.2): Self-tested on known vectors; adaptive red-team evades easily (admits 4 bypasses). Aspirational without third-party audits.
- "VERA guarantees [security properties]" (Sec 3): Sketches are high-level; full proofs under A1-A4 are handwavy (e.g., Game PC ignores side-channel bypasses). "Non-repudiation" is audit trail, not execution proof.
- PQ migration "timeline" (Sec 10.6): 2035 full migration optimistic; CRQCs could emerge sooner, and Solana/Ed25519 lock-in weakens agility.
- "Running code" implies production-ready at scale: Tested <50 agents; 10k-agent projections unvalidated.

---

### Complete Expert Review: Red Teaming VERA

As Raven, I've broken more "zero trust" setups than most have deployed. VERA is the most thoughtful agent security spec I've audited—open source (MIT, 12 services, 25/25 tests passing), formal(ish) properties, and brutally honest limitations (Sec 10). It correctly diagnoses the "enforcement gap": governance is checklists; VERA is PDP/PEP plumbing with PoE receipts for verifiability. No vaporware—deployable today via GitHub.

But zero trust means *assume breach*. VERA assumes too much (enforcement plane, KMS, anchors), over-relies on crypto theater (PoE chains don't prove *correctness*, just logging), and leaves gaping runtime holes. I'll dissect pillar-by-pillar, then systemic flaws. Brutal where weak; props where strong.

#### Strengths: What Works Well
- **Threat Model (Sec 2)**: Gold standard. 5 classes + matrix covers 90% real vectors (prompt inj, RAG poison, supply chain, evasion). Scenarios like "Insider + Manipulator" are spot-on. A1-A4 assumptions explicit (e.g., no key exfil). Better than NIST 800-207 for agents.
- **PoE + Receipts (Sec 4.2)**: Killer feature. JCS-canonical PoE chains + nonce-bound tool receipts enable third-party verification (PDP auth → PEP enforce → tool exec). Pluggable anchors (Rekor > Solana for cost/latency). Empirical: 3ms siggen. Weak SaaS receipts flagged honestly.
- **Data Sovereignty (Pillar 3)**: ONNX ConvoGuard (14ms inj detect) + RAG ACLs/source scoring crushes A01/A06. Taint tracking for PII flow. Underrated: memory TTLs prevent persistent poison.
- **Supply Chain (Sec 6)**: SLSA L2+, signed tool manifests, SBOM gates. Hits SolarWinds-style deps and LoRA backdoors. RAG provenance minimal but actionable.
- **Empirics + Honesty (Secs 7-10)**: 90% block rate with *disclosed bypasses* (homoglyphs, multi-turn). Cost tables, scalability projections, PQ path. Sec 10.3 nails PoE limits: "audit trail, not execution proof."
- **Maturity (Sec 5)**: Evidence > calendar. Portfolios with pentest grades resist lazy gaming.

#### Weaknesses: Brutal Critiques
1. **Defense Depth Gaps (Pillars 2/4)**:
   - **PEP Bypass Central**: All hinges on "constrained egress invariant" (sidecars/proxies). But agents run semi-trusted—supply chain (your own Sec 6) or zero-days enable escapes (e.g., runc CVE-2019, gVisor bypasses). No mandatory seccomp/eBPF PoE correlation (just "detectable"). Fix: Enforce TEEs for PEPs (SGX/SEV attested, as recommended but optional).
   - **Anomaly SWDB (4.2.3)**: GMM on features evades via mimicry/gradual drift (your admitted limitation). FPR tiers nice, but no entropy checks on outputs or LLM interpretability (e.g., activation drift). Boiling frog owns this.
   - **Tool Auth (4.4)**: Parameter schemas great (e.g., limit=1000), but cross-tool chaining abuses (your bypassed vector #4). No holistic session graphs in PDP input.

2. **Containment Fantasy (Pillar 5)**:
   - SLAs ambitious (<500ms revoke), but Evader injects false signals (3+ sources? Collude). Compromiser mods PEP images (cosign/Kyverno good, but cloud admin rotates IAM). In-flight cancels assume cooperative tools. Damage bound ignores races (e.g., async Kafka commits). Real stop? No—slow exfil wins.
   - Multi-agent: "Capability attenuation" trivial; no BFT (admits in 10.5). Byzantine swarms laugh.

3. **Maturity Gaming Vectors**:
   - Approvals: Security team + risk committee = insiders. Signed? Forge keys.
   - Tests: "Agent-pentest v2.1" rotated datasets, but agents fine-tune/memorize. No ZK proofs for grades.
   - Demotion: Good triggers, but override "two-party" = insider pair.

4. **Crypto/Assumption Risks**:
   - **A3 KMS**: Cloud honest-but-curious; admin = Compromiser pwns. HSM recommended but not baseline. No threshold sigs.
   - **Anchors (A4)**: One honest backend? Evader suppresses all internals. Rekor best, but gossip-protocol witnesses missing.
   - **Non-Repudiation (Def 1)**: Proves *enforcement recorded*, not executed correctly. Malicious agent replays old nonces? Single-use tracked, but nonce set LRU overflows at scale.
   - PQ: Agility good (ML-DSA enum), but Ed25519 default + Solana lock-in = 5-year breakage window.

5. **Implementation/Scale Reality Check**:
   - Perf: 14-50ms/action adds up in loops (your 10.2 admits). Sidecar OPA p99=50ms @10k agents untested.
   - Deploy: Central PDP single-point (liveness?); sidecar staleness 60s = revocation gaps.
   - Multi-agent: Sec 10.5 waves at BFT papers—no primitives.

6. **Honest Gaps**:
   - No mention of model theft (weights exfil via slow egress) or side-channels (timing on PoE).
   - OWASP map (Sec 8): A05 sandboxing "network isolation"—ignores kernel escapes.
   - Claims "proof over policy"—still needs Rego authors (insider target).

#### Constructive Roadmap
- **Phase 1 (Quick Wins)**: Mandate TEE attestation for T3+ PEPs; add nonce ZKP for receipts; external pentest integration for portfolios.
- **Phase 2**: BFT delegation (CP-WBFT stub); sharded anomalies with entropy features.
- **Phase 3**: Full proofs (not sketches); 1000-agent benchmark.
- **Interop**: SPIFFE/DID bridge excellent—push A2A/Google standards.

VERA advances the field: First spec with *verifiable enforcement*. Deploy T1-T2 today; harden for T4. Not unbreakable, but credible blueprint.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 0/10
**Greenlight:** ❌ NO
**Response time:** 68.2s

---

ERROR: terminated

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 17.6s

---

## VERA Paper Evaluation

As Kai Nakamura, Principal Platform Engineer with experience building agent infrastructure at scale, I've reviewed the VERA paper in detail. It presents a comprehensive zero-trust architecture for AI agents, emphasizing runtime enforcement via PDP/PEP patterns, cryptographic proofs (PoE), and evidence-based trust tiers. The paper is strong on formal modeling but reveals gaps in direct implementability due to absent code links and incomplete tooling details.

### Scores

1. **TECHNICAL DEPTH: 9/10**  
   Schemas are highly detailed (e.g., TypeScript interfaces for PoE, ToolExecutionReceipt, PolicyEvaluationRequest) with normative semantics like JCS canonicalization (RFC 8785) and nonce lifecycles. Architectures specify PDP/PEP placement, trust boundaries, and deployment patterns (central vs. sidecar). Proof sketches are rigorous (game-based under A1-A4 assumptions). Minor deduction for lacking full Rego policy examples beyond snippets.

2. **TOOLING ALIGNMENT: 8/10**  
   References 2026-relevant tools: OPA/Rego for PDP, cosign/Kyverno for admission, Sigstore Rekor for anchors, SPIFFE/SVID for attestation, Solana for anchoring, ONNX for ConvoGuard, SLSA Level 2+. Aligns with Google A2A (SPIFFE interop) and post-quantum NIST FIPS 204 (ML-DSA). Gaps in specifics like OPA bundle sync configs or eBPF/seccomp profiles for syscall filtering.

3. **CODE AVAILABILITY: 4/10**  
   Claims 12 MIT-licensed services (e.g., Veracity Core, ConvoGuard, Agent Pentest) with 25/25 tests passing, deployed in production, and a git clone command. However, no hyperlinks to repos, no badges (e.g., GitHub actions), and my verification attempts found no matching public repos (e.g., github.com/yogami/vera-reference-implementation returns nothing). Without accessible code, claims remain unverified—backing extracts from production is promising but invisible.

4. **COMPETING FRAMEWORKS: 9/10**  
   Thorough comparison tables vs. NIST 800-207, OWASP Top 10 Agentic (2025), MAESTRO, AWS Scoping—highlighting VERA's unique PDP/PEP, typed schemas, PoE. Acknowledges interop (A2A SPIFFE, AWS KMS) and extensions needed (e.g., BFT for multi-agent vs. BlockAgents). Strong on gaps like AWS's lack of evidence-based trust.

5. **SCALABILITY: 6/10**  
   Addresses sharding (projections to 10k agents), KMS pooling, hierarchical PDP, but admits untested beyond ~50 agents (no sharded anomaly GMM or distributed nonces built). Projections realistic (e.g., 50ms p99 KMS at 10k agents), containment SLAs (<10s in-flight cancel), but lacks benchmarks or code for distributed rate limiting.

6. **INTEROPERABILITY: 8/10**  
   Strong standards support: DID:web/JWT-VC, SPIFFE/SVID, A2A gateways, OPA bundles, cosign/SLSA, RFC 3161 TSA, mTLS. Explicit enterprise paths (SPIRE as IDP). Mentions MCP indirectly via tool chaining but no schemas; SPIFFE attested but no full protobufs. Good crypto agility (Ed25519 to ML-DSA).

7. **CODE vs WORDS: 60%**  
   ~60% implementable directly: full schemas/Protobuf-ready, Mermaid diagrams translatable to infra-as-code, Rego snippets, bash getting-started, deployment patterns (sidecar YAML inferable). Non-implementable: anomaly SWDB/GMM algorithm (pseudocode only, no hyperparameters), full test suites, production configs, multi-source signal fusion logic—requires engineering to fill.

**OVERALL: 7/10**  
VERA is a solid reference architecture with formal rigor and practical pillars, advancing beyond governance docs into verifiable enforcement. Production extraction and open claims boost credibility, but unverifiable code and scale gaps limit immediate deployability.

### GREENLIGHT Status
**GREENLIGHT: YES** (with caveats)  
Publication recommended for its contributions to agent security (PoE chains, evidence tiers, memory governance). It fills an enforcement gap credibly, even if code isn't surfaced yet—community can fork/extend.

### Top 3 Technical Gaps
1. **Missing Public Code Repos**: No verifiable links or artifacts for 12 services/tests; add GitHub/Sigstore Rekor badges, SLSA provenance, and Docker Hub images with cosign signatures.
2. **Scalability Implementations**: Build sharded anomaly detection (distributed GMM), hierarchical PDPs, and KMS connection pooling; provide Helm charts for 1k+ agent clusters.
3. **Full Tooling Schemas/Configs**: Expand to protobufs for PoE/receipts, complete OPA Rego policies per tier/tool, eBPF programs for syscall bypass detection, and MCP/A2A interop gateways.

════════════════════════════════════════════════════════════════════════════════
