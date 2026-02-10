# VERA Paper — Expert Review Round 7

**Date:** 2026-02-10T10:49:57.445Z
**Average Score:** 6.0/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 0/10
**Greenlight:** ✅ YES
**Response time:** 95.1s

---

## Publication-quality review (Round 7) — VERA: Verifiable Enforcement for Runtime Agents

### Executive assessment
This is one of the stronger “Zero Trust for agents” papers I’ve read because it does the part most papers avoid: explicit **PDP/PEP placement**, explicit **action surfaces**, and a concrete attempt at **verifiable runtime enforcement** (PoE + receipts + anchoring). The structure is clear, the scope boundaries are mostly honest, and the implementation claims (12 services, contract tests, empirical latency) materially increase credibility.

To reach publication-quality as a *reference architecture* (vs. a strong design proposal), VERA needs tighter internal consistency (especially around **who signs what**), a more formally structured threat model (missing adversaries and a mis-specified capability matrix), and more precise protocol/interface specifications so independent teams can implement interoperably.

---

## Scores (1–10)

1) **ARCHITECTURAL COMPLETENESS (Zero Trust for AI agents)**: **8/10**  
Strong PDP/PEP placement, clear action boundary model, explicit enforcement pillars, decision provenance, and telemetry feedback into policy. Gaps remain in (a) enforcement-plane trust/compromise handling (you both assume it trusted and model its compromise), (b) cross-tool/cross-PEP coordination guarantees, and (c) crisp definition of the continuous policy evaluation loop and cache semantics under partition.

2) **THREAT MODEL RIGOR**: **7/10**  
Good start: adversary classes, capability thinking, combined scenarios, and explicit assumptions (A1–A4). However it’s not fully comprehensive for agent ecosystems (tool compromise, model provider compromise, data-plane admin, PDP policy-author adversary, etc.), and the capability matrix is internally inconsistent (see issues).

3) **NOVELTY**: **8/10**  
The “verifiable enforcement” framing—PoE plus **Tool Execution Receipts** bound by nonces, and an evidence-based autonomy ladder—is meaningfully beyond a straightforward NIST 800-207 restatement. The anchoring abstraction is also practical. That said, portions resemble existing supply-chain attestation patterns (in-toto/SLSA/Sigstore/SCITT-like designs) and should be positioned accordingly to avoid “we invented verifiable logging” perceptions.

4) **FORMAL DEFINITIONS (schemas, interfaces, controls)**: **7/10**  
TypeScript schemas + JCS canonicalization + nonce lifecycle are unusually implementable for a paper. Missing are: normative protocol flows (sequence diagrams), canonical requestHash definition, key discovery/rotation semantics, receipt verification state machine, and interoperability constraints (what MUST be identical across implementations).

5) **PRACTICAL VALUE**: **9/10**  
Engineering teams can use this. The action coverage matrix, sidecar PDP pattern, tool-parameter authorization examples, incident stages, and measured overhead are all directly actionable. The explicit limitations section is also a publication-strength feature.

**OVERALL SCORE**: **8/10**

---

## Detailed dimension review

### 1) Architectural completeness (PDP/PEP placement, policy loops, enforcement surfaces)
**What’s strong**
- **Action boundary definition** is the right move. For agents, internal reasoning isn’t enforceable—externalized side effects are.
- **PEP placement** is concrete: tool wrapper, gateway/egress proxy, memory guard, storage proxy, and syscall filter. This matches how Zero Trust is actually operationalized (control the chokepoints).
- **Two deployment patterns** (central PDP vs. local PDP) are realistic and align with latency/availability tradeoffs.
- **Telemetry feedback** (anomaly detector → PDP) plus incident enforcement stages approximates NIST’s CDM loop and is appropriate for agent “continuous sessions.”

**What’s incomplete / needs tightening**
- **Continuous evaluation loop definition is still informal.** You describe signals feeding the PDP, but the paper should explicitly define:
  - decision cadence per action type (every action vs cached decision TTL),
  - cache invalidation triggers (revocation, incident stage, policy bundle update),
  - consistency model under partition (what happens to “allow” decisions when revocation can’t be checked?).
- **Cross-PEP coordination** is acknowledged as a bypass in your pentest (delegated agent re-requesting denied action through alternate tool). Architecturally, this is the classic “distributed PEP consistency” problem. You need at least one reference pattern:
  - centralized “deny ledger” keyed by `(agentDid, sessionId, intentId)`; or
  - globally unique “intent tokens” with monotonic counters; or
  - PDP-issued capability tokens with attenuated scopes (macaroons-like) that all PEPs validate.
- **“Completeness” depends on constrained egress** (good), but storage-plane and retrieval-plane bypass needs stronger articulation. For example, if an agent can reach a database through any path other than the storage proxy, your completeness guarantee collapses. You mention default-deny egress; you should elevate this into a **normative connectivity requirement** (microsegmentation invariants).

### 2) Threat model rigor
**What’s strong**
- Distinguishes input-only attackers vs supply-chain insiders vs compromised agents vs telemetry poisoning vs control-plane compromise.
- Calls out the “trusted base compromise voids enforcement” reality—good security honesty.

**Key gaps**
- **Capability matrix is incorrect/incomplete**: it lists only 4 classes (Manipulator/Insider/Escalator/Evader) but you define 5 (missing Enforcement-Plane Compromiser column). This is a publication-blocking consistency defect.
- **Missing adversary classes that matter in agent systems**:
  - **Compromised tool/service** (tool signs false receipts; tool identity key stolen; tool returns malicious payloads). Your receipt model assumes tool keys are trustworthy; that’s a huge dependency.
  - **Model provider / model artifact adversary** (malicious base model, malicious update channel, compromised model registry). You treat “insider modifies weights,” but not “upstream provider is malicious/compromised.”
  - **Data-plane administrator** (DB admin, vector DB admin, log admin) who can manipulate data to steer the agent *without* changing code.
  - **Policy author adversary** (malicious but authorized policy change)—separation of duties helps, but the threat class should exist explicitly.
  - **On-path / network attacker** is underdeveloped given multi-tenant clouds and service meshes (mTLS helps, but certificate/SVID issuance becomes the target).
