# VERA Paper — Expert Review Round 6

**Date:** 2026-02-10T10:36:42.508Z
**Average Score:** 7.6/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 7.5/10
**Greenlight:** ❌ NO
**Response time:** 84.3s

---

## Executive assessment

VERA is one of the stronger “Zero Trust for agents” architecture drafts I’ve seen: it has explicit PDP/PEP placement, action-surface scoping, typed schemas, and a credible push toward **verifiable** runtime enforcement via receipts + tamper-evident anchoring. The paper is also unusually honest about limitations.

It is *not yet publication-ready as a reference architecture/spec* because several core claims and definitions are internally inconsistent (most notably around adversary classes and what PoE signatures actually prove), and because the “formal” parts stop short of implementable, testable protocol specifications (nonce semantics, replay protection, time, key binding, and third‑party tool realities).

---

## Scores (1–10)

| Dimension | Score | Rationale (summary) |
|---|---:|---|
| 1. **Architectural Completeness** | **8** | Strong PDP/PEP placement, deployment patterns, action coverage matrix, telemetry→policy feedback is present; needs tighter continuous-eval loop spec, clearer TCB minimization, and “what is enforced vs merely detected” rigor. |
| 2. **Threat Model Rigor** | **7** | Good capability matrices and scenarios; however the paper claims 4 adversary classes but defines 5, and several capability/assumption boundaries don’t align with later controls (KMS signing oracle, enforcement-plane compromise). |
| 3. **Novelty** | **8** | The **Tool Execution Receipt** + PoE anchoring + evidence-based autonomy is a real step beyond “apply NIST 800-207 to agents.” Similar ideas exist in supply-chain attestation, but the agent-runtime adaptation is meaningfully new. |
| 4. **Formal Definitions** | **6** | Typed schemas are helpful, but “formal security properties” are closer to *well-written informal arguments*. Critical protocol details are underspecified (nonce lifecycle, replay, clock/time sources, key usage separation, verification algorithms). |
| 5. **Practical Value** | **8** | Engineering teams will get immediate value from the action-surface framing, PEP placements, and tiered fail-closed behavior. Real-world adoption friction (third-party tools can’t sign receipts; eBPF comparisons; SIEM integration) needs more operational guidance. |

### **OVERALL SCORE: 7.5 / 10**

**GREENLIGHT:** **NO** (not yet) — close, but the spec/claims need tightening to avoid misleading “verifiable enforcement” interpretations and to make implementations interoperable.

---

## Detailed review by dimension

### 1) Architectural completeness (Score: 8)

**What’s strong**
- **Action boundary definition + coverage matrix** is exactly what agent ZT needs. Defining *S* (“controlled action surface”) is the right move and aligns with 800-207’s “protect surface” thinking.
- Clear **PDP/PEP separation** and explicit warning against embedding enforcement in the agent process is correct and important.
- Two deployment patterns (central PDP vs sidecar PDP) map well to enterprise vs edge realities.
- You explicitly introduce telemetry-to-policy feedback (anomaly detector → PDP), which many papers omit.

**Gaps / tightenings needed**
- **Continuous evaluation loop needs to be normative.** NIST 800-207’s key idea is *continuous verification*, not “PDP consulted sometimes.” You should specify:
  - decision cadence per action type (tool call, RAG retrieval, egress, delegation)
  - whether decisions are **one-shot**, **lease-based** (TTL), or **continuous with revocation**
  - what gets cached at the PEP and how revocation interrupts cached “allow”
- **Clarify what is prevention vs detection.** Example: “Compare syscall audit log vs PoE action inventory” is not a reliable bypass detector unless you define:
  - the mapping from syscalls → action types
  - acceptable false-positive/false-negative envelopes
  - what happens on mismatch (containment? alert only?)
