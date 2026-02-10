# VERA Paper — Expert Review Round 5

**Date:** 2026-02-10T10:11:16.815Z
**Average Score:** 4.2/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 0/10
**Greenlight:** ❌ NO
**Response time:** 101.0s

---

## Publication-Quality Review (Round 5) — VERA: *Verifiable Enforcement for Runtime Agents*

### Executive assessment
This is one of the stronger drafts I’ve seen attempting to “operationalize ZTA for agents” with **explicit PDP/PEP placement**, **typed interfaces**, and a **runtime evidence model**. The paper’s biggest gap is that its *verifiability story* is not yet end-to-end: PoE as specified provides strong **tamper-evident logging**, but only a partial answer to “prove enforcement occurred” unless you also formalize (and ideally cryptographically bind) **tool-side receipts**, **PEP integrity**, and **decision provenance**. The threat model also omits a first-class adversary for **enforcement-plane compromise / KMS signing abuse**, which is the single highest-value target in this architecture.

If you tighten those areas, this is publishable and genuinely useful.

---

## Scores (1–10)

1) **ARCHITECTURAL COMPLETENESS (PDP/PEP placement, policy loops): 7/10**  
Strong PEP taxonomy + two deployment patterns; good baseline “deny direct egress.” Missing: a precise continuous evaluation/control loop model (telemetry → PDP policy state → obligations), and a more explicit story for enforcement-plane compromise and bypass-proofing.

2) **THREAT MODEL RIGOR: 7/10**  
The four adversary classes are clear and practical, and the capability matrix is helpful. Not fully rigorous because the model largely *assumes away* the most critical failure modes (PDP/PEP/Proof Engine/KMS abuse) and doesn’t formally structure goals/resources/attack surfaces (e.g., STRIDE/LINDDUN style) or provide completeness arguments.

3) **NOVELTY: 8/10**  
The combination of **agent action boundary enforcement**, **typed policy I/O**, and **evidence-based maturity/promotion** is a real step beyond “apply NIST 800-207 to agents.” “PoE” itself is not new, but applying it as a first-class enforcement/audit primitive for agent loops is novel enough for publication.

4) **FORMAL DEFINITIONS (schemas/interfaces/controls precise enough): 7/10**  
You provide concrete TypeScript interfaces, canonicalization (JCS), and policy I/O schemas—excellent. However, several definitions blur *who* is attesting/signing (agent vs enforcement plane), and several critical objects lack normative constraints (e.g., tool receipts, decision provenance, log inclusion proofs).

5) **PRACTICAL VALUE: 8/10**  
Engineering teams will get real value from: action coverage matrix, PEP placements, PoE format, bundle distribution patterns, tiering model, and “fail closed vs fail open” guidance. With a few clarifications and hardening requirements, this could be used as an implementation blueprint.

### OVERALL SCORE: **7/10**

---

## What’s strong (publication-worthy elements)

- **Clear action boundary model** (“externally observable side effect or crosses a trust boundary”) plus mapping of action types → PEPs → bypass detection methods.
- **Good ZTA alignment**: PDP/PEP separation, explicit fail behaviors, segmentation via tool-parameter constraints, and strong microsegmentation baseline.
- **Typed policy evaluation contract**: The `PolicyEvaluationRequest/Decision/Obligations` schemas are the right direction and are implementable.
- **Honest limitations section**: Especially 10.3 (PoE ≠ execution correctness) and multi-agent limitations.
- **Operational maturity model**: Evidence portfolios and promotion gates are materially more security-relevant than calendar time.

---

## Major issues to address (blocking for “verifiable enforcement” claims)

### 1) PoE currently proves “signed logging,” not “enforcement occurred”
You repeatedly position VERA as making governance *verifiable*, but the current PoE definition is primarily a **tamper-evident audit chain** under the assumption that the enforcement plane is trusted.

Key gaps:
- **Who signs PoE?**  
  You call them “agent signing keys,” but A3 says signing requests originate only from PEP/Proof Engine processes and the agent runtime cannot call signing services. In that design, the *enforcement plane* is effectively the signer. That’s fine, but then the property is not “agent non-repudiation”; it’s closer to “enforcement-plane attestation that an action was authorized/logged.”
- **No cryptographic binding between PDP decision → PEP enforcement → tool execution**  
  For verifiable enforcement you typically need at least one of:
  - Tool-side **signed receipts** (tool signs what it executed, including the authorization context), or
  - A **two-phase commit** pattern (PEP issues a nonce-bound authorization token; tool must return it; PoE binds both), or
  - A trusted execution boundary (TEE) that can attest the enforcement path.
- **Bypass detection relies on logs that may not be trustworthy**  
  “Compare tool-side invocation logs vs PoE records” only works if those tool logs are integrity-protected and identity-bound. Otherwise, a compromised component can erase or forge the comparison source.

**What to change (concretely):**
- Rename/reframe properties: e.g., “Action Authorization Non-Repudiation” or “PEP-Attested Action Record.”
- Add a **Tool Execution Receipt** object:
  - Tool signs `{actionId, toolId, canonical(parameters), timestamp, receiptNonce, resultHash}` with a tool key anchored in org PKI/SPIFFE.
  - PoE includes the receipt (or its hash + inclusion proof).
- Include a **Decision Provenance** field:
  - `pdpDecisionId`, `policyBundleHash`, `regoModuleHash` (or bundle digest), `inputsHash`, `obligationsApplied`.
  - This enables auditing *which* policy caused the allow/deny/escalate.

### 2) Enforcement plane/KMS misuse is the dominant threat, but it’s mostly assumed away
You explicitly assume: “Policy engine is not compromised (if compromised, all enforcement is void).” That is true but too absolute for a paper claiming verifiable enforcement. A real-world reviewer will ask: what happens if:
- A cluster admin can deploy a modified PEP image that signs “allowed” PoEs?
- A cloud IAM principal can call KMS sign APIs outside the PEP?
- Bundle distribution is poisoned to weaken policy while still looking “signed”?
- Telemetry plane is used to manipulate PDP state/tiers?

You have good hardening bullets (cosign verification, separation of duties), but they are not integrated into the threat model and security properties.