- **Structure**: you’ll improve rigor substantially by expressing threats as:
  - assets × adversaries × attack surfaces × controls × residual risks, and
  - mapping to a standard taxonomy (STRIDE is fine; ATT&CK-style mapping also works).
- **Assumption labeling confusion**: in §2 you refer to “A1–A4 hold” before A1–A4 are defined cryptographic assumptions in §3. That’s confusing and reads like a contradiction. Either define assumptions earlier or rename threat-model assumptions (e.g., TM1–TM4).

### 3) Novelty vs NIST 800-207 applied to agents
**Genuine advances**
- **Tool Execution Receipts bound to PDP/PEP authorization** is the strongest differentiator. Most “agent security” work stops at logging and policy-as-code.
- **Evidence-based autonomy promotion** is a practical mechanism that security teams can actually govern.
- **Anchor abstraction** recognizes enterprise reality (WORM, TSA, transparency logs, periodic anchoring) rather than blockchain maximalism.

**Where novelty claims should be toned/positioned**
- “Cryptographic proof of execution” as phrased can be read as hardware-based PoX/TEE-style proof. In VERA, it’s closer to **cryptographically signed, tamper-evident enforcement attestations**, optionally strengthened by external receipts and anchoring. That’s still valuable—but be precise to avoid overclaiming.
- Supply-chain sections overlap conceptually with **Sigstore/in-toto/SLSA** patterns; cite these explicitly (and possibly SCITT if you want a standards-aligned attestation framing).

### 4) Formal definitions and implementability
**Strong points**
- JCS canonicalization (RFC 8785) is exactly the right call for deterministic signatures.
- Nonce lifecycle requirements are unusually specific (entropy, TTL, single-use, replay checks).
- PDP request/response schemas and obligations are implementable.

**Missing details that block interoperable implementations**
- **Signer/key confusion (major)**:
  - In §3 Definition 1, PoE is signed by `pk_enforcer` (PEP/Proof Engine key).
  - In §4.1 identity schema, the agent has `publicKey`.
  - In §4.2.1 PoE schema, `signature` is described generically, and the verification procedure says “verify each PoE signature against the agent’s registered public key (or PEP/Proof Engine key under A3)”—that “or” is not acceptable for a reference spec.
  
  You need a normative rule: *exactly which principal signs PoE*, and how verifiers discover the correct key. If you support both modes, define them as two distinct profiles (e.g., **Profile E** = enforcer-signed PoE; **Profile A** = agent-signed PoE with enforcer co-signature).
- **Canonical requestHash** is referenced but never defined. For receipt binding you need a stable definition:
  - requestHash = SHA-256(JCS(canonical_request_envelope))
  - explicitly define what fields are included/excluded (headers? timestamps? redacted fields?).
- **Tool identity and key distribution**: you reference SPIFFE/DID/PKI, but you need a minimal interoperable mechanism:
  - how the tool presents its signing key/cert,
  - how the verifier binds `toolId` to that key,
  - what revocation looks like for tool keys.
- **Sequence numbers across replicas**: you say each replica has its own chain; good. But then “cross-replica ordering via anchor timestamps” is weak unless you define:
  - acceptable clock skew,
  - anchor backend timestamp semantics,
  - what constitutes “ordering” vs “existence.”
- **Privacy leakage**: you protect PII by signing a redacted `resultHash`, but PoE still contains `parameters` (and potentially `target`). You should normatively require parameter minimization/redaction rules per tool to avoid PoE becoming a sensitive data exhaust.

### 5) Practical value
This is high. If you publish with a tightened spec, teams can:
- implement sidecar enforcement correctly (not in-agent libraries),
- reason about enforcement coverage via the action matrix,
- operationalize agent risk using the tiering system,
- adopt receipts incrementally (gateway receipts first, then tool-signed receipts where possible).

The empirical section is a strong inclusion. To make it publication-grade, add reproducibility hooks: test hardware, corpus sizes, and the exact pentest suite version link/hash.

---

## Factual errors, contradictions, or misleading claims (flagged)

1) **Capability matrix missing the 5th adversary class**  
You define “Adversary Class 5: Enforcement-Plane Compromiser” but the capability table in §2.2 has only 4 columns. This is an internal contradiction and must be fixed.

2) **Assumption label collision/confusion (A1–A4)**  
In §2 you reference “A1–A4” before defining A1–A4 cryptographic assumptions in §3. This reads like either a forward reference or a mismatch. For publication quality, rename threat-model assumptions (TM-*) or move the assumption definitions earlier.

3) **PoE signing authority ambiguity (agent key vs enforcer key)**  
As described above, this is a major spec inconsistency. It affects your non-repudiation property and the verification procedure.

4) **EU AI Act statement is directionally OK but could mislead**  
“The EU AI Act does not explicitly address agentic AI systems” is arguably true in the sense that it doesn’t use “agentic” as a primary construct, but the Act regulates AI systems broadly; readers could misinterpret this as “agents aren’t covered.” Consider rephrasing to: *the Act does not yet provide agent-specific technical control requirements; applicability depends on classification and use case.*

5) **“OPA is stateless so no leader election required for correctness” is mostly true but incomplete**  
Correctness of a single decision does not require leader election, but **bundle distribution consistency, staleness, and auditability** do become correctness questions in your architecture. Your own staleness/TTL controls partially address this; just tighten the claim.

---

## TOP 3 specific improvements needed (highest impact)

1) **Resolve PoE/receipt signing and keying into a crisp, normative attestation model**
   - Define who signs PoE (enforcer, agent, or both) and make it a MUST/SHOULD per tier.
   - Add `signerType`, `keyId`, and a verification key discovery mechanism.
   - Define a minimal trust chain for tool keys (SPIFFE federation profile, org PKI profile, or DID profile).