- **Trust boundaries vs enforcement-plane compromiser.** You state “Enforcement Plane is trusted,” then define an adversary class that compromises it and list mitigations. That’s fine, but you need to reconcile this by explicitly defining:
  - the **Trusted Computing Base (TCB)** you are *actually* assuming
  - what security properties survive partial enforcement-plane compromise (most do not)

**PDP/PEP placement** is otherwise solid and aligns with practical ZTA rollouts: API gateway + egress proxy + tool wrappers + memory guard are realistic enforcement points.

---

### 2) Threat model rigor (Score: 7)

**What’s strong**
- Capability matrix format is clear and maps to controls.
- Scenarios combine adversaries (Manipulator+Insider, Escalator+Evader) which is realistic.
- You correctly elevate **RAG/memory** and **telemetry poisoning** as first-class concerns.

**Issues to fix**
- **Contradiction:** Abstract/Section 2 says **four adversary classes**, but Section 2.2 defines **five** (Manipulator, Insider, Escalator, Evader, *Enforcement-Plane Compromiser*). This is not cosmetic—your entire “trusted enforcement plane” assumption hinges on it.
- The capability “Access signing keys” is marked ❌ for all, but the **Enforcement-Plane Compromiser** can effectively obtain a **signing oracle** via KMS `Sign` misuse. Your model must distinguish:
  - **key exfiltration** (private key material stolen)
  - **unauthorized signing capability** (oracle access)
  These are different and matter for non-repudiation and PoE integrity.
- **On-path attacker** appears only as “Possible” for Insider. Given agent systems frequently call SaaS tools, you should model a separate network adversary (or explicitly state why mTLS+pinning removes it) and cover downgrade/termination/traffic-shaping attacks.

**Suggestion:** restructure threat model into:
- External (inputs + tool responses)
- Supply chain / CI-CD
- Runtime compromise (agent container)
- Enforcement plane compromise
- Platform/cloud control plane compromise  
…and clearly state which formal properties hold under which compromise set.

---

### 3) Novelty (Score: 8)

**Genuine advances**
- **Tool Execution Receipts** are the best “missing piece” in most ZT-for-agents drafts. You’re effectively proposing an *authorization-to-execution binding*, which is what makes enforcement *verifiable* rather than merely “logged.”
- Evidence-based tiering is a practical way to operationalize trust posture for agents beyond static RBAC.

**Where novelty claims should be tempered**
- Anchoring + signed records overlaps with transparency logs / in-toto / Sigstore patterns; what’s new is applying them to **runtime agent actions**. Cite that lineage more explicitly so reviewers don’t view it as “blockchain logging but for agents.”

---

### 4) Formal definitions (Score: 6)

You have good schemas, but the “formal” parts are not yet implementable as an interoperable spec.

**Key inconsistencies / underspecification**
1. **Who signs PoE?**
   - Definition 1: PoE contains signature verifiable by `pk_agent`.
   - Elsewhere: signing requests “MUST originate only from PEP/Proof Engine… agent has no path to signing service.”
   - Later: verification step says “agent key (or PEP/Proof Engine key under A3).”
   
   This matters: if the **PEP** is the only signer, then PoE proves *the enforcement plane recorded/authorized an action*, not that “the agent performed it.” If the **agent identity** is the signer, you need a secure way for the agent to request signing without becoming a signing oracle for arbitrary content (and without letting the agent bypass policy).

   **Fix:** Define two distinct signatures with distinct keys and semantics:
   - **Authorization Record** signed by PEP/Proof Engine key (enforcement attestation)
   - **Execution Receipt** signed by tool (execution attestation)
   Optionally include an **agent-generated intent record** signed by an agent key if you truly need “agent non-repudiation,” but then you must define how that key is protected and used safely.

2. **Nonce lifecycle and replay protection are not specified.**
   For Tool Execution Receipts, you must define:
   - nonce entropy, format, and issuer
   - nonce TTL
   - single-use enforcement
   - binding to mTLS connection / SPIFFE ID / request hash
   - what happens on retries (idempotency keys)

