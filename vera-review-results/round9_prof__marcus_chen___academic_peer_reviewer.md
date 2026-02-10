# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 117.4s
**Score:** 6/10
**Greenlight:** ❌ NO

---

# IEEE S&P Industry Track Review: VERA

**Reviewer:** Professor Marcus Chen, ETH Zurich

---

## OVERALL ASSESSMENT

This paper presents VERA, a comprehensive zero-trust reference architecture for AI agents with formal threat modeling, cryptographic enforcement mechanisms, and extensive reference implementations. The work addresses a genuine security gap in AI agent deployments and provides substantial technical depth. However, it exhibits significant structural issues that make it unsuitable for IEEE S&P in its current form.

**OVERALL SCORE: 6/10**

**VERDICT: Weak Reject**

**GREENLIGHT: NO**

---

## DETAILED SCORING

### 1. CONTRIBUTION: 7/10

**Strengths:**
- Addresses a real and timely problem: the enforcement gap between governance frameworks and runtime security for AI agents
- Provides concrete architectural patterns (PDP/PEP placement) that existing frameworks lack
- Evidence-based trust tiers are a novel contribution over calendar-based maturity models
- Tool-parameter authorization and memory/RAG governance address under-specified attack surfaces
- 12 deployed services with empirical validation demonstrate practical feasibility

**Weaknesses:**
- Core architectural elements (PDP/PEP, policy-as-code, runtime verification) are well-established in traditional Zero Trust; the novelty is primarily in *applying* these to AI agents rather than fundamental innovation
- The threat model, while comprehensive, does not introduce new adversary classes beyond standard security frameworks
- Many "novel" elements are incremental extensions (e.g., distributional baselines for non-deterministic systems are standard in anomaly detection)
- The paper conflates "comprehensive specification" with "novel contribution"—much of the value is in integration and completeness, not breakthrough ideas

**Assessment:** The contribution is solid engineering and useful specification work, but lacks the theoretical or empirical novelty expected at S&P. This is high-quality systems security work that would be better suited to a practitioner venue (USENIX LISA, IEEE Security & Privacy Magazine) or a workshop (WAISE, AISec).

---

### 2. RELATED WORK: 5/10

**Strengths:**
- Section 11 covers relevant standards (NIST 800-207, OWASP Top 10, SCITT)
- Acknowledges recent academic work (AgentGuard, Byzantine consensus, TEE platforms)
- Honest about what VERA does vs. doesn't solve relative to prior art

**Weaknesses:**
- **Critical omission:** The paper does not engage with the extensive literature on runtime verification for security policies (e.g., policy automata, security automata [Schneider, 2000], inline reference monitors [Erlingsson & Schneider, 2000])
- Missing discussion of existing agent security platforms (LangChain Security, Guardrails AI, NeMo Guardrails) and how VERA differs architecturally
- No comparison to formal methods for policy enforcement (e.g., SELinux, AppArmor, capability-based security systems)
- The comparative framework analysis (Table in §1.2) is superficial—it compares VERA's *specification completeness* against frameworks with different scopes, creating an apples-to-oranges comparison
- Related work appears at the end (§11) rather than integrated throughout, making it harder to assess incremental contributions

**Assessment:** Related work is present but insufficient. A security venue requires deeper engagement with foundational work on policy enforcement and runtime monitoring.

---

### 3. THREAT MODEL: 8/10

**Strengths:**
- Five adversary classes with explicit capability matrices are well-structured
- Trust assumptions (A1-A4) are clearly stated
- Combined attack scenarios (Table in §2.3) demonstrate realistic multi-adversary threats
- Honest about residual risks (e.g., "colluding approvers," "zero-day in signed deps")
- OWASP Top 10 mapping (§8) provides practical validation

