# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 125.4s
**Score:** 9/10
**Greenlight:** ❌ NO

---

# IEEE S&P Industry Track Review: VERA

## Reviewer Identity
Professor Marcus Chen, ETH Zurich
Chief Reviewer, IEEE Security & Privacy

---

## DIMENSIONAL SCORING

### 1. CONTRIBUTION: 8/10

**Strengths:**
- **Clear architectural gap identified**: The paper articulates a genuine enforcement gap between governance frameworks and runtime systems. The distinction between "what to document" versus "how to enforce" is valid and underserved in current literature.
- **Concrete operationalization**: Unlike purely conceptual frameworks, VERA provides typed schemas, explicit PDP/PEP placement, and deployment patterns. The distinction between central PDP and hardened sidecar patterns addresses real operational constraints.
- **Evidence-based trust model**: The shift from calendar-based to proof-based maturity is a genuine contribution. Current frameworks do treat trust as time-accumulating rather than evidence-demonstrating.
- **Tool-parameter authorization**: Fine-grained authorization at the parameter level (not just resource level) addresses a real gap in agent security.

**Weaknesses:**
- **Incremental over revolutionary**: While the integration is valuable, individual components (PoE, anomaly detection, policy-as-code) are established techniques. The contribution is primarily architectural integration rather than fundamental innovation.
- **Limited novelty in cryptographic primitives**: Ed25519 signatures and hash chains are standard. The application domain is new, but the techniques are not.

**Assessment**: Solid contribution for an industry track. The architectural synthesis and running implementation elevate it beyond a position paper, but it's not breaking new cryptographic or formal methods ground.

---

### 2. RELATED WORK: 7/10

**Strengths:**
- **Comprehensive framework comparison** (Table in Section 1.2): The coverage matrix comparing NIST 800-207, OWASP, MAESTRO, and AWS is excellent and honest about what exists.
- **Proper differentiation**: The paper clearly states VERA's relationship to existing work—it operationalizes MAESTRO, implements NIST ZTA for agents, provides enforcement for OWASP categories.
- **Academic grounding**: References to runtime verification (Leucker & Schallhart), certificate transparency (RFC 6962), and formal methods are appropriate.

**Weaknesses:**
- **Missing agent-specific security literature**: The paper cites general frameworks but underrepresents academic work on LLM security, prompt injection defenses, and agent alignment. Recent work by Perez et al. (2022) on jailbreaking, Wallace et al. (2024) on universal adversarial triggers, and Greshake et al. (2023) on indirect prompt injection should be cited.
- **No comparison to concurrent systems**: Are there other runtime enforcement systems for agents being developed? The paper presents VERA as if it's the only solution, which seems unlikely in a rapidly moving field.
- **Limited discussion of TEEs**: Trusted Execution Environments (SGX, SEV, TrustZone) are mentioned briefly but not compared systematically. How does VERA compare to TEE-based agent isolation?

**Assessment**: Good coverage of frameworks, but missing depth in agent-specific attack literature and concurrent technical approaches.

---

### 3. THREAT MODEL: 9/10

**Strengths:**
- **Structured adversary classes**: The four-class model (Manipulator, Insider, Escalator, Evader) with capability matrices is excellent. This is formal, clear, and mappable to real attack scenarios.
- **Explicit trust assumptions**: A1-A4 are stated clearly. The note that "if A3 is violated, all enforcement is void" is refreshingly honest.
- **Combined attack scenarios** (Table in Section 2.3): Showing how adversary classes compose (e.g., Poisoned RAG + prompt injection) demonstrates sophisticated threat modeling.
- **OWASP mapping**: Section 8's mapping to OWASP Top 10 with residual risks is exactly what industry practitioners need.

**Weaknesses:**
- **Assumption A3 is strong**: "Agent signing keys cannot be exfiltrated by the agent runtime" requires HSM/KMS. The paper notes this but doesn't fully explore the operational complexity. Many organizations don't have HSM infrastructure for every agent.
- **Physical world boundary unclear**: The paper disclaims physical actuators (10.7) but doesn't define where digital ends and physical begins. What about agents controlling cloud infrastructure that has physical consequences (e.g., spinning up 10,000 instances)?
- **Side-channel attacks not addressed**: Timing attacks, resource exhaustion, and covert channels are not in the threat model.

**Assessment**: Strong, well-structured threat model with honest assumptions. Minor gaps in operational feasibility and side channels.

---

### 4. FORMALIZATION: 7/10