**What to change:**
- Add a **5th adversary class** (or elevate to first-class): *Enforcement-Plane Compromiser / Key Misuser*.  
  Model capabilities: deploy modified PEP/PDP, call KMS signing, tamper with bundle distribution, forge PoE, suppress anchoring.
- Add explicit mitigations with normative requirements:
  - KMS condition keys / SPIFFE ID-based authorization on `Sign`
  - Quorum-based signing for high-tier agents (e.g., two-man rule for “T4 allow”)
  - Witnessing: independent verifier that checks PoE/receipt consistency and anchors alerts externally

### 3) “Policy enforcement completeness” as defined is not actually a checkable property yet
Definition 3 says completeness is detectable via PoE chain analysis by finding actions at tool-level without PEP evaluation records. But you don’t specify:
- What constitutes a “tool-level observation” (is it trusted? signed? centrally collected?).
- How you avoid false positives in distributed systems (retries, partial failures, async queues).
- How you treat *non-tool* side effects (e.g., direct DNS, raw sockets, filesystem writes) when egress is denied but container escapes or host networking exist.

**What to change:**
- Make “completeness” conditional: “complete with respect to the *controlled action surface* S where all calls are mediated by PEPs and independently observed by signed receipts / constrained network paths.”
- Provide a minimal, implementable **Completeness Validation Procedure**:
  - Required telemetry sources
  - Required cryptographic properties (signatures/inclusion proofs)
  - Matching rules (correlation IDs, nonces, replay protection)

---

## Additional technical corrections / clarifications (important but not necessarily blocking)

### A) Terminology inconsistency: VERA acronym expansion
You use both **“Verifiable Enforcement”** and **“Verified Enforcement”**. Pick one and keep it consistent across title/abstract/Section 1.

### B) Non-repudiation claim is overstated given A3
Definition 1 concludes “agent cannot deny having performed `a`.” Under A3, the agent runtime cannot even access the key, so strictly speaking you are proving that the **authorized signing component** (PEP/Proof Engine) signed a record about `a`. That’s still valuable, but it’s not “agent performed.”

### C) Hashes of sensitive outputs can still be sensitive
Even if you redact before hashing, hashes can leak information via dictionary attacks for low-entropy fields (account numbers with known formats, small enumerations, etc.). Consider:
- HMAC with a verifier-held key (prevents third-party guessing), or
- Salted hashes with salt stored in the trusted plane, or
- Hash only over a normalized “receipt” subset, not raw content projections.

### D) SWDB anomaly detection is under-specified for reproducibility
You specify GMM + BIC + thresholds, but the core is the **feature definition** and **normalization**. For implementers, “parameter value distributions” is too loose. Add:
- A normative feature list (at least for the reference implementation)
- How you encode categorical parameters
- How you handle heavy-tailed metrics
- How you prevent attacker-induced baseline poisoning (you mention drift but not hard gates)

### E) DID:web + JWT-VC integration details need tightening
This can work, but you should state:
- How DID documents are hosted/secured (TLS, HSTS, domain control)
- How revocation is represented (status list / status endpoint semantics)
- Whether JWT-VC is W3C VC Data Model compliant in your encoding profile

### F) “EU AI Act does not explicitly address agentic systems” can mislead
It’s fair to say “does not explicitly use the term agentic,” but the Act regulates **AI systems** by risk category. A reviewer may interpret your statement as “Act does not apply,” which would be wrong. I’d rephrase to:  
> “The Act is not written with agentic runtime autonomy as a first-class concept; applicability depends on the AI system’s classification and use case.”

### G) Anchor backend latency/guarantees
Numbers like “Solana ~400ms” and “Rekor ~1s” are highly workload-dependent. Consider either:
- Present them as *observed in our test environment*, or
- Remove hard numbers and provide ranges + conditions.

---

## TOP 3 specific improvements needed

1) **Make enforcement verifiable end-to-end:** add tool execution receipts (signed), bind PDP decision → PEP enforcement → tool receipt into PoE, and define a verification procedure (what a third party checks, from what artifacts).

2) **Extend the threat model to include enforcement-plane & signing-service compromise:** define an explicit adversary class, capabilities, and mitigations (KMS policy constraints, quorum signing, independent witnesses, bundle signing/verification chain).

3) **Tighten formalism and terminology:** resolve “agent vs enforcement signer” ambiguity, refine the “non-repudiation” claim, and make “policy enforcement completeness” conditional and testable with specified trusted observations.

---

## Factual errors, contradictions, or misleading claims (flagged)

- **Contradiction/ambiguity:** “agent signing keys” vs A3 (“signing requests MUST originate only from PEP/Proof Engine … agent process has no network path”). This undermines Definition 1’s conclusion about the agent itself. Clarify whose key it is (agent identity key vs enforcement attestation key) and who is authorized to use it.
- **Potentially misleading phrasing:** EU AI Act statement as noted above—reword to avoid implying non-applicability.
- **“Proof that enforcement actually occurred” is not yet supported** by the current PoE spec without additional receipts/attestations. The paper sometimes implies stronger guarantees than it currently defines.

(I did not see blatant cryptographic falsehoods; your use of JCS (RFC 8785), EU-CMA framing, and hash-chain arguments are directionally correct.)

---

## Publication recommendation
This is close, but the current draft still has a gap between its central claim (“verifiable runtime enforcement”) and what is *formally guaranteed* by the specified mechanisms. With the above adjustments—especially signed tool receipts and a fuller threat model around enforcement-plane compromise—I would be comfortable approving it.

**GREENLIGHT: NO** (recommend “revise and resubmit” with the three improvements above).

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 128.9s

---

# IEEE S&P Industry Track Review: VERA

**Reviewer:** Professor Marcus Chen, ETH Zurich

---

## EXECUTIVE SUMMARY

This paper presents VERA, a zero trust reference architecture for AI agents with formal threat modeling, cryptographic proof of execution, and a deployed implementation across 12 open-source services. The work addresses a genuine gap in operationalizing AI agent security frameworks through enforceable runtime controls.

**Strengths:** Rigorous threat model with explicit adversary classes, concrete PDP/PEP architecture with typed schemas, honest limitation disclosure, and verifiable implementation claims backed by open-source code.