2) **Harden and complete the threat model**
   - Fix the capability matrix (include all 5 classes).
   - Add at least: compromised tool/service, malicious model/provider, data-plane admin, malicious policy author.
   - Provide a structured mapping (assets → threats → controls → residual risks) and cleanly separate threat-model assumptions from crypto assumptions.

3) **Make “Policy Enforcement Completeness” and the continuous loop enforceable and testable**
   - Define the invariants required for completeness (default-deny egress, exclusive routing through proxies, no sidecar bypass).
   - Specify cache/TTL, revocation handling, partition behavior, and cross-PEP deny coordination.
   - Include one reference “bypass detection and reconciliation” algorithm: how discrepancies between receipts, PoE, and network logs trigger containment.

---

## Publication recommendation
This is close to publishable as a reference architecture, and it meaningfully advances the conversation beyond “governance checklists.” With the three fixes above (especially the PoE signer ambiguity and the capability matrix), I would be comfortable approving it.

**GREENLIGHT: YES** (conditional on addressing the flagged inconsistencies and tightening the normative spec points above).

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 93.7s

---

# IEEE S&P Industry Track Review: VERA

## Reviewer Identity
Professor Marcus Chen, Computer Security, ETH Zurich  
Chief Reviewer, IEEE Security & Privacy

---

## DIMENSIONAL SCORING

### 1. CONTRIBUTION: 8/10

**Strengths:**
- **Clear novel contribution**: VERA bridges a genuine gap between governance frameworks and enforcement architecture. The distinction between "specification prose" and "running code with verifiable properties" is well-articulated and addresses a real problem in AI agent security.
- **Architectural innovation**: The five-pillar model with explicit PDP/PEP placement, typed schemas, and pluggable anchoring represents genuine architectural thinking beyond "apply existing concepts."
- **Evidence-based trust**: The maturity runtime (Section 5) with cryptographic evidence portfolios is a novel alternative to calendar-based trust models. This is a meaningful contribution to agent security.
- **Tool Execution Receipts (§4.2.1a)**: The nonce-binding mechanism between PDP authorization and tool execution closes a verification gap not addressed in prior work.

**Weaknesses:**
- **Incremental elements**: Some components (DID:web, Ed25519 signatures, OPA policies) are standard applications of existing primitives. The contribution is in the integration, not the primitives themselves.
- **Limited theoretical novelty**: The formal properties (Definitions 1-4) are straightforward applications of signature unforgeability and hash chain integrity. No new cryptographic constructions or security reductions.

**Verdict**: Strong contribution for an industry track paper. The architecture is novel, the gap is real, and the integration is non-trivial.

---

### 2. RELATED WORK: 7/10

**Strengths:**
- **Comprehensive coverage**: Section 11 cites relevant standards (NIST 800-207, OWASP Top 10 Agentic, MAESTRO, AWS Scoping, NIST AI RMF) and technical work (runtime verification, certificate transparency).
- **Differentiation is clear**: The comparative table (Section 1.2) explicitly shows what VERA adds beyond existing frameworks.
- **Honest positioning**: The paper acknowledges that VERA "operationalizes" rather than "replaces" existing governance frameworks.

**Weaknesses:**
- **Missing academic security work**: No citations to formal verification of distributed systems (e.g., TLA+, Ivy), Byzantine fault tolerance literature (Castro & Liskov, PBFT), or recent work on TEE-based attestation (Intel SGX, AMD SEV).
- **RAG security citations**: The paper mentions RAG poisoning [Zhong et al., 2023; Zou et al., 2023] but does not provide full citations or detailed comparison to VERA's mitigation approach.
- **Prompt injection defenses**: ConvoGuard is presented as novel, but no comparison to existing prompt injection classifiers (e.g., Rebuff, LLM Guard, or academic work on adversarial prompts).

**Recommendation**: Add 5-8 academic citations for formal verification, TEE attestation, and adversarial ML defenses. Provide full bibliographic details for Zhong and Zou.

---

### 3. THREAT MODEL: 9/10

**Strengths:**
- **Exceptional structure**: Five adversary classes with explicit capability matrices (Section 2.2) is exemplary for an industry paper. The distinction between Manipulator, Insider, Escalator, Evader, and Enforcement-Plane Compromiser is clear and useful.
- **Cryptographic assumptions are explicit**: A1-A4 are stated upfront with references to standards (NIST FIPS 186-5, Bernstein et al. for Ed25519).
- **Combined attack scenarios**: Table in Section 2.3 demonstrates understanding of multi-stage attacks.
- **Honest residual risk**: Each adversary class includes "Residual Risk" column acknowledging what VERA does not solve.

**Weaknesses:**
- **A3 (Trusted Key Store) is strong**: The assumption that "agent runtime has no network path or IAM permissions to signing service" is non-trivial to enforce in practice. The paper acknowledges this in Section 4.0 but could be more explicit about deployment prerequisites.
- **Enforcement-Plane Compromiser (Class 5) is underspecified**: The mitigations rely on "SPIFFE workload attestation" and "IAM condition keys," but the threat model does not specify what happens if the cloud provider itself is adversarial (e.g., malicious AWS employee with KMS access).

**Recommendation**: Add a paragraph on "Cloud Provider Trust Assumptions" explicitly stating whether VERA assumes cloud KMS operators are honest.

---

### 4. FORMALIZATION: 6/10

**Strengths:**
- **Definitions are clear**: Definitions 1-4 (Section 3.2) are precise and use standard cryptographic notation.
- **Typed schemas throughout**: TypeScript interfaces for PoE, ToolExecutionReceipt, PolicyEvaluationRequest, etc., provide machine-readable specifications.
- **JCS canonicalization**: Explicit use of RFC 8785 for deterministic signing is a best practice rarely seen in industry papers.