3. **Time is not well-defined.**
   You include `agentClock` plus optional verified sources. For a verifiable chain, you need normative rules on:
   - acceptable clock skew
   - when anchors are required vs optional per tier
   - whether RFC3161/anchor time is authoritative for ordering disputes

4. **Property 3 (Policy Enforcement Completeness)** is conceptually good but not formally checkable yet.
   “Actions outside S are blocked … or detectable via kernel-level audit” is too open-ended. Turn this into testable requirements:
   - required egress-deny posture (iptables/CNI policy)
   - required syscall denylist/allowlist (seccomp profile baseline)
   - required audit sources and retention
   - what constitutes a “detectable” event (schema + correlation logic)

5. **Containment bound** is helpful, but the bound assumes synchronous enforcement while your architecture includes queues and external tool side effects. You should specify:
   - required tooling constraints for tools to be considered “bounded-loss capable”
   - how you account for irreversible actions (email sending, message publishing, etc.)

---

### 5) Practical value (Score: 8)

**Very practical**
- Engineers can implement your PDP input/output schema and start writing Rego policies today.
- The tiered fail-closed/fail-open guidance is pragmatic.
- Memory/RAG governance is actionable (ACLs, TTLs, audit logs) and should land well with practitioners.

**Adoption friction you should address directly**
- **Third-party tools won’t sign receipts.** Many critical tools are SaaS APIs you don’t control. Provide a defined pattern:
  - “Receipt by gateway” (your org’s egress proxy signs an execution attestation)
  - plus limitations (it attests to *request emission/response receipt*, not actual server-side execution)
- **Performance envelope claims need environment detail.** The ONNX/spaCy latency numbers are plausible but need CPU model, concurrency, and memory footprint for production comparability.
- **Operational runbooks**: demotion triggers, incident containment stages, and bundle rollout need “day-2 operations” guidance (what SRE/security teams actually do).

---

## Top 3 specific improvements needed (highest impact)

1. **Resolve PoE/receipt semantics and keys (normative).**  
   Define *exactly* what is being attested by whom:
   - PEP authorization record (signed by enforcement key)
   - tool execution receipt (signed by tool/gateway key)
   - optional agent intent record (if you keep “agent non-repudiation,” define the safe signing flow)
   Then update Definitions 1–3 and the verification procedure to match.

2. **Fix and formalize the threat model + assumptions mapping.**  
   - Make adversary classes consistent (4 vs 5).
   - Explicitly model KMS signing-oracle abuse.
   - Provide a table: **Property → required assumptions → which adversaries break it**.

3. **Turn “verifiable enforcement” into an implementable protocol spec.**  
   Add a concise “Protocol” section with MUST/SHOULD language covering:
   - nonce generation, replay protection, TTL, retry/idempotency behavior
   - binding between PDP decision ↔ PEP enforcement ↔ tool receipt (include hashes of canonical request/response)
   - required minimal fields for correlation across systems (decisionId, bundleHash, toolId, spiffeID, etc.)

---

## Factual errors / contradictions / potentially misleading claims to flag

1. **Contradiction:** “formal threat model with four adversary classes” vs **five adversary classes** in Section 2.2.
2. **Potentially misleading:** “Action Non-Repudiation… agent cannot deny having performed a.”  
   As written, the architecture implies the **agent runtime cannot access signing keys**, so the signature more naturally proves **the enforcement plane signed/recorded** an action, not that “the agent performed it.” You partially acknowledge this in §10.3, but the Definition and the claim should be corrected to avoid overstatement.
3. **Reference accuracy:** “Certificate Transparency [Laurie et al., RFC 6962]” — RFC 6962 is obsolete; the current CT spec is **RFC 9162**. (Not catastrophic, but worth correcting for publication.)
4. **Anchor performance claim risk:** Solana “~400ms confirmation” can vary materially with congestion/finality definitions. Consider phrasing as “observed in our tests” with methodology (RPC provider, commitment level).
5. **OWASP naming/versioning:** Ensure the exact title (“OWASP Top 10 for Agentic Applications (Dec 2025)”) matches OWASP’s canonical publication name; OWASP project names change. (If this is a real OWASP release, cite the URL and commit/tag.)