**Weaknesses:**
- **Assumption A3 (Trusted Key Store) is unrealistically strong:** The assumption that "agent runtime has no network path or IAM permissions to the signing service" is difficult to enforce in practice. If the agent and PEP run in the same Kubernetes cluster, network isolation requires correct CNI configuration, which is operational, not cryptographic. A compromised agent with container escape capabilities *can* reach the KMS. The paper acknowledges this under Adversary Class 5 but doesn't quantify the attack surface.
- **Assumption A4 (Anchor Integrity) is under-specified:** "At least one anchor backend is honest" is vague. What happens if the organization uses only Solana and the validator set is compromised? The paper should specify *how many* independent anchors are required for different trust tiers.
- The threat model does not address **covert channels** (e.g., timing side-channels in policy evaluation, model output steering via latency manipulation). These are relevant for sophisticated adversaries.
- **Missing: formal adversary goals.** The capability matrix is excellent, but adversary *objectives* (data exfiltration volume, persistence duration, privilege level) are not quantified. This makes it hard to evaluate whether the containment bounds (Definition 4) are meaningful.

**Assessment:** Strong threat modeling with clear structure, but key assumptions need tightening for a top-tier venue.

---

### 4. FORMALIZATION: 6/10

**Strengths:**
- Four formal security properties (Definitions 1-4) with proof sketches
- Cryptographic assumptions (A1-A4) are explicit
- Schemas are typed and machine-parseable (TypeScript interfaces)
- Canonical signing format (JCS, RFC 8785) ensures reproducibility

**Weaknesses:**
- **Proof sketches are too informal for S&P.** The "game-based proof sketches" (§3.3) are essentially security arguments, not rigorous proofs. For example:
  - Proof Sketch 1 invokes EU-CMA security but doesn't model the multi-party setting (agent, PEP, tool). A full proof would require a formal game with oracle queries for each party.
  - Proof Sketch 3 (Policy Enforcement Completeness) is conditional on "constrained egress invariant holding" but provides no formal verification method for this invariant. This is a critical gap—without formal verification, completeness is an operational claim, not a proven property.