**Weaknesses:**
- **Security arguments are informal**: The "Argument for Non-Repudiation" and "Argument for Tamper-Evidence" (Section 3.3) are prose, not formal proofs. For IEEE S&P, even industry track papers benefit from proof sketches with game-based security definitions.
- **Definition 3 (Policy Enforcement Completeness) is vague**: The phrase "with respect to the controlled action surface S" is underspecified. What formally defines S? How is "independently observable" verified? The definition needs tightening.
- **No complexity analysis**: The SWDB algorithm (Section 4.2.3) has no runtime complexity analysis. What is the computational cost of GMM fitting over N=10,000 vectors?

**Recommendation**: Convert security arguments to game-based proof sketches (3-5 lines each). Tighten Definition 3 with a formal characterization of S.

---

### 5. EVALUATION: 7/10

**Strengths:**
- **Empirical results are concrete**: Section 7.1 provides latency measurements (14ms median for prompt injection, 3ms for PoE signing), precision/recall for PII detection (97.3% / 94.1%), and adversarial test outcomes (90.2% block rate).
- **Transparent failure disclosure**: Section 7.2 lists the 4 bypassed vectors with honest explanations. This is rare and commendable.
- **Running code**: 12 deployed services with 25/25 passing contract tests is strong evidence for an industry paper.

**Weaknesses:**
- **No scalability evaluation**: The paper acknowledges (Section 10.1) that VERA has not been tested at 1000+ agents. For an industry paper, a scalability projection or simulation would strengthen the evaluation.
- **Adversarial test suite is not public**: The "agent-pentest" suite is mentioned as deployed (npm), but no link or reproducibility instructions are provided. For verifiability, the test vectors should be in the appendix or a public repository.
- **No comparison to baselines**: Prompt injection detection at 14ms is fast, but compared to what? No comparison to Rebuff, LLM Guard, or other tools.
- **GMM anomaly detection is not validated**: The SWDB algorithm (Section 4.2.3) has no empirical validation. What is the actual FPR/TPR on a real agent workload?

**Recommendation**: Add scalability projections (even analytical). Publish the agent-pentest vectors. Validate SWDB on at least one real agent deployment.

---

### 6. WRITING QUALITY: 8/10

**Strengths:**
- **Clarity**: The paper is well-structured, with clear section headings, tables, and diagrams. The progression from problem → threat model → architecture → implementation is logical.
- **Appropriate tone**: The writing is professional and avoids marketing language. Phrases like "Trust without proof is aspiration" are memorable but not hyperbolic.
- **Technical precision**: Use of terms like "PEP," "PDP," "JCS canonicalization," and "EU-CMA" is correct and consistent.

**Weaknesses:**
- **Overly long**: At 13 sections + abstract, this paper exceeds typical industry track length (IEEE S&P industry track is usually 8-10 pages). Sections 6 (supply chain) and 9 (compliance) could be condensed or moved to an appendix.
- **Mermaid diagrams are non-standard**: While clear, Mermaid syntax is not typical for IEEE submissions. Convert to standard figures (e.g., TikZ, Visio).
- **Minor verbosity**: Some sections (e.g., 4.2.1a nonce lifecycle) are overly detailed for the main text. Move normative nonce specifications to an appendix.

**Recommendation**: Condense to 10 pages for main content. Move detailed specifications (nonce lifecycle, SBOM formats) to appendices. Convert Mermaid to standard figures.

---

### 7. LIMITATIONS: 9/10

**Strengths:**
- **Exceptional honesty**: Section 10 is a model for industry papers. Seven limitations are explicitly acknowledged, including scalability (10.1), performance overhead (10.2), and the gap between PoE integrity and execution correctness (10.3).
- **No overselling**: The paper explicitly states "We do not claim VERA solves the alignment problem" (10.4) and "Implementing VERA does not automatically make an organization compliant" (Section 9).
- **Quantum-safe migration path**: Section 10.6 acknowledges post-quantum cryptography requirements.

**Weaknesses:**
- **Missing limitation: Cost**: No discussion of the financial cost of VERA deployment (KMS fees, anchor transaction costs, PEP compute overhead).
- **Missing limitation: Operator burden**: Configuring OPA policies, curating evaluation datasets, and managing evidence portfolios requires skilled operators. The operational complexity is not discussed.

**Recommendation**: Add a subsection on "Operational Complexity" and "Deployment Cost" to Section 10.

---

## OVERALL ASSESSMENT

**OVERALL SCORE: 8/10**

**VERDICT: Accept**

This is a strong industry track paper that addresses a real gap in AI agent security with a well-architected solution. The threat model is rigorous, the architecture is clearly specified, and the empirical results demonstrate feasibility. The honest acknowledgment of limitations and transparent disclosure of bypassed adversarial vectors is exemplary.

**Strengths:**
1. Novel architectural contribution (evidence-based trust, tool execution receipts, pluggable anchoring)
2. Rigorous threat model with five adversary classes and explicit capability matrices
3. Running code with 12 deployed services and empirical latency/accuracy measurements
4. Exceptional honesty about limitations and residual risks

**Weaknesses:**
1. Evaluation lacks scalability testing and baseline comparisons
2. Formal properties are informally argued (need proof sketches)
3. Related work missing academic security citations (TEE, BFT, adversarial ML)
4. Paper is too long for industry track (condense to 10 pages)

---

## TOP 3 SPECIFIC IMPROVEMENTS

### 1. **Strengthen Evaluation (Priority: High)**
- **Add scalability projections**: Provide analytical or simulated performance for 100, 1000, 10000 agents. Model PDP latency, PoE storage growth, and anchor throughput.
- **Publish adversarial test vectors**: Make the 41 agent-pentest vectors publicly available (GitHub or appendix). This enables reproducibility and strengthens the "running code" claim.
- **Validate SWDB algorithm**: Run the distributional anomaly detection (Section 4.2.3) on at least one real agent deployment. Report FPR, TPR, and detection latency.