---

## Publication recommendation

This is a strong Round 6 draft with real engineering substance. To publish as a *reference architecture* (especially one claiming “verifiable enforcement”), you need to tighten the cryptographic/protocol semantics and align the threat model with the trust assumptions. Once the PoE/receipt/key story is unambiguous and the adversary model is consistent, I would expect this to clear review.

**GREENLIGHT: NO**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 7.5/10
**Greenlight:** ✅ YES
**Response time:** 94.4s

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

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 44.6s

---

### Red Team Review: VERA: Verifiable Enforcement for Runtime Agents

As Raven, I've dissected this paper with the eyes of an adversary who lives to break zero trust stacks. VERA is ambitious and well-structured—rare for AI security papers that often drown in hype or handwavy "governance checklists." It delivers running code (kudos on the 12 MIT-licensed services and 25/25 tests), formal properties, and empirical data, which elevates it above vaporware. The PDP/PEP architecture faithfully extends NIST 800-207 to agents, PoE chains provide real auditability, and pluggable anchors avoid blockchain worship. The honesty in limitations (e.g., PoE ≠ execution correctness) and bypassed pentest vectors (90.2% block rate with specifics) is refreshing.

That said, VERA is no silver bullet. It's a **reference architecture** for orgs with mature infra (Kubernetes, OPA, KMS, SPIFFE), not a drop-in for startups. It leans heavily on a "trusted enforcement plane" that's hardened (cosign, SLSA L2+, IAM conditions) but exploitable via cloud admins or CI/CD. Non-determinism is punted to distributional baselines (GMMs), which adversaries can game. Maturity tiers feel like AWS IAM roles with extra steps—evidence-based but collusion-prone. Brutally: this detects and slows attacks well but doesn't stop a nation-state or clever insider chaining zero-days. Constructively: prioritize tool receipt adoption and enforcement-plane TEEs for production.

#### Scores (1-10, higher = stronger resistance to red teaming)

1. **THREAT MODEL COVERAGE: 8/10**  
   The 4-class model (Manipulator, Insider, Escalator, Evader) + Enforcement-Plane Compromiser is crisp, with capability matrices, OWASP mappings, and combined scenarios. Covers prompt/RAG poisoning, supply chain backdoors, escalation via delegation, evasion via telemetry spoofing—real vectors from labs like Anthropic's agent benchmarks and real-world breaches (e.g., SolarWinds-style dep poisoning). Gaps: no explicit model weight exfiltration (Evader reads memory → slow drip out via legit tools), side-channel (timing/power on anomaly baselines), or training data poisoning beyond "signed attestation." Misses physical supply chain (e.g., tampered USB model loads). Still, better than most; matrices make it extensible.

2. **DEFENSE DEPTH: 7/10**  
   Pillars are solid: input firewalls (14ms ONNX), PoE chains (tamper-evident under A1-A4), tool-parameter PDPs (Rego examples rock), memory ACLs. Tool Execution Receipts close the "signed log ≠ verified exec" gap elegantly via nonces. Pentest results (37/41 blocked) and latencies are credible. Weaknesses: anomaly SWDB evadable via gradual drift ("boiling frog"); PoE skips internal reasoning (honest, but agents think dirty there). Bypass detection relies on external logs/tools cooperating—practical fail if tools don't sign receipts. Enforcement plane hardening (Kyverno, SPIFFE) good but skips runtime behavioral attestation (e.g., no eBPF on PEPs). Effective vs. script-kiddies; cracks under sustained ops.

