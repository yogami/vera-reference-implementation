# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 94.4s
**Score:** 7.5/10
**Greenlight:** ✅ YES

---

# IEEE S&P Industry Track Review: VERA

**Paper ID:** VERA-2026-001  
**Reviewer:** Professor Marcus Chen, ETH Zurich  
**Review Date:** February 2026

---

## DIMENSIONAL SCORING

### 1. CONTRIBUTION: 8/10

**Strengths:**
- **Novel architectural synthesis**: While individual components (ZTA, PoE, policy engines) exist, VERA's contribution is the systematic integration with explicit PDP/PEP placement for AI agents—a gap in current frameworks
- **Evidence-based trust progression**: The shift from calendar-based to proof-based maturity is genuinely novel and addresses a real operational weakness
- **Tool-parameter authorization**: Fine-grained policy enforcement at the parameter level (not just resource level) is underspecified in existing work
- **Concrete threat model**: The four adversary classes with capability matrices provide actionable structure beyond typical "assume Byzantine adversary" handwaving

**Weaknesses:**
- The core primitives (Ed25519 signatures, hash chains, policy engines) are standard; the novelty is compositional rather than fundamental
- Some claims of "first" or "only" (e.g., "none define the runtime enforcement layer") are overstated—NIST 800-207 *does* define PDP/PEP architecture, just not for agents specifically
- The blockchain anchoring option feels like architectural tourism rather than necessity for most deployments

**Assessment:** This is solid systems work with clear practical value. The contribution is incremental but meaningful—taking existing primitives and making them work together for a new problem domain (AI agents). Not groundbreaking research, but strong engineering.

---

### 2. RELATED WORK: 7/10

**Strengths:**
- Comprehensive coverage of governance frameworks (NIST, OWASP, MAESTRO, AWS)
- Honest comparative table (Section 1.2) showing what VERA adds
- Appropriate citations for cryptographic primitives and runtime verification concepts
- Transparent about building on NIST 800-207 rather than claiming to replace it

**Weaknesses:**
- Missing citations for key claims:
  - "RAG poisoning has been demonstrated in research [Zhong et al., 2023; Zou et al., 2023]"—these citations are not in the references section
  - Prompt injection detection methods—no citation to academic work on adversarial NLP classifiers
  - Distributional anomaly detection—GMM is standard, but application to LLM agents should cite prior work if it exists
- The related work section (§11) is positioned late and feels like an afterthought
- No engagement with formal methods literature on runtime enforcement monitors (e.g., Schneider's security automata, Basin's policy compliance work)

**Assessment:** Good coverage of industry frameworks, but academic rigor is uneven. For an industry track paper, this is acceptable, but the missing citations for empirical claims (RAG poisoning, adversarial tests) need to be added.

---

### 3. THREAT MODEL: 9/10

**Strengths:**
- **Exceptional structure**: Five adversary classes with explicit capability matrices (Table in §2.2) is the strongest part of this paper
- Clear trust assumptions (A1-A4) with honest acknowledgment of what breaks if assumptions fail
- Combined attack scenarios (§2.3) show sophisticated thinking about multi-stage attacks
- The "Enforcement-Plane Compromiser" (Class 5) is critical and often ignored in ZTA papers—this paper addresses it head-on

