# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 93.8s
**Score:** 8/10
**Greenlight:** ✅ YES

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