3. **MATURITY MODEL RESISTANCE: 6/10**  
   Evidence portfolios (signed tests, anomaly rates) > calendar time—smart. Adversarial grading (Agent Pentest v2.1) and demotion triggers (gaps, incidents) add teeth. But gaming vectors abound: insiders collude on approvals (no quorum thresholds), poison eval datasets (curated by sec team? Insiders own that), inflate actions via fake loops. Re-validation periodic but not continuous. Override needs 2PA but logs as PoE (auditable, but post-facto). Brutal: feels like promotion ladders in corps—gameable by politics + tech. Constructive: mandate external pentests (e.g., via Bugcrowd) and ML-based approval anomaly detection.

4. **SUPPLY CHAIN: 8/10**  
   SBOM gates, signed manifests (tools/prompts/configs), vuln scans, SLSA L2+—ticks boxes for deps/typosquatting/backdoored LoRAs. RAG provenance scoring novel. Weak on training data: "HF dataset ID + provider sig" verifies nothing if upstream poisoned (e.g., HuggingFace trojan datasets). No recursive SBOM for model sub-deps (quantizers, tokenizers). Git signed commits good, but misses build cache poisoning. Covers 80% real attacks (e.g., PyPI malware); extend with in-toto for full SLSA L3.

5. **CONTAINMENT: 7/10**  
   Multi-stage (500ms revocation → 60s compensation) with SLAs, multi-source signals (needs 3+), default-deny egress—strong proactive bounds (e.g., `max_loss ≤ min(cap, rate × window`). In-flight <10s realistic. Fail-safes like PoE gaps detect evasion. But determined attacker: async queues (Kafka/SQS) leak pre-cancellation; compensating txns fail on blockchains/irreversible ops; Evader spoofs 3 sources via compromised tools. No kill-switch survival proof (e.g., agent respawns sans state freeze). Stops opportunists; slows APTs.

6. **HONESTY: 9/10**  
   Exemplary: details 4 bypassed pentests with mitigations, admits PoE limits (non-repudiation ≠ correctness), scalability/performance tradeoffs, non-determinism gaps, multi-agent unsolved. Compliance table calls out "not certification." Residual risks per OWASP. Minor puff: "proof over policy" oversells (still needs policy authors); empiricals small-scale (no 1000-agent claims).

**OVERALL SECURITY VALUE: 7/10**  
High value as a blueprint: operationalizes NIST/OWASP into deployable services. Beats frameworks like MAESTRO (threat ID only). Weak on root trust (enforcement plane) and insider collusion. Production-ready for mid-tier orgs with tweaks; not for high-stakes finance sans audits.

**GREENLIGHT: YES** — Credible architecture. Deploy with enforcement-plane TEEs and external audits; it'll raise your baseline 2x.

#### TOP 3 Attack Vectors to Address/Strengthen
1. **Enforcement-Plane Compromise (Root Kill Chain)**: Cloud admin modifies IAM/KMS conditions or injects sidecar via node escape. Strengthen: Mandate TEEs (SEV-SNP) for PDP/PEP + runtime eBPF monitoring of enforcement processes. Current mitigations (cosign/SLSA) block known-good but not zero-days.
2. **Maturity Gaming via Insider Collusion**: Fake portfolios via signed approvals on poisoned eval sets. Strengthen: External third-party verification (e.g., integrate Veradocs or HackerOne) + anomaly detection on *promotion artifacts* themselves (e.g., unnatural test score clustering).
3. **Async/In-Flight Leakage Beyond Bounds**: Queued txns/tools ignore cancellation (e.g., email sends, blockchain txs). Strengthen: PEP-issued "revocable nonces" with tool-side heartbeat checks; prove bounds empirically with chaos engineering (e.g., inject faults mid-tx).