**Strengths:**
- **Four formal properties with definitions**: Non-repudiation, chain tamper-evidence, policy enforcement completeness, and containment bound are clearly defined.
- **Proof arguments under assumptions**: The paper states what each property guarantees *under which assumptions*. The note that "PoE guarantees signing, not execution correctness" (10.3) is critical honesty.
- **Typed schemas throughout**: Every interface (VeraAgentIdentity, ProofOfExecution, PolicyEvaluationRequest) is formally specified in TypeScript. This is unusual for a security paper and highly valuable for implementation.

**Weaknesses:**
- **Not fully formal**: The "proof arguments" in Section 3.3 are informal security arguments, not machine-checked proofs. For a paper titled "Verified Enforcement," this is a gap. The paper should either use a proof assistant (Coq, Isabelle) or retitle to "Verifiable Enforcement."
- **Missing adversary model in formal properties**: Definitions 1-4 don't explicitly state which adversary classes they defend against. Definition 1 (non-repudiation) should state "holds against Manipulator and Escalator under A1+A3."
- **Containment bound (Definition 4) has gaps**: The bound assumes synchronous enforcement but acknowledges in-flight operations may exceed it. The formula should include a term for in-flight cancellation latency.

**Assessment**: Strong formalization for an industry paper, but not rigorous enough for the "verified" claim. Would be stronger titled "Verifiable" or with machine-checked proofs.

---

### 5. EVALUATION: 6/10

**Strengths:**
- **Running code**: 12 deployed services, all open source, is exceptional for a framework paper. The GitHub repository is real and contains working code.
- **Empirical latency measurements**: Table in Section 7.1 provides concrete numbers (14ms prompt injection detection, 3ms PoE signing). These are reproducible claims.
- **Adversarial testing results** (Section 7.2): 41 attack vectors with transparent disclosure of 4 bypasses is excellent. The honesty about bypassed vectors (Unicode homoglyphs, multi-turn injection) is rare and commendable.
- **Contract validation tests**: 25 passing tests is a good start for correctness validation.

**Weaknesses:**
- **No large-scale deployment data**: The paper claims services are "deployed" but provides no usage statistics. How many production agents? What workloads? What scale?
- **Single-organization evaluation**: All results appear to be from Berlin AI Labs' own deployments. No independent validation or third-party adoption data.
- **Missing performance benchmarks**: No comparison to baseline (agent without VERA). What is the overhead? The paper states 14-22ms added latency but doesn't show impact on end-to-end agent task completion.
- **No user study**: For a system claiming to improve security governance, there's no evaluation of whether security teams find it usable, understandable, or effective.
- **Anomaly detection evaluation is thin**: The SWDB algorithm (Section 4.2.3) has no empirical validation. What are the actual false positive rates? How does it perform against real adversarial drift?

**Assessment**: Strong for code availability and transparency, weak for independent validation and scale evidence. This is the biggest gap for IEEE S&P acceptance.

---

### 6. WRITING QUALITY: 8/10

**Strengths:**
- **Clear structure**: The five-pillar organization is easy to follow. Each pillar has enforcement principle → specification → implementation.
- **Appropriate tone**: The writing is professional, precise, and avoids marketing language. Statements like "Trust without proof is aspiration" are punchy but not unprofessional.
- **Excellent use of tables**: The capability matrix, framework comparison, and OWASP mapping tables are information-dense and well-formatted.
- **Honest limitations section**: Section 10 is unusually thorough for a systems paper. Admitting "we have not built these at scale" (10.1) is refreshing.

**Weaknesses:**
- **Length**: At 13 sections, this is long for a conference paper. IEEE S&P typically expects 12-14 pages in two-column format. This would need significant condensation.
- **Some repetition**: The enforcement gap is stated in abstract, introduction, and Section 1.1. Could be tightened.
- **Mermaid diagrams**: While helpful, the Mermaid syntax won't render in PDF. These need to be pre-rendered or replaced with standard figures.
- **Occasional informality**: Phrases like "When they go wrong, the blast radius is not a misclassified image" (abstract) are effective but border on colloquial for IEEE S&P.

**Assessment**: Strong writing overall, but needs condensation and diagram formatting for publication.

---

### 7. LIMITATIONS: 9/10

**Strengths:**
- **Section 10 is exemplary**: Seven subsections covering scalability, performance, integrity vs. correctness, non-determinism, multi-agent gaps, cryptographic assumptions, and physical actuators.
- **Honest about what's not solved**: "We do not claim VERA solves the alignment problem" (10.4) and "Byzantine fault tolerance for agent swarms...are not addressed" (10.5) are critical admissions.
- **Residual risks in tables**: Every OWASP mapping includes a "Residual Risk" column. Every combined attack scenario includes mitigation and residual risk.
- **Transparent about bypassed attacks**: Section 7.2 discloses 4 bypassed vectors with explanations.

