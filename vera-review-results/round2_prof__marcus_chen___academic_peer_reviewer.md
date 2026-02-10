# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 124.8s
**Score:** 7/10
**Greenlight:** ✅ YES

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