#### Flagged Aspirational Claims (Achievable with Work, But Oversold)
- **"Cryptographic Proof of Execution" (Title/Abstract/Passim)**: Aspirational—it's proof of *signing/logging* an action (non-repudiation), not execution correctness (per §10.3). Real PoE needs TEEs/remote attestation; current is "tamper-evident audit log."
- **"Bounded Maximum Loss" (Def. 4)**: Assumes "synchronous enforcement" and tool cooperation; async reality (SLA <10s) is probabilistic, not hard-bound. Aspirational without end-to-end tx rollback proofs.
- **"VERA operationalizes governance frameworks" (Abstract/§1)**: Partial—great for PDP/PEP, but anomaly/input models need custom tuning per agent; not fully "plug-and-play."
- **90.2% Pentest Block Rate (§7.2)**: Solid, but single-suite (41 vectors); aspirational as "comprehensive" without cross-suite (e.g., + Garak, AgentHarm).

#### Thorough Breakdown by Section (Brutal + Constructive)

**§2 Threat Model**: Strong foundation. Capability matrix excels; scenarios realistic (e.g., RAG+prompt). Add: Model theft (weights >1GB, exfil via legit DB writes). A3/A4 assumptions crisp but brittle (cloud KMS key exfil via impl bugs like Venafi breaches).

**§3 Properties/Arguments**: Formal defs good (JCS canonicalization pro). Args hold under assns, but note quantum footnote weak—Dilithium swap needs key rotation plan. Containment bound math elegant but ignores compounding (e.g., 100x$10k txns).

**§4 Architecture**: Best section. Trust boundaries/Mermaid clear; patterns practical (sidecar PDP <3ms). Receipts/nonces genius for verifiability. Memory governance fills real gap (RAG poisoning underrated). Nit: SWDB GMMs need hyperparam proofs (BIC auto good); add Isolation Forest for robustness.

**§5 Maturity**: Innovative but gameable (score reflects). Portfolios verifiable, but approvals single-sig. Add blockchain-anchored portfolios for T4.

**§6 Supply Chain**: Thorough; SBOM+vulns practical. Weak training provenance—require SLSA for datasets.

**§7 Implementation**: Killer—running code + metrics/blocks legitimize. Bypasses transparent (fix homoglyphs already done). Scale to 1000 agents? Shard PoE anchors.

**§8-9 OWASP/Compliance**: Honest mappings; residuals spot-on (e.g., A07 Byzantine unsolved).

**§10 Limitations**: Gold standard—covers all my gripes pre-emptively.

**Future Work Recs**: TEE everything; BFT multi-agent; quantum migration guide; 1000-agent benchmark.

VERA pushes the field forward. Fork it, harden it, own it.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 34.3s

---

## Expert Review: VERA from a Financial Services CISO Perspective

As Sarah Blackwell, CISO of a large European financial services company, I have evaluated the VERA paper against our operational, compliance, and risk management requirements. Here is my dimensional assessment:

### 1. OPERATIONALIZABILITY: 7/10
**Strengths:** The paper provides concrete schemas, deployment patterns, and 12 open-source services. The explicit PDP/PEP architecture and TypeScript interfaces give engineering teams a clear starting point. The fail-closed/fail-open behaviors per trust tier are pragmatic.
**Concerns:** Implementing VERA requires significant engineering maturity (SPIFFE, OPA, KMS integration, anchor backends). The "hardened sidecar" pattern demands container/microVM security expertise beyond typical DevOps. Financial services with legacy systems may struggle with the uniform egress proxy requirement.

### 2. COMPLIANCE HONESTY: 9/10
**Strengths:** Section 9 is exceptionally honest. The explicit disclaimer that "VERA does not automatically make an organization compliant" and the EU AI Act caveat ("interpretive guidance, not legal certification") demonstrate integrity. The mapping table uses "potentially supports" rather than overclaiming.
**Minor Gap:** Could explicitly mention SOX ITGC implications (change management for policy bundles, PoE as audit trail) and DORA's ICT risk management requirements.

### 3. COST AWARENESS: 6/10
**Strengths:** Acknowledges latency overhead (14-22ms + proof generation) and provides anchor backend cost comparisons. Mentions scalability limitations for 1000+ agents.
**Gaps:** No TCO modeling for enterprise deployment: KMS costs for millions of signatures, team training, policy authoring overhead, monitoring complexity. Financial services need explicit cost/risk tradeoff analysis for board approval.