**Weaknesses:** Overclaims on "formal" properties (proof arguments are informal), limited empirical evaluation scope, architectural complexity may hinder adoption, and some prose feels more appropriate for a technical blog than an academic venue.

**Overall Assessment:** This is solid engineering work with genuine practical value, but it straddles the boundary between a systems paper and an experience report. The contribution is primarily architectural rather than algorithmic or theoretical.

---

## DIMENSIONAL SCORING

### 1. CONTRIBUTION: 7/10

**Novel contributions:**
- Evidence-based maturity runtime (Section 5) is genuinely novel compared to calendar-based trust models
- Tool-parameter level authorization with typed schemas (Section 4.4) extends beyond typical RBAC
- Distributional anomaly detection for non-deterministic agents (SWDB algorithm, 4.2.3) addresses a real gap
- Pluggable anchor abstraction (4.2.2) provides practical flexibility beyond "use blockchain"

**Incremental aspects:**
- PDP/PEP architecture is standard Zero Trust applied to agents (acknowledged in Related Work)
- Ed25519 signatures and hash chains are well-established cryptographic primitives
- Proof of Execution concept exists in blockchain literature; adaptation to agents is engineering, not research

**Assessment:** The contribution is primarily **architectural integration** rather than fundamental innovation. The paper combines existing primitives (ZTA, cryptographic proofs, anomaly detection) in a novel configuration for a specific domain (AI agents). This is valuable engineering work, appropriate for an industry track, but not groundbreaking research.

**Specific gap:** The paper claims "formal security properties" but provides informal proof sketches. A truly formal treatment would use process calculi or model checking. The arguments in Section 3.3 are sound but not rigorous by academic standards.

---

### 2. RELATED WORK: 8/10

**Strengths:**
- Comprehensive coverage of relevant frameworks (NIST 800-207, OWASP, MAESTRO, AWS, Google A2A)
- Honest differentiation via comparison table (Section 1.2)
- Acknowledges building on existing work rather than claiming to replace it
- Cites appropriate cryptographic foundations (Bernstein et al. for Ed25519, NIST FIPS)

**Weaknesses:**
- Missing academic security literature on runtime monitoring (only cites Leucker & Schallhart 2009; more recent work exists)
- No comparison to academic work on AI safety/alignment beyond passing mention
- Certificate Transparency citation (RFC 6962) is mentioned but not deeply integrated
- Could cite more ML security papers on adversarial examples, poisoning attacks

**Missing references:**
- Carlini et al. on prompt injection attacks (foundational work)
- Tramèr et al. on ML supply chain security
- Barreno et al. on adversarial ML taxonomy
- Recent work on LLM jailbreaking (Zou et al. 2023 is cited for RAG poisoning but not jailbreaking)

**Assessment:** Related work is solid for a practitioner audience but could be strengthened with deeper academic grounding. The comparison table is excellent and should be a model for other industry papers.

---

### 3. THREAT MODEL: 9/10

**Strengths:**
- **Exceptional clarity:** Four adversary classes with explicit capability matrices (Table in 2.2)
- Formal trust assumptions (A1-A4) with cryptographic grounding
- Combined attack scenarios (Section 2.3) show understanding of realistic threats
- Honest about assumption violations (e.g., "if policy engine is compromised, all enforcement is void")
- OWASP Top 10 mapping (Section 8) demonstrates coverage

**Weaknesses:**
- Assumption A3 (Trusted Key Store) is strong and may not hold in all cloud environments. The paper mentions this but could explore degraded security modes more thoroughly.
- Byzantine adversaries in multi-agent settings are acknowledged as out-of-scope (10.5) but this is a significant limitation for agent swarms
- Physical world attacks (10.7) are correctly excluded but the boundary could be clearer

**Specific strength:** The capability matrix format is excellent and should become standard practice. The explicit mapping of adversary capabilities to VERA controls is rare in industry papers.

**Minor issue:** "Manipulator" is a slightly awkward term; "External Attacker" or "Input Adversary" might be clearer. But this is a minor stylistic point.

---

### 4. FORMALIZATION: 6/10

**Strengths:**
- TypeScript schemas provide machine-readable specifications (excellent for reproducibility)
- Definitions 1-4 (Section 3.2) are clearly stated
- JCS canonicalization (RFC 8785) ensures deterministic serialization
- Pluggable anchor abstraction is well-specified (Table in 4.2.2)

**Weaknesses:**
- **"Formal" is overclaimed:** The security arguments (3.3) are informal proof sketches, not formal proofs
- No process calculus, temporal logic, or model checking
- Properties are stated in natural language with mathematical notation, not in a formal specification language
- Containment Bound (Definition 4) makes unverified assumptions about synchronous enforcement

**Specific issues:**
- Definition 2 (Chain Tamper-Evidence) says "any deletion, reordering, or insertion produces a detectable gap or hash mismatch" but doesn't formally prove this under adversarial reordering
- Definition 3 (Policy Enforcement Completeness) is a structural property, not a runtime guarantee—a compromised PEP could claim to evaluate policies without doing so

**Recommendation:** Either (1) remove "formal" from the title and abstract, or (2) provide actual formal proofs using a proof assistant (Coq, Isabelle) or model checker (TLA+, Alloy). The current level of rigor is "structured" or "precise" but not "formal" by academic standards.

**However:** For an industry track paper, the level of precision is **above average**. Most industry papers lack even these proof sketches.

---

### 5. EVALUATION: 7/10

**Strengths:**
- **Running code:** 12 deployed services, open-source, independently verifiable (Section 7)
- Concrete performance numbers with methodology (Table in 7.1)
- Adversarial testing with transparent disclosure of bypasses (Section 7.2)
- 25/25 contract validation tests passing (verifiable claim)

**Weaknesses:**
- **Limited scale:** "Individual agent deployments and small multi-agent configurations" (10.1)—no evaluation at 100+ agents
- **No comparison baseline:** Performance numbers are absolute, not relative to alternative approaches
- **Single deployment context:** All services from one organization (Berlin AI Labs)—no independent deployments reported
- **Adversarial test suite:** 41 vectors is respectable but not comprehensive; no comparison to standard benchmarks