**Weaknesses:**
- Assumption A3 (Trusted Key Store) is doing a *lot* of work. The note about Kubernetes sealed-secrets is good, but the paper should be clearer that KMS compromise is a single point of failure
- The capability matrix uses checkmarks/crosses without quantifying adversary strength (e.g., "Partial" for Escalator's memory write—what exactly can they write?)
- Missing: physical access adversary (data center breach, hardware tampering). Acknowledged in §10.7 but should be in the threat model as out-of-scope

**Assessment:** This is among the best-structured threat models I've seen in applied security papers. The capability matrices are a template other work should follow. Minor deduction for not quantifying "Partial" capabilities.

---

### 4. FORMALIZATION: 6/10

**Strengths:**
- Definitions 1-4 (§3.2) are precise and use standard cryptographic notation
- TypeScript schemas throughout provide machine-readable formalization
- Clear distinction between "tamper-evidence" and "correctness" (§10.3)
- JCS canonicalization (RFC 8785) for deterministic signing is the right choice and properly specified

**Weaknesses:**
- **Security arguments are informal**: §3.3 provides intuition, not proofs. "By A1, an adversary who does not possess the agent's private key cannot forge a valid signature"—this is just restating A1, not proving anything
- Definition 3 (Policy Enforcement Completeness) is underspecified: "every action in S passes through at least one PEP"—but how is S defined? The action coverage matrix (§4.0) helps, but it should be part of the formal definition
- No formal specification of the PDP evaluation semantics (what does it mean for a policy to "deny"? Is it monotonic? Compositional?)
- The "Containment Bound" (Definition 4) is useful but the formula assumes synchronous enforcement—the caveat about async operations undermines the bound

**Assessment:** This paper is *specification-heavy* but *proof-light*. For an industry track, detailed specifications are more valuable than formal proofs, but the "security arguments" should either be actual proofs or clearly labeled as informal reasoning. The formalization is good enough for implementation, not for publication in a theory venue.

---

### 5. EVALUATION: 7/10

**Strengths:**
- **Running code**: 12 deployed services, all open source (MIT), with repository links—this is exemplary for reproducibility
- Concrete performance numbers (14ms p99 for prompt injection detection, 3ms for PoE signing)
- Adversarial test results (§7.2) with *transparent disclosure of bypasses*—this is rare and commendable
- 25/25 contract validation tests passing (though we can't verify this without running the code)

**Weaknesses:**
- **No comparison baseline**: How does VERA's overhead compare to no enforcement? To alternative designs?
- **Evaluation scale is small**: "tested with individual agent deployments and small multi-agent configurations" (§10.1)—what is "small"? 2 agents? 10? 100?
- **Missing details on adversarial test methodology**: Who designed the 41 vectors? Are they public? How do they compare to other agent pentesting frameworks?
- **No user study or operational deployment data**: How hard is it to write OPA policies for agents? What's the false positive rate in production?
- The "12 deployed services" claim is repeated but not substantiated—are these internal deployments? Customer deployments? How long have they been running?

**Assessment:** The empirical evaluation is stronger than most industry papers (running code + open source is a high bar), but the lack of baselines and operational data is a significant gap. The adversarial test transparency is excellent.

---

### 6. WRITING QUALITY: 8/10

**Strengths:**
- **Crisp, direct prose**: "Trust without proof is aspiration. VERA makes it architecture." This is good technical writing
- Excellent use of tables and structured comparisons (capability matrices, framework comparison, OWASP mapping)
- Mermaid diagrams are clear and add value
- TypeScript schemas are readable and precise
- Honest tone: "We do not claim VERA solves the alignment problem. We claim it makes misalignment detectable and containable." (§10.4)

**Weaknesses:**
- **Tone occasionally strays into marketing**: "AI agents take real actions with real data at machine speed. When they go wrong, the blast radius is not a misclassified image."—this is punchy but feels like a blog post, not a research paper
- The abstract is 250+ words and reads like a feature list rather than a scientific summary
- Some repetition: the "enforcement gap" is stated multiple times in §1 without adding new information
- The "About the Authors" section (§13) is inappropriate for an academic paper—this belongs in a GitHub README

**Assessment:** The writing is clear and well-organized, but the tone needs calibration for IEEE S&P. The technical content is strong; the framing sometimes feels like a product pitch. This is fixable with light editing.

---

### 7. LIMITATIONS: 9/10

**Strengths:**
- **Exceptional honesty**: §10 is one of the most thorough limitations sections I've seen in an industry paper
- Each limitation is specific and actionable (not vague "future work" handwaving)
- The distinction between "PoE integrity" and "execution correctness" (§10.3) is critical and clearly stated
- Transparent about scale limitations (§10.1) and multi-agent gaps (§10.5)
- Acknowledges quantum threat to Ed25519 (§10.6)

**Weaknesses:**
- Could add: social/organizational limitations (requires security expertise to write OPA policies, requires organizational buy-in for enforcement-first culture)
- Could add: economic limitations (KMS costs, anchor costs, operational overhead)
- The physical actuator disclaimer (§10.7) is good but feels like a CYA rather than a real limitation

**Assessment:** This is a model limitations section. No deductions.

---

## OVERALL SCORE: 7.5/10

**VERDICT: Accept**

This is a strong industry track paper that makes a solid contribution to an important problem (AI agent security). The threat model is excellent, the architecture is well-specified, and the running code demonstrates feasibility. The evaluation could be stronger (baselines, scale, operational data), and the formalization is more specification than proof, but these are acceptable tradeoffs for an industry paper.

The writing occasionally strays into marketing tone, but the technical substance is sound. The limitations section is exemplary.

---

## GREENLIGHT DECISION

**GREENLIGHT: YES**

This paper is publication-ready for IEEE S&P Industry Track with minor revisions.

---

## TOP 3 SPECIFIC IMPROVEMENTS NEEDED

### 1. **Add Missing Citations and Strengthen Related Work (REQUIRED)**

**Issue:** Several empirical claims lack citations:
- "RAG poisoning has been demonstrated in research [Zhong et al., 2023; Zou et al., 2023]"—these papers are not in the bibliography
- Prompt injection detection methods—cite academic work on adversarial NLP classifiers (e.g., Wallace et al. 2019 on universal adversarial triggers, Perez & Ribeiro 2022 on prompt injection)
- Distributional anomaly detection for LLMs—if prior work exists, cite it; if not, state this is novel

**Action:**
- Add a proper Related Work section early in the paper (after Introduction, before Threat Model)
- Include citations for all empirical claims
- Engage with formal methods literature on runtime enforcement (Schneider, Basin, Ligatti)

**Why this matters:** Academic rigor requires proper attribution. The paper's contribution is strong enough that it doesn't need to overstate novelty by omitting prior work.

---

### 2. **Provide Evaluation Baselines and Operational Data (REQUIRED)**

**Issue:** The evaluation shows VERA works, but not *how well* compared to alternatives or no enforcement.

**Action:**
- Add a comparison: VERA overhead vs. no enforcement vs. a simpler baseline (e.g., JWT-only identity + structured logging)
- Quantify "small multi-agent configurations"—how many agents? What workload?
- Provide operational data: How many organizations are using these 12 services? How long have they been deployed? What's the false positive rate in production?
- Make the adversarial test suite (41 vectors) public or cite an existing public suite

**Why this matters:** Without baselines, we can't assess whether VERA's overhead (14-22ms) is acceptable or whether the 90.2% block rate is good. "It works" is not enough for a security paper.

---

### 3. **Calibrate Tone for Academic Venue (RECOMMENDED)**

**Issue:** The writing is crisp and clear, but the tone occasionally feels like a product announcement rather than a research paper.

**Action:**
- Revise the abstract to focus on contributions and results, not feature lists
- Tone down marketing language ("blast radius," "running code over specification prose")—keep the substance, soften the pitch
- Remove or move the "About the Authors" section (inappropriate for IEEE S&P)
- Reframe §1.1 ("Three Structural Gaps") as research questions rather than product positioning

**Why this matters:** IEEE S&P reviewers expect scholarly tone. The technical content is strong enough to stand without the salesmanship. Let the architecture speak for itself.

---

## ADDITIONAL OBSERVATIONS

### What This Paper Does Well
1. **Threat modeling**: The capability matrices are a template for the field
2. **Transparency**: Honest limitations, disclosed bypasses, clear assumptions
3. **Reproducibility**: Open source code, typed schemas, concrete specifications
4. **Practical value**: Addresses a real gap (enforcement layer for AI agents)

### What Could Be Stronger
1. **Formal rigor**: Security arguments are informal; proofs would strengthen claims
2. **Evaluation depth**: Needs baselines, scale tests, and operational data
3. **Academic framing**: Tone needs calibration for scholarly venue

### Suitability for IEEE S&P Industry Track
This paper is an **excellent fit** for the industry track. It:
- Solves a real-world problem (AI agent security)
- Provides concrete implementations (12 services)
- Offers actionable guidance (schemas, policies, deployment patterns)
- Demonstrates feasibility (performance numbers, adversarial tests)

It is **not** a fit for the main research track (insufficient formal rigor, no novel algorithms), but that's not the goal. For industry track, this is strong work.

---

## FINAL RECOMMENDATION

**Accept with minor revisions.** This paper makes a valuable contribution to AI agent security with a well-structured threat model, clear architectural specifications, and running code. The required revisions (citations, baselines, tone) are straightforward and do not undermine the core contribution.

I would be comfortable seeing this paper published in IEEE S&P Industry Track and would cite it in my own work on runtime enforcement for autonomous systems.

**GREENLIGHT: YES**

---

**Reviewer Confidence:** High (5/5)  
**Expertise Match:** Runtime verification, zero trust architectures, applied cryptography

---

*Review completed February 2026. Recommendation stands pending author response to required revisions.*