- **Definition 3 (Policy Enforcement Completeness) is under-specified.** The definition states completeness holds "with respect to the controlled action surface S" but does not provide a formal method to *verify* that S covers all relevant actions. The paper acknowledges actions "outside S" (container escapes, raw sockets) are detectable but doesn't integrate this into the formal property.
- **No formal semantics for policy language.** The OPA/Rego examples are illustrative but not formalized. A rigorous treatment would define policy semantics (e.g., as a state machine or temporal logic formula) and prove that PEP enforcement preserves policy properties.
- **Crypto agility (A1') introduces complexity not addressed in proofs.** Supporting Ed25519, ECDSA, and ML-DSA requires proving security under algorithm negotiation. The paper doesn't address downgrade attacks or algorithm confusion.

**Assessment:** Definitions are present but lack the rigor expected at S&P. This would be acceptable at a systems venue but not a top-tier security conference.

---

### 5. EVALUATION: 7/10

**Strengths:**
- 12 deployed services with empirical latency measurements
- Adversarial test results (§7.2) with transparent disclosure of bypassed vectors
- Performance metrics (14ms input firewall, 3ms PoE signing) are realistic and reproducible
- 25/25 contract validation tests provide confidence in implementation correctness
- Honest about limitations (§10) including untested scalability claims

**Weaknesses:**
- **No large-scale evaluation.** The paper claims "validated in controlled environments" but provides no details on environment size, workload characteristics, or failure injection testing. The scalability projections (Table in §10.9) are analytical, not empirical.
- **Missing: comparative evaluation.** The paper does not compare VERA's performance or security properties against existing agent security platforms (LangChain, Guardrails AI). This makes it impossible to assess whether VERA's overhead (14-22ms) is competitive.
- **Adversarial test suite is not standardized.** The 41 vectors in agent-pentest are described but not publicly available (the paper references an npm package but doesn't provide a stable versioned link). Reproducibility requires the exact test suite.
- **No user study or operational deployment data.** The paper claims services are "deployed" but provides no data on real-world usage, incident response effectiveness, or operator experience. For an industry track paper, this is a significant gap.
- **Receipt verification is not empirically validated.** Section 4.2.1a introduces Tool Execution Receipts as a critical mechanism for end-to-end verifiability, but §7 provides no empirical data on receipt generation latency, verification throughput, or nonce collision rates.

**Assessment:** Evaluation demonstrates feasibility but lacks depth for S&P. The empirical results are preliminary; a full evaluation would require multi-month deployments with incident data.

---

### 6. WRITING QUALITY: 5/10

**Strengths:**
- Clear problem statement (§1) with motivating examples
- Extensive use of tables and schemas improves readability
- Honest limitations section (§10) is commendable
- Technical depth is appropriate for the audience

**Weaknesses:**
- **Inappropriate tone for S&P.** Phrases like "Trust without proof is aspiration. VERA makes it architecture" (conclusion) and "The gap is enforcement" (abstract) read as marketing copy, not academic prose. S&P papers should be dispassionate and evidence-focused.
- **Excessive length.** At ~13,000 words (estimated), this exceeds typical S&P page limits (12-14 pages). Sections 1.1-1.2 could be condensed; the 12-service implementation list (§7) could move to an appendix.
- **Redundancy.** The paper repeats the "enforcement gap" thesis in §1, §1.1, §1.2, and the conclusion. The comparative framework table appears in two forms (§1.2 and implicitly in §8).
- **Inconsistent formalism.** The paper oscillates between formal definitions (§3) and informal architectural descriptions (§4). A consistent level of rigor would improve clarity.
- **Missing: threat model placement.** Section 2 (Threat Model) should appear *before* Section 1.2 (Comparative Framework Analysis) to establish adversary assumptions before comparing frameworks.
- **Figures are low-quality.** The Mermaid diagrams (§1, §4.0) are functional but not publication-ready. IEEE S&P expects vector graphics with clear labels.

**Assessment:** Writing is competent but needs significant revision for venue appropriateness. The tone must shift from "product pitch" to "research contribution."

---

### 7. LIMITATIONS: 9/10

**Strengths:**
- Section 10 is exemplary: honest, specific, and actionable
- Acknowledges untested scalability, performance overhead, and execution correctness gaps
- Transparent about what PoE guarantees (non-repudiation) vs. doesn't (correctness)
- Discusses post-quantum migration path (§10.6) with concrete timeline
- Deployment cost table (§10.8) is rare in academic papers and highly valuable

**Weaknesses:**
- **Missing: social/organizational limitations.** The paper assumes organizations have the expertise to author OPA policies, deploy Kubernetes sidecars, and operate KMS infrastructure. Many organizations lack this capability. The paper should discuss adoption barriers.
- **Missing: adversarial ML limitations.** The paper acknowledges distributional baselines have limitations (§10.4) but doesn't discuss fundamental challenges in detecting adversarial behavior in non-deterministic systems. Recent work shows adaptive adversaries can evade anomaly detectors—VERA should cite this.

**Assessment:** Limitations section is a model for honest academic writing. Minor gaps prevent a perfect score.

---

## TOP 3 SPECIFIC IMPROVEMENTS NEEDED

### 1. **Tighten Formal Properties and Provide Rigorous Proofs**

**Issue:** Definitions 1-4 and proof sketches (§3) are insufficiently rigorous for S&P.

**Required changes:**
- **Definition 3 (Completeness):** Specify a formal method to verify that the controlled action surface S covers all relevant actions. Options: (a) formal verification of network policies (e.g., using Datalog for firewall rules), (b) runtime attestation that all egress passes through monitored paths, or (c) probabilistic completeness with bounded error.
- **Proof Sketch 3:** Either provide a full formal proof (using a verification framework like Coq or Isabelle) or downgrade the claim from "completeness" to "completeness under operational assumptions" with explicit verification checklist.
- **Crypto agility (A1'):** Add a proof sketch for algorithm negotiation security. Show that downgrade attacks (forcing Ed25519 when ML-DSA is available) are detectable.
- **Multi-party setting:** Proof Sketch 1 should model the agent-PEP-tool interaction as a multi-party protocol and prove non-repudiation under adversarial corruption of one party.

**Why this matters:** S&P reviewers expect formal rigor. The current proofs would not pass muster at a crypto or formal methods venue; they need to be tightened or the claims need to be softened.

---

### 2. **Add Comparative Evaluation Against Existing Platforms**

**Issue:** The paper evaluates VERA in isolation. Without comparison to LangChain Security, Guardrails AI, or NeMo Guardrails, it's impossible to assess whether VERA's approach is superior.

**Required changes:**
- **Benchmark setup:** Deploy the same agent application (e.g., a customer service chatbot with tool access) on VERA and two competing platforms.
- **Metrics to compare:**
  - Latency overhead (p50, p99) for policy evaluation
  - Adversarial robustness (use the same 41-vector test suite)
  - Operational complexity (lines of policy code, deployment steps)
  - Verifiability (can a third party audit enforcement?)
- **Expected outcome:** Show where VERA excels (e.g., cryptographic verifiability) and where it underperforms (e.g., latency vs. in-process guardrails).

**Why this matters:** Industry track papers must demonstrate practical value. Comparative evaluation is the standard way to do this.

---

### 3. **Revise Tone and Structure for Academic Venue**

**Issue:** The paper reads as a technical specification or product whitepaper, not a research contribution.

**Required changes:**
- **Abstract:** Remove "Trust without proof is aspiration" and similar slogans. Replace with: "We present VERA, a zero-trust architecture for AI agents that provides [X, Y, Z properties] through [A, B, C mechanisms]. Empirical evaluation shows [key result]."
- **Introduction (§1):** Cut §1.1-§1.2 by 40%. Move the comparative framework table to related work. Focus on the *research question*: "How can we design a verifiable enforcement architecture for non-deterministic AI agents?"
- **Related work:** Move to §2 (before threat model) and integrate comparisons throughout the paper. For each VERA component, cite the foundational work it builds on.
- **Conclusion:** Replace the current conclusion with a summary of contributions, limitations, and future work. Remove promotional language.
- **Figures:** Replace Mermaid diagrams with publication-quality vector graphics (Inkscape, draw.io, or TikZ).

**Why this matters:** S&P has high standards for writing. The current tone will trigger rejection on stylistic grounds alone.

---

## ADDITIONAL COMMENTS

### Strengths Worth Preserving
- The evidence-based maturity runtime (§5) is genuinely novel and should be highlighted as a key contribution
- The Tool Execution Receipt mechanism (§4.2.1a) closes a real gap in verifiable enforcement
- The honest limitations section (§10) is a model for academic integrity
- The deployment cost analysis (§10.8) is valuable for practitioners

### Critical Gaps
- **No discussion of privacy-preserving enforcement.** If PoE records contain action parameters, they may leak sensitive data. The paper mentions minimization (§4.2.1b) but doesn't discuss techniques like differential privacy or secure multi-party computation for policy evaluation.
- **No game-theoretic analysis.** The evidence-based promotion system is gameable (the paper acknowledges this). A formal game-theoretic model would help quantify the cost of gaming vs. the cost of compliance.
- **No discussion of regulatory compliance verification.** The compliance mapping (§9) is superficial. A rigorous treatment would show *how* an auditor verifies VERA's claims (e.g., via PoE chain inspection).

### Venue Recommendation
This work is not ready for IEEE S&P but has significant value for the security community. I recommend:

**Option 1 (preferred):** Resubmit to **USENIX Security** or **ACM CCS** after addressing the three major improvements above. These venues accept high-quality systems security work with practical impact.

**Option 2:** Submit to **IEEE Security & Privacy Magazine** (practitioner-focused) or **USENIX LISA** (systems administration). The comprehensive specification and deployment guidance would be highly valued in these venues.

**Option 3:** Submit to a workshop (**WAISE @ IEEE S&P**, **AISec @ ACM CCS**) to get community feedback, then revise for a full conference submission.

---

## FINAL VERDICT

**OVERALL SCORE: 6/10**

**VERDICT: Weak Reject**

**GREENLIGHT: NO**

This is solid, useful work that addresses a real problem with practical solutions. However, it lacks the theoretical rigor, empirical depth, and comparative evaluation required for IEEE S&P. The writing tone is inappropriate for an academic venue, and key formal properties need strengthening.

With substantial revision—particularly tightening the formal proofs, adding comparative evaluation, and adjusting the tone—this could become a strong contribution to USENIX Security or ACM CCS. I encourage the authors to revise and resubmit to a more appropriate venue.

**Recommendation to authors:** Focus on the novel contributions (evidence-based trust, tool receipts, memory governance) and position VERA as a *reference implementation* of zero-trust principles for AI agents, not as a fundamentally new security paradigm. The value is in integration and completeness, which is legitimate—but requires different framing.

---

**Reviewer confidence: High**

I am familiar with zero-trust architectures, runtime verification, and AI security. I have reviewed for IEEE S&P, USENIX Security, and ACM CCS.