**Missing experiments:**
- Overhead comparison: VERA-enabled agent vs. baseline agent (latency, throughput)
- Scalability limits: At what point does PDP become a bottleneck?
- False positive rates: SWDB algorithm claims FPR targets but doesn't report actual FPR in production
- Multi-tenant isolation: Claims are made but no evaluation provided

**Specific concern:** Section 7.2 reports 90.2% block rate, but the bypassed vectors are disclosed transparently. This is **excellent scientific practice** (rare in industry papers), but raises the question: what is an acceptable block rate? 90% feels low for production deployment.

**Assessment:** The evaluation demonstrates feasibility and provides reproducible performance data, but lacks depth in comparative analysis and scale testing. For an industry track, this is acceptable; for a research track, it would be insufficient.

---

### 6. WRITING QUALITY: 6/10

**Strengths:**
- Clear structure with numbered sections and subsections
- Excellent use of tables and comparison matrices
- Mermaid diagrams aid understanding (though not standard for academic papers)
- Transparent about limitations (Section 10 is exemplary)

**Weaknesses:**
- **Tone inconsistencies:** Some passages feel like marketing copy rather than academic prose
  - "Trust without proof is aspiration. VERA makes it architecture." (Conclusion)—this is a tagline, not a research conclusion
  - "The blast radius is not a misclassified image. It is exfiltrated customer data..." (Abstract)—emotionally charged language inappropriate for IEEE
  - "None define where policies are evaluated..." (Section 1)—this is a strong claim that could be stated more neutrally

**Specific passages to revise:**

1. **Abstract, first paragraph:** "When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data, unauthorized financial transactions, and cascading failures across downstream systems."
   - **Revision:** "Agent failures can result in data exfiltration, unauthorized transactions, and cascading system failures, creating security risks distinct from traditional ML classification errors."

2. **Section 1, opening table:** The comparison table is useful but the "Failure mode: Wrong click" for humans is dismissive and unprofessional.
   - **Revision:** "Failure mode: Localized error" or "Failure mode: Single-action impact"

3. **Conclusion:** "Trust without proof is aspiration. VERA makes it architecture."
   - **Revision:** "VERA provides an architectural framework for transforming governance policies into verifiable runtime enforcement."

**Formatting issues:**
- Mermaid diagrams are non-standard for IEEE; convert to standard figures
- Code blocks (TypeScript, Rego) are appropriate for an industry track but should be in appendices or supplementary material for space constraints
- Some tables are too wide and would require reformatting for IEEE two-column format

**Assessment:** The writing is clear and accessible, which is valuable for practitioners, but the tone needs adjustment for academic publication. The technical content is sound; the presentation needs polish.

---

### 7. LIMITATIONS: 10/10

**Exemplary disclosure:**
- Section 10 provides seven categories of limitations with honest assessment
- Acknowledges scalability gaps (10.1), performance overhead (10.2), and PoE integrity vs. execution correctness (10.3)
- Transparent about what VERA does NOT solve: alignment problem, Byzantine fault tolerance, physical actuators
- Compliance mapping (Section 9) explicitly states "does not automatically make an organization compliant"

**Specific strengths:**
- "PoE guarantees that an action was signed and recorded (non-repudiation + chain integrity). It does not guarantee that the action was correctly executed." (10.3)—this is a critical distinction many papers would gloss over
- "We do not claim VERA solves the alignment problem. We claim it makes misalignment detectable and containable." (10.4)—appropriate scope management
- Transparent disclosure of bypassed adversarial vectors (7.2)

**This is a model for how limitations should be presented.** Many papers bury limitations in a single paragraph; this paper dedicates an entire section and integrates limitation discussion throughout.

---

## OVERALL SCORE: 7/10

**Justification:**
- **Contribution (7):** Solid architectural integration with some novel elements (evidence-based maturity, tool-parameter authorization)
- **Related Work (8):** Comprehensive coverage with honest differentiation
- **Threat Model (9):** Exceptional clarity and rigor
- **Formalization (6):** Overclaims "formal" but provides above-average precision
- **Evaluation (7):** Demonstrates feasibility with running code but lacks scale and comparison
- **Writing (6):** Clear but tone needs adjustment for academic venue
- **Limitations (10):** Exemplary transparency

**Weighted average:** (7+8+9+6+7+6+10)/7 ≈ **7.6** → **7/10** (conservative rounding)

---

## VERDICT: **WEAK ACCEPT**

**Reasoning:**
This paper makes a solid contribution to the practitioner community by operationalizing AI agent security frameworks with concrete enforcement mechanisms and running code. The threat model is rigorous, the architecture is well-specified, and the limitations are honestly disclosed.

However, the work is primarily **engineering and integration** rather than fundamental research. The novelty lies in combining existing primitives (ZTA, cryptographic proofs, anomaly detection) for a specific domain, not in advancing the state of the art in any individual component.

For an **industry track**, this is strong work. For a **research track**, it would be a borderline reject due to limited algorithmic novelty and evaluation scope.

**Conditions for acceptance:**
1. Tone adjustment (remove marketing language, adopt neutral academic voice)
2. Clarify that "formal" means "structured" not "mechanically verified"
3. Add comparison baseline for performance evaluation
4. Convert Mermaid diagrams to standard IEEE figures

---

## TOP 3 SPECIFIC IMPROVEMENTS

### 1. **Strengthen Empirical Evaluation with Comparative Baselines**

**Current gap:** Section 7.1 provides absolute performance numbers (14ms latency, 97.3% precision) but no comparison to alternative approaches.

**Specific improvement:**
- Compare VERA-enabled agent latency vs. baseline agent (no enforcement) vs. alternative frameworks (if any)
- Benchmark PDP throughput under load (requests/sec, scalability limits)
- Report actual false positive rates in production, not just target FPR
- Include multi-tenant isolation evaluation (claimed but not tested)

**Why this matters:** Without baselines, readers cannot assess whether VERA's overhead is acceptable. "14ms median latency" is meaningless without knowing if alternatives achieve 5ms or 50ms.

**Concrete suggestion:** Add a table:
```
| Configuration | Latency (p50/p99) | Throughput | FPR |
|---------------|-------------------|------------|-----|
| Baseline (no enforcement) | 2ms / 5ms | 10k req/s | N/A |
| VERA (full enforcement) | 16ms / 27ms | 3k req/s | 1.2% |
| VERA (minimal enforcement) | 8ms / 15ms | 6k req/s | 2.8% |
```