### 2. **Formalize Security Arguments (Priority: Medium)**
- **Convert prose to proof sketches**: Replace the informal "Argument for Non-Repudiation" (Section 3.3) with a game-based proof sketch:
  ```
  Game: Adversary A outputs (action a, signature σ) such that Verify(pk, a, σ) = true
  but A never queried Sign(a). By A1 (EU-CMA), Pr[A wins] ≤ negl(λ).
  ```
- **Tighten Definition 3**: Formally define the "controlled action surface S" as the set of action types for which there exists a PEP P such that all executions of actions in S are mediated by P. Specify what "independently observable" means (e.g., tool-side logs with cryptographic binding).

### 3. **Condense and Restructure (Priority: Medium)**
- **Reduce to 10 pages**: Move Sections 6 (supply chain), 9 (compliance mapping), and detailed nonce lifecycle (4.2.1a) to appendices. The main paper should focus on threat model, architecture, and evaluation.
- **Convert Mermaid diagrams to standard figures**: Use TikZ, Visio, or draw.io for IEEE-compliant figures.
- **Add related work citations**: Include 5-8 academic references:
  - TEE attestation: Costan & Devadas (Intel SGX), AMD SEV-SNP
  - BFT: Castro & Liskov (PBFT)
  - Adversarial ML: Carlini & Wagner (adversarial examples), Zou et al. (jailbreak attacks)

---

## TONE ASSESSMENT

The tone is **appropriate for IEEE S&P industry track** with minor adjustments:

**Appropriate:**
- Professional, technical language throughout
- Honest acknowledgment of limitations
- No marketing hyperbole

**Needs adjustment:**
- **Abstract**: "When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data..." — This is slightly informal for IEEE. Rewrite: "Agent failures can result in unauthorized data access, financial transactions, and cascading system failures."
- **Section 1**: "These frameworks provide useful guidance for organizations beginning their agent security journey" — "journey" is colloquial. Replace with "organizations implementing agent security controls."
- **Conclusion**: "Trust without proof is aspiration. VERA makes it architecture." — While memorable, this is too informal for IEEE. Replace with: "VERA provides the architectural layer that transforms governance guidance into verifiable enforcement."

---

## GREENLIGHT DECISION

**GREENLIGHT: YES**

**Justification:**
This paper makes a solid contribution to AI agent security with a well-structured architecture, rigorous threat model, and demonstrated implementation. The evaluation is adequate for an industry paper, though it would benefit from scalability testing and baseline comparisons. The honest disclosure of limitations and bypassed adversarial vectors is exemplary and raises the bar for industry submissions.

With the recommended improvements (scalability evaluation, formal proof sketches, condensed structure), this paper will be a strong addition to the IEEE S&P industry track. The architecture is sound, the code is open source, and the problem is real. Accept with minor revisions.

**Recommendation to Authors:**
Revise according to the three priority improvements above. Resubmit with scalability projections, published test vectors, and condensed structure. With these changes, this is a strong accept.

---

**Final Score: 8/10 | Verdict: Accept | Greenlight: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 47.9s

---

### Red Team Review: VERA Paper

As Raven, I've dissected this paper with a zero-trust lens, probing for gaps an adversary would exploit. VERA is ambitious and well-structured—formal properties, typed schemas, running code (kudos on 12 MIT-licensed services), empirical benchmarks, and an honest limitations section set it apart from vaporware frameworks. It operationalizes Zero Trust for agents better than NIST/OWASP alone. However, it over-relies on a "trusted enforcement plane" (a classic single point of failure), treats PoE as stronger non-repudiation than it delivers, and leaves maturity gaming and containment bounds aspirational. Brutal truth: This is production-grade scaffolding, but not bulletproof against insiders or evaders without heavy customization. It's credible for mid-tier deployments (e.g., enterprise data analysis agents), but high-stakes (finance T4) needs hardening.

#### Scores (1-10, higher = stronger)
1. **THREAT MODEL COVERAGE**: 8/10  
   Five classes (not four, as prompt assumes—Manipulator, Insider, Escalator, Evader, Enforcement-Plane Compromiser) map well to OWASP Top 10 and real vectors (e.g., RAG poisoning, telemetry evasion). Capability matrices and combined scenarios are thorough. Deduction: Misses nation-state (e.g., model theft via side-channels), physical actuators (nodded in 10.7 but out-of-scope), and quantum threats beyond migration notes. A3/A4 assumptions are explicit but brittle.

2. **DEFENSE DEPTH**: 7/10  
   Pillars cover key surfaces (input firewalls, PoE chains, tool receipts, anomaly GMM). Receipts + nonces close PoE-to-execution gap elegantly; ONNX local inference avoids data leaks. Empirical 90% block rate on 41 vectors is solid. Weaknesses: Enforcement plane trust (Class 5 mitigations like Kyverno/SLSA2 are good but bypassable via cloud admin); no TEE enforcement (just optional); non-determinism limits SWDB (adversaries mimic baselines). Receipts fail for uncooperative SaaS tools (downgraded to "gateway").

3. **MATURITY MODEL RESISTANCE**: 6/10  
   Evidence portfolios > calendar time; signed approvals + adversarial tests reduce gaming. Auto-demotion on gaps/anomalies is smart. But gameable: Poison eval datasets (curated by sec team? Insiders collude), fake PoE via Class 5 compromise, or social-engineer approvers (T4 needs "risk committee"—vague). Re-validation periodic but not continuous; overrides need 2PA but log as PoE (auditable, but post-facto).

4. **SUPPLY CHAIN**: 7/10  
   SBOM + signed manifests (models/tools/prompts) + SLSA2 gates address typosquatting/LoRA backdoors. RAG provenance scoring is novel. Gaps: Model training data "minimum viable" (HF IDs + attestation) ignores synthetic data poisoning or upstream supply (e.g., Common Crawl vulns); config immutability doesn't cover runtime param injection; zero-days in deps (e.g., signed numpy exploit).