**Weaknesses:**
- **No discussion of cost**: VERA adds complexity (12 services, KMS, anchoring). What is the operational cost? This is a limitation for adoption.
- **Limited discussion of false positives**: Anomaly detection will have false positives. What is the operational impact of demoting legitimate agents?

**Assessment**: Outstanding limitations section. Sets a standard for honest research communication.

---

## OVERALL SCORE: 7.5/10

**Justification**: VERA is a solid industry-track contribution that addresses a real gap with running code and honest evaluation. The threat model is strong, the architecture is well-specified, and the limitations are transparently disclosed. However, it lacks independent validation, large-scale deployment data, and fully formal verification. For an industry track, this is acceptable. For the main research track, it would need stronger evaluation.

---

## VERDICT: **WEAK ACCEPT**

**Reasoning**:
- **Strengths outweigh weaknesses**: The architectural contribution, running implementation, and transparent limitations make this valuable for practitioners.
- **Industry track fit**: This is exactly what industry tracks are for—operationalizing research concepts with real systems and honest engineering tradeoffs.
- **Reproducibility**: Open source code and clear specifications enable independent validation.
- **Gaps are addressable**: The evaluation weaknesses can be addressed with revisions (add independent adoption data, performance comparisons, user studies).

**Conditions for acceptance**:
1. Add independent validation (at least one external organization deploying VERA)
2. Provide performance overhead comparison (agent task completion time with/without VERA)
3. Condense to IEEE S&P page limits (likely 12-14 pages two-column)
4. Retitle to "Verifiable" instead of "Verified" unless machine-checked proofs are added
5. Expand related work to include recent LLM security literature

---

## TOP 3 SPECIFIC IMPROVEMENTS

### 1. **Independent Validation** (Critical)
**Current gap**: All evaluation is self-reported from Berlin AI Labs. No third-party adoption.

**Required improvement**:
- Partner with at least one external organization to deploy VERA in their environment
- Report their deployment experience, challenges, and outcomes
- Include their performance data in Section 7
- If no external deployment is feasible before submission, add a "Future Work" subsection committing to open beta program with named partners

**Why this matters**: IEEE S&P reviewers will question generalizability. Self-evaluation is a red flag for industry systems papers.

---

### 2. **Performance Overhead Analysis** (Critical)
**Current gap**: Latency numbers are provided (14ms, 3ms) but no end-to-end impact analysis.

**Required improvement**:
- Benchmark agent task completion time with and without VERA enforcement
- Test on representative workloads (e.g., customer service agent handling 100 requests, data analysis agent processing 10,000 rows)
- Report overhead as percentage of baseline: "VERA adds X% latency to agent task completion"
- Include throughput impact (requests/second with vs. without VERA)
- Add a "Performance Tuning" subsection with guidance on when to use central vs. sidecar PDP based on latency requirements

**Why this matters**: Practitioners need to know if VERA is deployable in their latency budget. "14ms" means nothing without context.

---

### 3. **Formalization Rigor** (Important)
**Current gap**: Title says "Verified" but proofs are informal security arguments.

**Required improvement** (choose one):
- **Option A**: Retitle to "VERA: Verifiable Enforcement for Runtime Agents" (one word change, honest)
- **Option B**: Add machine-checked proofs for Definitions 1-4 using Coq or Isabelle, include proof scripts in repository
- **Option C**: Reframe as "proof arguments" throughout and remove "verified" from title

**Recommended**: Option A (retitle). Machine-checked proofs are valuable but likely too much work for revision. The architecture is verifiable (independently checkable), not verified (formally proven).

**Why this matters**: "Verified" has specific meaning in security community. Misuse will draw criticism from formal methods reviewers.

---

## ADDITIONAL RECOMMENDATIONS

### Minor Issues to Address:

1. **Mermaid diagrams**: Convert to PNG/SVG before submission. IEEE S&P doesn't support Mermaid in LaTeX.

2. **A3 assumption operationalization**: Add a deployment guide subsection: "Organizations without HSM infrastructure can use cloud KMS (AWS KMS, GCP Cloud KMS) or SPIFFE/SPIRE with workload attestation. Minimum requirement: keys must not be accessible as environment variables or filesystem secrets."