### 4. VENDOR NEUTRALITY: 8/10
**Strengths:** Architecture is vendor-agnostic (supports AWS KMS, GCP KMS, HashiCorp Vault). Anchor abstraction allows multiple backends. Open-source MIT license.
**Minor Concerns:** Some implementation examples use OPA/Rego (CNCF) which is fine, but could mention alternative policy engines. The "agent-pentest" npm package is from the authors but appears optional.

### 5. REGULATORY REALISM: 8/10
**Strengths:** Correctly identifies that EU AI Act (as of 2026) doesn't explicitly address agentic AI. DORA incident response timelines are acknowledged. GDPR Art. 25 (data protection by design) mapping is appropriate.
**Gaps:** Could address SOX Section 404 implications: PoE chains as audit evidence require independent validator access. Financial transaction reversibility (compensating transactions) needs more detail for regulatory reporting.

### 6. BOARD READINESS: 9/10
**Strengths:** Excellent executive summary with clear blast radius framing. Threat model with adversary classes is board-friendly. Trust tiers with evidence-based promotion provide measurable risk progression. The compliance honesty builds credibility.
**Enhancement:** Would benefit from a one-page risk/reduction summary quantifying "reduces unauthorized transaction risk from X to Y" for financial use cases.

### 7. PRACTICAL VALUE: 8/10
**Strengths:** Directly addresses our top concerns: tool-chain authorization, RAG poisoning, and non-deterministic anomaly detection. The 90.2% block rate on adversarial tests is compelling. Memory governance is unique and valuable.
**Considerations:** Requires significant adaptation to financial services workflows (payment approvals, trade surveillance). The "enforcement plane compromise" section acknowledges residual risks we must accept.

### OVERALL SCORE: 8/10
VERA is the most technically substantive AI agent security architecture I've seen. It transforms vague governance into enforceable controls. The cryptographic proof approach aligns with financial sector audit requirements. While implementation is non-trivial, the reference architecture substantially de-risks agent deployment.

### GREENLIGHT: YES
**With the condition that we:** 
1. Conduct a 4-week pilot on non-critical data analysis agents
2. Engage legal/compliance for EU AI Act and DORA alignment assessment
3. Develop internal cost estimates and phased rollout plan

### TOP 3 IMPROVEMENTS FROM CISO PERSPECTIVE:

1. **Financial Services Regulatory Integration:** Add explicit mappings to PSD2/SCA (strong customer authentication), MiFID II record-keeping, and Basel III operational risk requirements. Include a template for regulator-facing documentation of the enforcement architecture.

2. **Total Cost of Ownership Transparency:** Provide a deployment calculator covering: KMS signing operations, anchor backend costs, policy authoring FTE requirements, and monitoring overhead. Financial services boards require this for capital allocation.

3. **Incident Response Playbook Integration:** Expand Section 4.5 with sample playbooks for containment scenarios specific to financial services (suspected fraudulent transactions, market manipulation attempts, data exfiltration). Integrate with existing SOC workflows rather than assuming greenfield.

**Final Recommendation:** This paper provides substantial value for my organization. It gives my team an enforceable architecture rather than vague guidelines. We will proceed with pilot implementation while addressing the cost and regulatory integration gaps internally.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 8/10
**Greenlight:** ❌ NO
**Response time:** 10.9s

---

## Evaluation Scores

**1. TECHNICAL DEPTH: 9/10**  
The paper provides detailed typed TypeScript schemas for identities, PoE records, tool receipts, policy requests, and memory governance, alongside explicit PDP/PEP placements, deployment patterns (central vs. sidecar), and action coverage matrices. Formal security properties include precise definitions (e.g., non-repudiation via Ed25519 under EU-CMA) and proof arguments tied to cryptographic assumptions A1-A4. Mermaid diagrams and Rego policy examples further enable direct implementation, though some areas like full SWDB anomaly detection pseudocode are algorithmic descriptions rather than complete code.