5. **CONTAINMENT**: 6/10  
   Multi-stage (500ms token revoke to 60s compensation) + multi-source signals (vs. single telemetry poisoning) is proactive. Caps (hourly_value, tx_window) bound loss formally. But determined attacker (Evader+Insider) evades: In-flight async ops exceed bounds (10s SLA optimistic); compensating tx assumes reversibility (crypto tx irreversible); state freeze misses off-box caches; Class 5 suppresses anchors.

6. **HONESTY**: 9/10  
   Exceptional: Section 10 details scalability/perf/PoE limits/non-determinism/multi-agent gaps. Transparent bypassed vectors (90% block → lists 4 fails + fixes). Compliance "honest assessment" avoids hype. Minor puff: "Proof over policy" but PoE proves logging, not execution (clarified but leads with stronger implication).

**OVERALL SECURITY VALUE**: 7/10  
Strong reference arch for agent Zero Trust—fills NIST enforcement gap with code. Deployable today for T1-T3; T4 viable with tweaks. Beats frameworks like MAESTRO/AWS by providing PDPs/PEPs/proofs.

**GREENLIGHT**: YES  
Credible architecture: Running code, formal args under assumptions, empirical data. Not perfect, but verifiable and extendable (MIT). Green for orgs willing to own hardening.

#### TOP 3 Attack Vectors to Address/Strengthen
1. **Enforcement Plane Compromise (Class 5 Amplification)**: Cloud admin modifies IAM/KMS conditions or injects sidecar bypass (e.g., host escape). Strengthen: Mandate TEEs (SEV-SNP) for PDP/PEP + runtime measurement in PoE.
2. **Maturity Gaming via Collusion/Poisoned Evidence**: Insider poisons eval datasets or 2PA-approves backdoored portfolios. Strengthen: External auditors for T3+ portfolios; zk-proofs for test results; quorum from independent oracles.
3. **Async/In-Flight Evasion + Irreversible Side Effects**: Evader triggers queued tx before containment; non-reversible ops (e.g., delete, wire transfer) exceed bounds. Strengthen: Intent-confirming pre-PEPs; all tools mandate receipts + reversibility SLAs.

#### Flagged Aspirational Claims (Achievable with Work vs. Out-of-Box)
- **"Maximum financial damage bounded by..." (Def 4)**: Assumes perfect sync/cancellation; real async (Kafka queues, DB eventual-consistency) leaks unbounded. Aspirational without universal compensating tx support.
- **"End-to-end verifiable enforcement" via PoE+Receipts**: Strong if tools cooperate; weak for SaaS (gateway receipts). Aspirational for heterogeneous ecosystems.
- **"Anomaly detection for non-deterministic agents" (SWDB)**: GMM works short-term but evadable via gradual drift/mimicry. Aspirational as "solved"; paper admits limits but benchmarks imply robustness.
- **Quantum readiness**: "Supports migration"—true abstraction, but defaults (Ed25519) vulnerable; no PQ migration plan/timelines.
- **"90.2% block rate"**: Good disclosure, but single-suite (41 vectors); aspirational for "comprehensive" without red-team benchmarks (e.g., no multi-turn RAG chains).

---

### Thorough Expert Review

#### Strengths (What Works Well)
- **Arch Primitives**: PDP/PEP placement explicit (sidecar/central patterns), fail-closed defaults, nonce-binding for receipts—textbook Zero Trust adapted for agents. Mermaid diagrams clarify boundaries.
- **PoE Design**: JCS-canonical + hash-chain + pluggable anchors (Rekor > blockchain for most) = solid tamper-evidence. resultHash semantics handle PII redaction smartly.
- **Agent-Specific**: RAG ACLs/source scoring, tool-param constraints (e.g., DB limit=1000), GMM for non-determinism—addresses gaps in NIST/OWASP (table 1.2 proves it).
- **Evidence > Hype**: 12 services, 25/25 tests, 41-vector pentest with bypass disclosure + fixes (v2.2+). Latency benchmarks realistic (14ms firewall).
- **Extensibility**: Typed TS schemas, OPA Rego examples, MIT code—forkable. DID:web + SPIFFE bridges legacy IAM.
- **Formalism**: A1-A4 assumptions crisp; defs/args hold under them (e.g., non-repudiation solid sans A3 break).

#### Critical Weaknesses & Exploits (Brutal Breakdown)
1. **Trusted Enforcement Plane is Achilles' Heel**:
   - Class 5 honest, but mitigations (cosign/Kyverno, IAM conditions) fail golden SAML (steal attested creds) or provider compromise (AWS KMS insider). Exploit: Pivot from app to control plane via IAM escalation → forge PoE at will.
   - Fix: Enforce runtime attestation in *every* PoE (e.g., include SPIFFE SVID hash); default to TEEs.

2. **PoE: Signed Logs ≠ Verifiable Execution**:
   - Paper clarifies (10.3), but abstracts as "behavioral proof" (Pillar 2). Adversary replays old nonces or skips PEPs (direct socket if proxy fail-open). Receipts great but: (a) tools must implement (SaaS gateway weak), (b) nonce LRU evicts under load (DoS vector), (c) no proof agent *didn't* act out-of-band.
   - Exploit: Evader does shadow exfil (low-volume direct egress if proxy lagged), PoE logs clean actions.
   - Fix: eBPF for syscall coverage; require receipts or block.

3. **Anomaly Detection Fragile**:
   - SWDB/GMM clever (BIC for K, decay α=0.995), tiered FPR good. But LLMs: Same prompt → output drift > noise; adversaries ADAPT (mimic + perturb).
   - Exploit: Boil-frog (Section 4.2.3 admits); or poison baseline via legit drift.
   - Fix: Multi-modal (syntax + semantics + graph-of-actions); external canaries.