---

### 2. **Downgrade "Formal" Claims or Provide Actual Formal Proofs**

**Current gap:** The paper claims "formal security properties" and "proof arguments" but provides informal reasoning in natural language.

**Specific improvement (Option A - Recommended):**
- Change "formal" to "structured" or "precise" throughout
- Retitle Section 3 to "Security Properties and Arguments"
- Acknowledge in limitations that proofs are informal and invite formalization

**Specific improvement (Option B - Ambitious):**
- Provide mechanized proofs in Coq, Isabelle, or TLA+ for at least one core property
- Model the PDP/PEP architecture in Alloy and check for policy bypass vulnerabilities
- Use process calculus (π-calculus or CSP) to model agent interactions and prove non-interference

**Why this matters:** "Formal" has a specific meaning in security research (machine-checked proofs, formal methods). Misusing the term undermines credibility with academic reviewers.

**Concrete suggestion:** Add to Section 3.3:
> "The security arguments presented here are informal proof sketches based on standard cryptographic assumptions. A fully formal treatment using proof assistants or model checkers would strengthen these guarantees and is left to future work. We provide these arguments to clarify the security reasoning underlying VERA's design."

---

### 3. **Adjust Tone for Academic Venue**

**Current gap:** Several passages use marketing language or emotional appeals inappropriate for IEEE S&P.

**Specific revisions:**

**Abstract:**
- **Remove:** "When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data, unauthorized financial transactions, and cascading failures across downstream systems."
- **Replace:** "AI agent failures can result in data exfiltration, unauthorized transactions, and cascading system failures, creating security risks distinct from traditional ML classification errors."

**Section 1:**
- **Remove:** "These frameworks provide useful guidance for organizations beginning their agent security journey."
- **Replace:** "These frameworks provide guidance for agent security implementation."

**Conclusion:**
- **Remove:** "Trust without proof is aspiration. VERA makes it architecture."
- **Replace:** "VERA provides an architectural framework for transforming governance policies into verifiable runtime enforcement, enabling trust through cryptographic proof rather than policy documentation alone."

**Table in Section 1 (Human vs Agent):**
- **Change:** "Failure mode: Wrong click" → "Failure mode: Localized error"
- **Change:** "Failure mode: Data exfiltration at scale" → "Failure mode: Automated large-scale impact"

**Why this matters:** IEEE S&P reviewers expect neutral, precise language. Marketing language signals "industry pitch" rather than "research contribution" and biases reviewers negatively.

**General principle:** Every sentence should pass the test: "Could this appear in a USENIX Security or IEEE S&P paper?" If not, revise.

---

## ADDITIONAL RECOMMENDATIONS

### Minor Issues to Address

1. **Assumption A3 (Trusted Key Store):** The paper mentions Kubernetes sealed-secrets don't satisfy A3 but doesn't provide deployment guidance for organizations using K8s. Add a specific recommendation (e.g., "Use HashiCorp Vault with auto-unseal via cloud KMS" or "Deploy SPIRE with hardware attestation").

2. **Multi-replica PoE chains:** Section 3.2 mentions "(agentDid, instanceId)" for multi-replica deployments but doesn't specify how cross-replica ordering is established beyond "anchor timestamps." This needs more detail—what if replicas anchor to different backends?

3. **SWDB algorithm parameters:** Section 4.2.3 specifies N=10,000 and K=5 but doesn't justify these choices. Were they empirically tuned? Are they sensitive to domain? Provide guidance.

4. **Compliance mapping:** Section 9 is admirably honest but could provide more actionable guidance. For each regulation, specify what VERA provides vs. what the organization must add.

5. **Code availability:** The paper claims "All 12 services are open source (MIT)" but the GitHub repository link is in Section 12. Move this to the abstract or introduction for verifiability.

### Positive Aspects to Preserve

1. **Transparent bypass disclosure (7.2):** This is exceptional and should be highlighted as a contribution to scientific integrity.

2. **Limitation section (10):** Model for other papers—comprehensive, honest, specific.

3. **Capability matrix (2.2):** Excellent format for threat modeling—consider submitting this as a standalone contribution to a workshop.

4. **Pluggable anchor abstraction (4.2.2):** Practical and well-specified—this addresses a real deployment concern.

---

## GREENLIGHT DECISION

### GREENLIGHT: **YES** (Conditional)

**Justification:**
This paper makes a valuable contribution to the practitioner community by providing concrete, verifiable enforcement mechanisms for AI agent security. The threat model is rigorous, the architecture is well-specified, the implementation is real and open-source, and the limitations are honestly disclosed.

**However, acceptance is conditional on addressing the following:**

1. **Mandatory revisions:**
   - Tone adjustment (remove marketing language, adopt neutral academic voice)
   - Clarify scope of "formal" (change to "structured" or provide actual formal proofs)
   - Add comparative baselines to empirical evaluation

2. **Strongly recommended:**
   - Expand Related Work with academic ML security references
   - Provide deployment guidance for Assumption A3 in Kubernetes environments
   - Justify SWDB algorithm parameters (N, K)

3. **Minor improvements:**
   - Convert Mermaid diagrams to IEEE-standard figures
   - Move code repository link to introduction
   - Add actionable compliance guidance

**Final assessment:** This is solid engineering work with genuine practical value. It belongs in the IEEE S&P industry track, not the research track. With tone adjustments and evaluation improvements, it will be a strong contribution to the practitioner community and a useful reference for organizations deploying AI agents.

The work demonstrates that rigorous security engineering is possible for AI agents, and the open-source implementation will enable empirical validation by the community. This is the kind of industry paper we need more of: concrete, verifiable, and honest about limitations.

**Recommendation to authors:** Consider submitting a companion research paper to a workshop (e.g., IEEE Workshop on Secure AI Systems) that formalizes one specific component (e.g., the SWDB anomaly detection algorithm or the evidence-based maturity model) with deeper theoretical analysis and comparative evaluation.

---

**GREENLIGHT: YES**

*Conditional on mandatory revisions. This paper will strengthen the industry track and provide value to practitioners deploying AI agents in production.*

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 29.4s

---