3. **Anomaly detection evaluation**: Add empirical FPR/FNR results for SWDB algorithm on a labeled dataset. If no labeled agent anomaly dataset exists, create one and release it (this would be a secondary contribution).

4. **EU AI Act disclaimer**: The note in Section 9 is good but should be moved to a footnote. The main text should focus on NIST AI RMF and SOC 2, which have clearer agent applicability.

5. **Multi-agent section**: Section 10.5 admits Byzantine fault tolerance is not addressed. Either remove multi-agent claims from the abstract or add a "Multi-Agent Extensions" section outlining how VERA could be extended with BFT protocols (even if not implemented).

6. **Cost analysis**: Add a subsection estimating operational costs: infrastructure (KMS, anchoring, PDP cluster), latency overhead, and complexity burden. Be honest: "VERA is not free. Organizations should expect X% infrastructure cost increase and Y engineering effort for deployment."

---

## TONE ASSESSMENT

**Overall tone**: Professional and appropriate for IEEE S&P industry track.

**Passages to adjust**:

1. **Abstract, first paragraph**: "When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data, unauthorized financial transactions, and cascading failures across downstream systems."
   - **Issue**: Slightly dramatic for academic venue
   - **Suggested revision**: "Agent failures can result in data exfiltration, unauthorized transactions, and cascading system failures—consequences that require architectural enforcement, not just governance guidance."

2. **Section 1 title**: "The Problem: The Enforcement Gap"
   - **Issue**: "The Problem" is informal
   - **Suggested revision**: "1. Introduction: The Enforcement Gap in Agent Security"

3. **Section 13 conclusion**: "Trust without proof is aspiration. VERA makes it architecture."
   - **Issue**: Punchy but borders on marketing
   - **Suggested revision**: "VERA provides the architectural layer that makes trust verifiable through cryptographic proof and runtime enforcement." (Keep the punch for talks, tone down for paper)

**Verdict on tone**: 95% appropriate. Three minor adjustments recommended above.

---

## COMPARISON TO IEEE S&P STANDARDS

### Strengths relative to typical industry track submissions:
- **Running code**: Most industry papers describe systems; this one ships code
- **Honest limitations**: Rare to see Section 10's level of transparency
- **Formal threat model**: Many industry papers lack structured adversary classes
- **Reproducibility**: Open source + typed schemas enable independent implementation

### Weaknesses relative to typical acceptances:
- **Evaluation depth**: Accepted papers typically have multi-organization deployments or large-scale user studies
- **Novelty**: Industry track accepts incremental contributions, but this is at the boundary
- **Performance analysis**: Overhead impact is under-specified

### Positioning recommendation:
This paper is **above average** for industry track but **needs revisions** to be competitive. The three critical improvements (independent validation, performance overhead, formalization rigor) are necessary for acceptance. With those addressed, this is a strong accept.

---

## FINAL RECOMMENDATION

**VERDICT**: Weak Accept (conditional on revisions)

**Confidence**: High (I have reviewed 40+ agent security papers in the past year)

**Recommendation to authors**:
1. Address the three critical improvements before camera-ready
2. Consider submitting to IEEE S&P Industry Track specifically (not main research track)
3. Prepare a demo/poster showing the 12 services in action
4. After publication, run an open beta program to gather independent validation data for a journal extension

**Recommendation to program committee**:
- Accept with **major revisions required**
- Request revised manuscript with independent validation data before camera-ready
- Consider inviting as **poster + short paper** if full paper revisions are not feasible in time

---

## GREENLIGHT: **NO**

**Reasoning**: This paper has significant merit and addresses a real problem with running code and honest engineering. However, it is not ready for publication in its current form due to:

1. **Lack of independent validation** (self-evaluation only)
2. **Insufficient performance impact analysis** (latency numbers without context)
3. **Title/formalization mismatch** ("Verified" without formal proofs)

These are **addressable gaps**, not fundamental flaws. With revisions incorporating the three critical improvements, this would be a strong accept. I recommend **major revisions and resubmission** rather than outright rejection.

**Path to greenlight**:
- Add one external deployment case study
- Benchmark end-to-end overhead on representative workloads
- Retitle to "Verifiable" or add machine-checked proofs
- Resubmit to next IEEE S&P cycle

**If authors can address points 1-2 in a revision round before camera-ready**, I would change verdict to **Accept**. But current manuscript is not publication-ready for IEEE S&P.

---

**Reviewer**: Prof. Marcus Chen, ETH Zurich  
**Date**: February 2026  
**Recommendation**: Major Revisions Required