4. **Maturity Gaming Vectors**:
   - Portfolios signed, but eval datasets "curated by sec team"—insider poisons → A-grade backdoor sails to T4.
   - T4 "risk committee"—who? No quorum threshold.
   - Exploit: Escalator inflates actions (fake PoE? No, Class 3 can't sign); collude for approvals.
   - Fix: ZK-SNARKs for portfolio stats; blinded evals.

5. **Supply Chain Shallow**:
   - Good gates, but models: HF ID ≠ full lineage (ignores distil/poisoned snapshots). Prompts: Git signed, but runtime override via env vars?
   - Exploit: Typosquat signed dep → zero-day (e.g., numpy pickle RCE).
   - Fix: SLSA4 + in-toto for full pipeline; model watermarks/verif.

6. **Containment Gaps**:
   - Multi-source good (3+ for auto), but signals from *trusted* telemetry? Evader poisons.
   - Bounds: tx_window × rate ignores burst queues.
   - Exploit: Pre-load async tx (e.g., batch payments), trigger anomaly post-send.
   - Fix: Pre-execution value estimation + holds; universal tx ledgers.

7. **Scalability/Perf Reality Check** (10.1-2 Honest, But...):
   - 1000+ agents: Sharding unbuilt. KMS 50ms p99 kills loops.
   - Edge pattern (sidecar PDP) stale bundles (60s)—revoke lag.

8. **Edge Cases Ignored**:
   - Multi-agent: "Capability attenuation" vague; no BFT (10.5).
   - Quantum: Ed25519 fine now, but no auto-migrate hooks.
   - Physical: Out-scope, but agents + IoT = blast radius.

#### Comparative vs. SOTA
| Framework | VERA Edge | VERA Gap |
|-----------|-----------|----------|
| NIST 800-207 | Agent-adapted PDP/PEP | Human assumptions |
| OWASP Agentic | Enforcement for all 10 | Multi-turn depth |
| MAESTRO | Running code > risks | - |
| AWS | Evidence tiers > scoping | Cloud-only |

VERA wins on verifiability; loses to TEE-heavy (e.g., Confidential Agents) on assurance.

#### Recommendations (Constructive Roadmap)
- **v2 Priorities**: TEE-default PDP, zk-portfolios, async tx simulator tests.
- **Deploy Checklist**: Audit eval datasets, tool receipt coverage (>90%), Class 5 drills.
- **Extensibility**: Hooks for BFT swarms, PQ sigs.
- **Benchmark More**: Red-team 100+ vectors (multi-turn, swarms); publish under attack.

VERA advances the field—deploy it, but red-team your impl. Trust, but verify.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 7/10
**Greenlight:** ❌ NO
**Response time:** 36.0s

---

**Expert Review: VERA Paper from a CISO Perspective**

As Sarah Blackwell, CISO of a European financial services firm, my primary lens is operational risk, regulatory adherence, and board-level accountability. The VERA paper presents a sophisticated, technically sound architecture. However, its utility for my organization is a question of **practical implementation versus theoretical completeness**. Here is my dimensional analysis:

---

### **Dimensional Scores (1-10)**

1.  **OPERATIONALIZABILITY: 7/10**
    *   **Strengths:** The paper provides a concrete reference architecture (PDP/PEP), explicit deployment patterns, and 12 open-source services. The threat model and control mappings are actionable. The "Getting Started" section with code is a significant plus.
    *   **Concerns:** The technical depth (cryptographic proofs, ONNX firewalls, SPIFFE integration) assumes a high level of in-house platform engineering maturity. Integrating this with legacy IAM, logging, and SIEM systems is hinted at but not detailed. The jump from "here's the architecture" to "here's how you retrofit it to your monolithic core banking API" is substantial.

2.  **COMPLIANCE HONESTY: 9/10**
    *   **Strengths:** Section 9, "Compliance Mapping (Honest Assessment)," is exceptional and rare. It correctly states that VERA does not equal compliance, highlights what it *potentially supports*, and includes the crucial disclaimer about the EU AI Act's lack of explicit agent coverage. This builds credibility.
    *   **Concerns:** While honest, it could go further in mapping to specific **DORA** (digital operational resilience) requirements (e.g., Article 16 - ICT-related incident reporting, Article 26 - vulnerability handling) and **SOX** (change management, segregation of duties for financial controls).

3.  **COST AWARENESS: 4/10**
    *   **Weakness:** This is the paper's most significant blind spot from an enterprise CISO view. It mentions latency overheads but glosses over the immense **people, process, and platform costs**. Implementing and maintaining a custom zero-trust enforcement layer with cryptographic proof chains, anchor services, and dedicated policy engineering requires a dedicated team. There is no discussion of TCO, skills gap, or operational burden.

4.  **VENDOR NEUTRALITY: 10/10**
    *   **Strengths:** The paper is impeccably vendor-neutral. It references standards (NIST, OWASP), provides multiple anchor backend options (including non-blockchain), and uses open-source examples (OPA, Sigstore). It does not promote any commercial product.

5.  **REGULATORY REALISM: 6/10**
    *   **Strengths:** The honest assessment of the EU AI Act is correct and prudent. The focus on verifiable evidence and audit trails directly supports regulatory scrutiny.
    *   **Concerns:** For financial services, key regulatory pressures are not fully addressed. **DORA's** focus on third-party risk (how does VERA govern agent dependencies?), major incident reporting timelines, and resilience testing is not mapped. **SOX** implications for ITGCs around change management of policy bundles and key rotation are not explored. The paper is generic; it needs a financial services annex.

6.  **BOARD READINESS: 6/10**
    *   **Analysis:** The abstract and problem statement are excellent for a board audience ("blast radius... exfiltrated customer data"). The maturity runtime (Section 5) is a compelling, board-friendly concept of earning trust.
    *   **Concerns:** The middle sections are highly technical. To present this, I would need to create a significant abstraction layer. The lack of clear cost/benefit analysis and specific regulatory risk mitigation makes board approval challenging without further internal work.

7.  **PRACTICAL VALUE: 8/10**
    *   **Strengths:** Would this protect my organization? **Yes, technically.** If fully implemented, VERA would drastically reduce the agent-related attack surface, provide unparalleled auditability, and enable a structured, evidence-based rollout. The focus on memory/RAG governance and tool-parameter authorization addresses real, observed gaps.
    *   **Caveat:** The protection is contingent on flawless implementation, which is a massive undertaking. The value is high, but the barrier to realizing it is equally high.

### **OVERALL SCORE: 7/10**

This is a high-quality, technically rigorous framework that genuinely advances the field from governance theory to enforcement architecture. Its honesty about limitations and compliance is commendable. However, its enterprise practicality is hampered by underestimated costs and insufficient tailoring to highly regulated industries like finance.

---

### **GREENLIGHT: CONDITIONAL YES**

**Publication is recommended,** as the paper provides substantial value to the security community and sets a new standard for architectural thinking in agent security. However, the authors should be aware that for CISOs in regulated industries, it is a **foundational reference, not an implementation blueprint.**

### **TOP 3 IMPROVEMENTS NEEDED (CISO Perspective):**

1.  **Financial Services Regulatory Deep Dive:** Add an annex or section explicitly mapping VERA controls to **DORA** (e.g., Articles 5, 16, 17, 26) and **SOX** key controls (change management, segregation of duties, audit trail integrity). Discuss how the PoE chain and evidence portfolio satisfy regulatory evidence requirements.
2.  **Total Cost of Ownership (TCO) & Implementation Phasing:** Acknowledge the significant resource commitment. Provide a **phased implementation roadmap** (e.g., Phase 1: Identity & Basic PEP for T1 agents; Phase 2: PoE & Data Governance; Phase 3: Full maturity runtime). Include rough estimates for FTE, infrastructure, and ongoing operational overhead.
3.  **Integration Guidance for Legacy Enterprises:** Most financial firms are not greenfield. Provide clearer patterns for integrating VERA's DID/VC identity with existing **Active Directory/IAM**, its PoE chain with **Splunk/SIEM**, and its policy engine with existing **GRC and change management workflows**. A "brownfield integration" section would be invaluable.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 8/10
**Greenlight:** ❌ NO
**Response time:** 10.6s

---

## VERA Paper Review

VERA presents a comprehensive zero-trust architecture for AI agents, emphasizing runtime enforcement via PDP/PEP patterns, cryptographic proofs, and evidence-based trust tiers. While conceptually strong, implementability varies due to detailed specs but absent code verification.

## Scores

**1. TECHNICAL DEPTH: 9/10**  
Schemas (e.g., ProofOfExecution, VeraAgentIdentity in TypeScript), interfaces (PDP/PEP inputs/outputs), and architectures (trust boundaries, deployment patterns A/B) are highly detailed, with formal properties, threat matrices, and Mermaid diagrams enabling direct prototyping. Gaps exist in full pseudocode for anomaly detection (SWDB algorithm) and nonce lifecycle enforcement.

**2. TOOLING ALIGNMENT: 9/10**  
References 2026-relevant tools like OPA/Rego for PDP, cosign/Sigstore/Kyverno for artifact signing, SPIFFE/SVID for attestation, ONNX/DistilBERT for firewalls, Solana/Rekor for anchoring, and A2A interoperability—aligning with current enterprise standards (e.g., SLSA Level 2+, Ed25519/ECDSA). Minor staleness risk in bundle syncs acknowledged.

**3. CODE AVAILABILITY: 6/10**  
Claims 12 MIT-licensed services (e.g., Veracity Core, ConvoGuard) with git clone instructions, npm tests (25/25 passing), and empirical metrics from deployments. No verifiable GitHub repo or npm packages found (searches failed), dropping score; claims unbacked without links to live code.

**4. COMPETING FRAMEWORKS: 8/10**  
Superior to NIST 800-207/OWASP/MAESTRO/AWS in enforcement (PDP/PEP, proofs, typed schemas) per comparison table; complements Google A2A (identity interop) and LangChain (tool chaining via wrappers). Lacks quantitative benchmarks vs. alternatives; residual risks (e.g., multi-agent BFT) noted honestly.

**5. SCALABILITY: 6/10**  
Addresses sharding hints but admits limitations (tested <1000 agents; no distributed rate limiting/hierarchical PDP details). Containment bounds (e.g., max_loss formula) and low-latency patterns (1-3ms sidecar) help, but lacks throughput metrics or Kubernetes scaling guides.

**6. INTEROPERABILITY: 9/10**  
Strong support for standards: A2A (SPIFFE delegation), MCP (implied via tool manifests), SPIFFE (runtime binding), DID:web/JWT-VC, JCS-RFC8785, OPA bundles. Integrates with AWS/GCP KMS, mTLS; pluggable anchors (Rekor, Solana) enhance flexibility.

**7. CODE vs WORDS: 75%**  
~75% implementable: full schemas, Rego examples, PoE specs, deployment patterns directly buildable; anomaly algo and multi-stage containment need fleshing out. Running code claim boosts, but unverified repo limits to spec-driven impl.

**OVERALL: 8/10**

## GREENLIGHT
YES

## Top 3 Technical Gaps
1. **Live Code Repository**: Provide verifiable GitHub/npm links to 12 services; current clone URL inaccessible, hindering reproduction of empirical results (e.g., 90.2% block rate).
2. **Scalability Blueprints**: Detail sharded anomaly detection, distributed noncing, and 1000+ agent Kubernetes configs; current tests limited to small deployments.
3. **Multi-Agent BFT**: Extend delegation with Byzantine fault tolerance protocols for swarms; current attenuation insufficient per limitations section.

════════════════════════════════════════════════════════════════════════════════