# Red Team Review: VERA (Verifiable Enforcement for Runtime Agents)

As Raven, principal adversarial security researcher specializing in breaking zero-trust implementations, I've dissected VERA with the eyes of an attacker. This is a polished, ambitious paper with running code, formalisms, and transparency—rare in AI security snake oil. It operationalizes Zero Trust for agents better than most frameworks (e.g., MAESTRO, OWASP), emphasizing enforcement over checklists. Strengths: Explicit PDP/PEP, PoE chains, evidence-based tiers, pluggable anchors, empirical tests (41 vectors, 90% block rate with disclosed bypasses). It's credible scaffolding for agent infra.

But brutal reality: VERA is a **reference architecture**, not a panacea. It assumes a "trusted enforcement plane" that real attackers (especially insiders/evaders) target first. PoE proves *signing happened*, not *correct execution*—a compromised agent runtime laughs at that. Maturity gaming via colluding approvers or poisoned eval datasets is feasible. Containment SLAs (<10s in-flight cancel) fail against async ops or side channels. It's strong on paper/code but brittle against nation-state or supply-chain primitives (e.g., SolarWinds-style enforcement-plane compromise). Deployers: Treat as Tier 1-2 baseline; harden enforcement plane to SLSA3+ and TEEs for T3+.

## Dimension Scores

1. **THREAT MODEL COVERAGE: 8/10**  
   Excellent structure: 4 classes (Manipulator/Insider/Escalator/Evader) with matrices covering prompt inj, RAG poisoning, escalation, evasion, OWASP Top 10. Combined scenarios realistic (e.g., poisoned RAG + injection). Assets/boundaries clear.  
   *Weaknesses:* Over-relies on "trusted enforcement plane" (PDP/PEPs/Proof Engine)—real attackers prioritize this (e.g., via CI/CD poisoning, not covered deeply). No coverage of enforcement-plane adversaries (e.g., platform admins tampering bundles). Multi-agent Byzantine faults admitted but undetailed. Physical actuators out-of-scope (fair). Covers 80-90% real vectors; misses runtime escapes.

2. **DEFENSE DEPTH: 7/10**  
   PDP/PEP patterns solid (sidecar/centralized), action coverage matrix good (tools/network/DB/RAG). PoE tamper-evident (A2-compliant chains), input firewall empirical (14ms DistilBERT), anomaly SWDB innovative for non-det. Tool-param auth granular (e.g., limit=1000).  
   *Weaknesses:* PEP bypass via runtime compromise trivial (agent spawns child proc bypassing sidecar; seccomp/eBPF mentioned but not mandated/enforced). PoE non-repudiation ≠ execution integrity (admitted; runtime can sign fakes, tools must cross-check). Anomaly evadable via mimicry/gradual drift. Latency (15-50ms KMS) kills tight loops. No TEE enforcement (SGX optional). Effective vs. script-kiddies; cracks under escalator/evader.

3. **MATURITY MODEL RESISTANCE: 6/10**  
   Evidence portfolios > calendar time: signed tests, anomaly rates, approvals. Auto-demotion triggers good (gaps/incidents). Tiers attenuate capabilities smartly.  
   *Weaknesses:* Highly gameable. Escalator/Insider forges portfolios (control eval datasets, collude on approvals—residual risk admitted). "Adversarial test grade ≥ B" from *agent-pentest* (your tool)—circular if insiders run it. No independent 3rd-party verification mandate. Rebuild full portfolio post-demotion? Attacker stalls via false positives. Better than time-based, but insiders own the keys.

4. **SUPPLY CHAIN: 8/10**  
   Thorough: SBOM+CVE gates, signed manifests (models/tools/prompts/config/RAG), SLSA2+ for enforcement artifacts. Training provenance minimal but honest. Covers typosquatting/LoRA backdoors.  
   *Weaknesses:* Shallow on *enforcement-plane* chain (PEP images cosign/SLSA2 ok, but no sigstore/Fulcio for keyless signing). Zero-days in deps (admitted). RAG doc provenance good but slow poisoning slips thresholds. Training data "minimum viable" (HF IDs)—fine-tunes from poisoned datasets evade. Strong for deps; misses model/hostile-fork risks.