**2. TOOLING ALIGNMENT: 9/10**  
References 2026-relevant tools like OPA for PDP (with bundle syncing), Sigstore/cosign/Kyverno for artifact signing (SLSA L2+), SPIFFE/SVID for runtime attestation, Solana for anchoring, ONNX/DistilBERT for input firewalls, and Ed25519/ECDSA P-256 for KMS compatibility (AWS/GCP/HashiCorp Vault). Integrates A2A (Google 2026 protocol) via SPIFFE and OWASP Top 10 Agentic (Dec 2025). Minor gap: no mention of emerging 2026 agent frameworks like Anthropic's agentic tooling or updated LangGraph evals.

**3. CODE AVAILABILITY: 8/10**  
Claims 12 MIT-licensed, independently deployable services (e.g., Veracity Core for PoE, ConvoGuard for firewalls, Agent Pentest npm package) with 25/25 passing contract tests, backed by a git clone command to github.com/yogami/vera-reference-implementation.git. Empirical metrics (e.g., 14ms PII detection, 90.2% block rate on 41 vectors) and adversarial disclosures add credibility. Deduction due to inability to verify repo existence/access at review time—assumed available per paper, but real-world confirmation needed.

**4. COMPETING FRAMEWORKS: 9/10**  
Comprehensive tables compare to NIST 800-207 (PDP/PEP match), OWASP Top 10 Agentic (full coverage), MAESTRO (adds enforcement), AWS Scoping (evidence-based tiers), Google A2A (identity interop), and LangChain (implied via tool chaining gaps addressed). Positions VERA as the runtime layer operationalizing these, with honest residual risks (e.g., multi-turn injection). Strong on differentiation like evidence-based trust vs. calendar models.

**5. SCALABILITY: 7/10**  
Addresses sharding via central OPA clusters (3+ replicas, stateless), pluggable anchors (low-latency hash-chains), and fail-closed behaviors, with latency benchmarks (1-15ms decisions, <5ms local anchoring). Containment SLAs (<10s in-flight cancel) bound blast radius. Self-acknowledges limitations at 1000+ agents (needs sharded anomaly detection, hierarchical PDP)—credible for reference arch, but lacks production proofs at extreme scale.

**6. INTEROPERABILITY: 9/10**  
Strong support for standards: A2A via SPIFFE gateways, MCP (implied in tool manifests), SPIFFE/SVID for attestation, DID:web/JWT-VC for identity, JCS (RFC 8785) for canonicalization, SBOM (SPDX), SLSA L2+, mTLS, Rego/OPA policies. Tool receipts bind via nonces to external services. Gaps like full BFT for swarms noted as future work.

**7. CODE vs WORDS: 75%**  
Approximately 75% implementable directly: full schemas, Rego examples, PoE/Receipt interfaces, deployment YAML patterns (sidecar/central), and service specs allow building core PDP/PEP/PoE without ambiguity. Remaining 25% requires engineering for integrations (e.g., SWDB GMM fitting, multi-source anomaly quorum) or extensions (e.g., quantum migration hooks).

**OVERALL: 8/10**

## GREENLIGHT
YES

## TOP 3 Technical Gaps
1. **Repo Verification and Artifacts**: Provide direct links to tagged releases, Docker images (e.g., GHCR), or npm packages for all 12 services; current git clone assumes accessibility—add SLSA-proven builds and API docs for instant deployment.
2. **Scalability Prototypes**: Include benchmarks or sharded configs for 1000+ agents (e.g., distributed Redis for rate limits, Kafka for PoE queuing) to address self-noted L10.1 gap.
3. **Multi-Agent BFT Extension**: Define minimal Sybil-resistant delegation (e.g., threshold signatures over PoE chains) to close L10.5, with schema updates for swarm scenarios.

════════════════════════════════════════════════════════════════════════════════