5. **CONTAINMENT: 7/10**  
   Multi-stage proactive (500ms revoke → 10s cancel), multi-source signals (3+ req'd), compensating txns. Bounded loss formula realistic. Protects vs. adversarial demotion.  
   *Weaknesses:* Fails determined evader: In-flight async (queues/DB eventual-consistency) exceed 10s SLA; no cancel for all tools (e.g., email sent). Slow exfil (1B/day below rates) + side-channels (DNS/beacons) unbound. State freeze assumes append-only stores—admins/evaders unlock. Multi-agent: No swarm halt. Stops opportunists; leaks vs. APT.

6. **HONESTY: 9/10**  
   Exemplary: Limitations §10 detailed (PoE ≠ correctness, scalability/perf, non-det, multi-agent). Discloses 4/41 bypasses + mitigations. Compliance "honest assessment" (no auto-cert). Assumptions explicit (A1-A4). No hype.  
   *Weaknesses:* Underplays enforcement-plane risks (e.g., "trusted" but hardening optional for T1/T2). Aspirational "proof over policy"—PoE is partial proof.

## OVERALL security value score: 8/10
High-value reference: Running OSS (12 services, 25/25 tests), formal properties, empiricals. Fills enforcement gap credibly for T1-T3 agents. Not T4 bulletproof—needs org hardening. Beats frameworks; complements NIST/OWASP.

## GREENLIGHT: YES
Credible architecture. Deployable baseline with caveats. Not foolproof zero-trust, but verifiable progress over checklists.

## TOP 3 attack vectors the paper should address or strengthen
1. **Enforcement-plane compromise**: Mandate SLSA3+ / TEE attestation for PDP/PEP/Proof Engine images/bundles. Add adversary class for platform admins (e.g., bundle tampering, KMS misuse). Residual: Insider poisons OPA policies → all agents pwned.
2. **Runtime escape / PEP bypass**: Enforce eBPF/ seccomp profiles + runtime attestation (Falco/KubeArmor) per deployment pattern. Detect child-proc spawns, direct syscalls. Matrix covers syscall filter but not deployment-mandated.
3. **Sophisticated multi-turn/multi-agent evasion**: Extend ConvoGuard to n-turn context windows + cross-agent PoE correlation. Add BFT delegation (e.g., threshold sigs). Current 1-turn/single-agent limits exposed in tests (e.g., homoglyph/multi-turn bypasses).

## Flagged aspirational claims (vs. achievable)
- **"Proof over policy, running code over specification prose"**: PoE proves *attestation*, not execution (compromised runtime signs lies). Aspirational—achievable only in TEEs (not baseline).
- **"Formal security properties" (e.g., Non-Repudiation, Containment Bound)**: Under *strong* assumptions (A3: no key exfil *ever*; synchronous enforcement). Real KMS (AWS/GCP) have exfil histories; async ops break bounds. Argument solid but assumptions brittle.
- **"Evidence-based maturity... resistant to gaming"**: Portfolios gameable via insider control (admitted colluders). Aspirational without independent auditors/TEE-eval datasets.
- **90.2% block rate on agent-pentest**: Transparent, but self-test suite + "planned v3" mitigations = forward-looking, not current.

**Constructive roadmap**: 
- Bake enforcement hardening (SLSA3, eBPF) into "MUST" for T2+. 
- OSS a TEE PoC (Firecracker+attest). 
- Expand pentest to 100+ vectors (multi-agent focus). 
- Certify vs. real breaches (e.g., simulate Crowdstrike-style agent cascade). 

VERA advances the field—implement, but audit your enforcement plane first. 

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 6/10
**Greenlight:** ✅ YES
**Response time:** 45.7s

---

**Expert Review: VERA Paper from CISO Perspective**

**Overall Assessment:** This is a technically sophisticated, well-structured paper that addresses genuine gaps in AI agent security. It provides architectural rigor missing from most governance frameworks. However, from an enterprise CISO standpoint, it presents significant implementation challenges and some overclaims that must be tempered before board presentation.

---

### **DIMENSIONAL SCORING (1-10)**

1.  **OPERATIONALIZABILITY: 4/10**
    *   **Strengths:** Provides concrete architectural patterns (PDP/PEP), clear trust boundaries, and open-source code.
    *   **Weaknesses:** The technical depth is extreme. Implementing the full VERA stack (12 services, cryptographic proof chains, multi-backend anchoring, distributional anomaly detection) would require a specialized platform engineering team for 12-18 months. The "hardened sidecar PDP" pattern with microVM/TEE enclaves is a major lift. This is not something a typical security team can "implement"; it's a foundational infrastructure project.

2.  **COMPLIANCE HONESTY: 9/10**
    *   **Strengths:** Section 9 ("Compliance Mapping (Honest Assessment)") is exemplary. It correctly states that VERA does not equal compliance, highlights the need for legal counsel, and crucially calls out the overselling of EU AI Act compliance by others. This honesty is rare and valuable.
    *   **Weaknesses:** The mapping table is very high-level. It could more explicitly note that for SOX, the PoE chain would need to be integrated into financial transaction audit trails, and for DORA, the incident response SLAs must align with regulatory notification timelines.

3.  **COST AWARENESS: 3/10**
    *   **Strengths:** Acknowledges latency overhead (14-22ms) and mentions scaling is untested beyond small deployments.
    *   **Weaknesses:** Severely underplays the **immense** financial and human capital cost. No discussion of FTE requirements, training, ongoing maintenance of a custom cryptographic proof system, or the operational cost of managing HSM/KMS integration, blockchain anchoring fees, and the performance impact of pervasive PEP evaluations. The "12 services" imply a sprawling microservices architecture with high operational complexity.

4.  **VENDOR NEUTRALITY: 8/10**
    *   **Strengths:** Architecturally vendor-agnostic. Supports multiple KMS, anchor backends, and policy engines (OPA). The DID:web and SPIFFE integration paths are good.
    *   **Weaknesses:** The empirical results and named services (ConvoGuard, Agent Pentest) appear to be the authors' own products/tools. While open-source, this creates a *de facto* vendor lock to their specific implementation stack. A truly neutral paper would abstract these names to functional components.

5.  **REGULATORY REALISM: 7/10**
    *   **Strengths:** Excellent on the EU AI Act. Realistic about DORA incident response mapping. Understands that compliance is organizational.
    *   **Weaknesses:** Lacks depth on **SOX** implications for AI agents performing financial operations. The "Proof of Execution" is a great audit trail, but SOX requires controls over the *accuracy* and *authorization* of financial reporting, not just non-repudiation. The paper doesn't grapple with how an AI agent's non-deterministic reasoning could satisfy SOX 404. Also, "data sovereignty" for GDPR needs more than PII detection; it requires purpose limitation, data minimization, and right to erasure workflows for data in agent memory—which is barely addressed.

6.  **BOARD READINESS: 3/10**
    *   **Strengths:** The executive summary and problem statement are board-ready. The concept of "evidence-based trust over calendar time" is a compelling narrative.
    *   **Weaknesses:** The paper quickly dives into cryptographic assumptions, adversarial capability matrices, and Rego code. This is a blueprint for engineers, not a board memo. Presenting this directly would lose the audience immediately. The business case (risk reduction vs. multi-million dollar implementation cost) is not made.

7.  **PRACTICAL VALUE: 8/10**
    *   **Strengths:** High. The threat model, enforcement pillars, and maturity runtime are intellectually rigorous and address real threats (RAG poisoning, trust gaming, tool-chain attacks). The idea of PEPs for memory/RAG governance is particularly insightful. This paper would absolutely help my organization **think correctly** about securing agents.
    *   **Weaknesses:** The value is as a **design reference and thought leadership**, not as an implementation guide. We would adopt its principles and patterns, not necessarily deploy its 12-service stack.

### **OVERALL SCORE: 6/10**

The paper is a significant contribution to the field—technically sound, honest about limitations, and forward-thinking. Its practical utility for a CISO is high as a **strategic guide and architectural validator**, but low as a **deployment plan**. The gap between its concepts and enterprise-ready implementation is vast.

---

### **TOP 3 IMPROVEMENTS NEEDED (CISO Perspective)**

1.  **Provide an Enterprise Adoption Roadmap with Phased Costing:** The paper needs a "Path to Production" section that breaks implementation into phases (e.g., Phase 1: Identity + Basic PEPs for T1 agents; Phase 2: PoE + Anomaly Detection; Phase 3: Full Maturity Runtime + Cryptographic Anchoring). Each phase should outline estimated FTEs, timeline, infrastructure dependencies, and incremental risk reduction. This bridges the gap from architecture to project portfolio.

2.  **Deepen the Regulatory Integration Narrative, Especially for SOX/DORA:** Move beyond mapping tables. Include conceptual diagrams showing how the PoE chain feeds into a **SOX-controlled audit warehouse**, and how the multi-stage containment SLAs map to **DORA's incident reporting timelines**. Discuss the challenge of AI non-determinism in the context of financial control objectives. This transforms the paper from a security architecture to a compliance enabler.

3.  **Create a True Executive Summary and Business Risk Calculus:** Before Section 1, add a dedicated, non-technical section for CISOs and board members. It should articulate: "Deploying AI agents without an enforcement layer like VERA exposes the firm to uncontainable blast-radius incidents (e.g., algorithmic trading fraud, mass data exfiltration). Implementing core VERA principles mitigates top 5 agent risks, aligns with regulatory expectations, and can be staged over 18 months with an approximate budget of X." This frames the technical detail that follows as the solution to a quantified business problem.

---

### **GREENLIGHT: YES**

**Publication is recommended,** but with the strong caveat that the title and abstract should more clearly position it as a **Reference Architecture and Research Contribution** rather than a turnkey solution. The technical content is excellent and needed. The required improvements are primarily about framing and packaging for the enterprise decision-makers who control budget and risk tolerance. This paper will elevate the discourse on AI agent security.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 0/10
**Greenlight:** ❌ NO
**Response time:** 12.6s

---

## VERA Paper Review: Implementability Assessment

VERA presents a comprehensive zero-trust architecture for AI agents, emphasizing runtime enforcement via PDP/PEP patterns, cryptographic proofs (PoE), and evidence-based trust tiers. While conceptually strong and backed by detailed schemas, its implementability hinges on the claimed open-source services, which appear unavailable based on repository checks.

### Technical Depth
Schemas (e.g., `VeraAgentIdentity`, `ProofOfExecution`) are precisely defined in TypeScript with JCS canonicalization, enums, and validation rules. PDP/PEP architectures include deployment patterns (centralized OPA vs. sidecar), trust boundaries, and action coverage matrices. Formal properties (non-repudiation, tamper-evidence) have clear definitions and arguments under crypto assumptions (A1-A4). However, some elements like SWDB anomaly detection lack full pseudocode or hyperparameters beyond defaults.

**Score: 9/10**

### Tooling Alignment
References 2026-relevant tools: OPA/Rego for PDP, ONNX/DistilBERT/spaCy for input firewall, Sigstore Rekor/Solana for anchoring, SPIFFE/SVID for attestation, Kyverno/Gatekeeper for admission, SLSA for provenance. Supports cloud KMS (AWS/GCP), Ed25519/ECDSA, and A2A interoperability. Aligns with current standards like DID:web, JWT-VC, and OWASP Agentic Top 10 (Dec 2025).

**Score: 9/10**

### Code Availability
Claims 12 MIT-licensed, deployable services (e.g., Veracity Core, ConvoGuard) with git clone instructions and 25/25 tests. Lists npm deployment for agent-pentest. However, https://github.com/yogami/vera-reference-implementation does not exist (404-equivalent fetch error), and Berlin AI Labs' site shows no matching repos—only generic KI services. No linked artifacts or SLSA proofs in paper; empirical metrics unverified without code.

**Score: 4/10**

### Competing Frameworks
Superior to NIST 800-207/OWASP/MAESTRO in enforcement specifics (typed PEPs, PoE), evidence-based tiers (vs. AWS time-based scoping), and memory/RAG controls (vs. partial Google A2A). Complements LangChain (adds runtime enforcement to its tool-chaining). Gaps: Lacks LangChain's ecosystem breadth or AWS's managed scaling, but excels in verifiability where alternatives are specification-heavy.

| Dimension | VERA | AWS Scoping | Google A2A | LangChain |
|-----------|------|-------------|------------|-----------|
| PDP/PEP Detail | Typed schemas, patterns | High-level | SPIFFE-focused | None (dev tools) |
| Proof System | PoE chains | Logging | Partial | Optional |
| Maturity Model | Evidence-based | Time-based | Capability-based | None |
| Open Source | Claimed (unfound) | Partial | Protocol only | Extensive |

**Score: 8/10**

### Scalability
Acknowledges limits (tested small-scale; needs sharding for 1000+ agents). Addresses via pluggable anchors (<5ms local), low-latency sidecars (1-3ms), and stateless OPA. Containment bounds damage mathematically (\( \max_loss \leq \min(hourly_cap, per_tx \times window) \)). Misses distributed rate-limiting details or sharded anomaly baselines.

**Score: 7/10**

### Interoperability
Strong: SPIFFE/SVID, A2A gateway, DID:web+JWS, mTLS, OPA bundles. Supports standard protocols (MCP via tool manifests, A2A delegation). Schemas enable integration (e.g., SPIRE as IDP).

**Score: 9/10**

### Code vs Words
~70% implementable: Schemas/PDP inputs/Rego examples copy-pasteable; deployment patterns (sidecars, fail-closed) operationalize directly. PoE spec, tiers, matrices executable with minor glue (e.g., OPA setup). Gaps: Full anomaly algos, multi-source signals, pentest suite require dev effort without repo.

**Percentage: 70%**

## Overall Score
**7/10**

## GREENLIGHT
**NO** – Code unavailability undermines claims; publish after repo activation and independent verification.

## Top 3 Technical Gaps
1. **Missing Repository**: No accessible code/services at stated GitHub URL; add live links, SLSA proofs, and Docker images.
2. **Scalability Prototypes**: Provide sharded PDP/anomaly benchmarks for 1000+ agents.
3. **Execution Correctness**: Detail cross-referencing PoE with tool logs (e.g., eBPF prototypes) to bridge PoE-to-execution gap.

════════════════════════════════════════════════════════════════════════════════
