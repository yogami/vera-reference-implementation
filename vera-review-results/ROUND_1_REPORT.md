# VERA Paper — Expert Review Round 1

**Date:** 2026-02-10T09:26:11.979Z
**Average Score:** 7.4/10
**All Greenlit:** NO

════════════════════════════════════════════════════════════════════════════════

# 🎓 Dr. Elena Volkov — Zero Trust Architect
**Role:** Zero Trust Architecture Expert
**Model:** `openai/gpt-5.2`
**Score:** 7/10
**Greenlight:** ❌ NO
**Response time:** 99.3s

---

## Publication-Quality Review — VERA: Verified Enforcement for Runtime Agents (Round 1)  
*Reviewer: Dr. Elena Volkov (Zero Trust Architect; NIST SP 800-207 working group)*

### Scorecard (1–10)

| Dimension | Score | Rationale (one line) |
|---|---:|---|
| 1) Architectural Completeness | **7/10** | Strong pillarization + explicit PDP/PEP concept, but critical ZTA control-loop and trust-boundary details are underspecified for a “reference architecture.” |
| 2) Threat Model Rigor | **6/10** | Useful adversary taxonomy, but not formally structured (assets, assumptions, trust boundaries, capability matrices, coverage mapping) and misses several important adversaries. |
| 3) Novelty | **7/10** | “Evidence-based maturity” + tool-parameter authorization + PoE as a first-class ZT signal is meaningfully novel; blockchain anchoring is not. |
| 4) Formal Definitions | **6/10** | Helpful TypeScript schemas, but not implementable as-is (canonicalization, signing, key mgmt, time, attestation semantics, policy interfaces) and mixes marketing with spec. |
| 5) Practical Value | **8/10** | Engineering-minded, action-oriented, and closer to buildable than most agent security papers; needs clearer deployment patterns and reproducibility to be truly “reference.” |

**OVERALL SCORE: 7/10**

**GREENLIGHT:** **NO** (publishable with a focused revision pass; see Top 3 improvements)

---

## What’s Strong (and worth preserving)

### 1) You correctly call out the missing piece: runtime enforcement, not governance prose
This is directionally aligned with how Zero Trust succeeds in practice: reduce implicit trust, make decisions continuously, and enforce at choke points. The framing (“governance theater”) is blunt, but the underlying point is valid and differentiating.

### 2) Explicit PDP/PEP language is the right anchor to NIST 800-207
Most “agent security frameworks” hand-wave where policy is evaluated and enforced. Your inclusion of tool wrappers, API gateways, and memory stores as PEPs is one of the most practically valuable parts of the paper.

### 3) Tool-parameter authorization is a genuinely important step up from coarse API allowlists
For agentic systems, *parameters are often the privilege escalation mechanism*. Treating them as first-class policy objects is a concrete advance.

### 4) “Evidence-based promotion” is a solid concept (with caveats)
Tying autonomy to measured evidence instead of calendar time is a useful reframing. It matches how mature ZTA programs treat device trust and workload trust: posture + behavior + continuous evaluation.

---

## Dimension-by-Dimension Detailed Review

### 1) ARCHITECTURAL COMPLETENESS — **7/10**

You have the right components, but a “reference architecture” needs sharper placement, boundaries, and closed-loop behavior.

**What’s complete:**
- PDP/PEP are present, and you name multiple PEPs (tool wrapper, API gateway, memory store).
- You acknowledge continuous telemetry feeding policy evaluation.
- You identify key control surfaces specific to agents (RAG/memory, delegation chains, non-determinism).

**What’s missing / underspecified (for publication quality):**
1) **Where is the PDP logically and physically placed?**  
   In ZTA, PDP placement (central vs distributed, per-call vs cached decisions) determines failure modes. You should specify at least two reference deployment patterns:
   - *Central PDP, distributed PEPs* (common enterprise pattern)
   - *Sidecar PDP/PEP per agent runtime* (common in K8s service mesh patterns)
   Include latency, availability, and “fail open/closed” guidance per tier.

2) **Policy evaluation loop is implied, not specified.**  
   NIST ZTA depends on continuous diagnostics and mitigation (CDM) driving dynamic policy. You show `TEL -> PE`, but you don’t specify:
   - what signals are required vs optional,
   - decision cadence (per action / per session / periodic),
   - how signals change effective privileges (step-up auth, reduce scopes, demotion),
   - how you prevent feedback manipulation (esp. your “Escalator” class).

3) **Identity and key management lifecycle is not fully defined.**  
   You define DID/web + Ed25519, but a reference architecture needs:
   - issuance flows (who issues, what’s the trust anchor),
   - rotation and revocation semantics (including “revocation endpoint” trust),
   - proof-of-possession / binding to runtime instance,
   - multi-instance agent identity (one DID per agent *type* vs per deployment vs per replica).

4) **PoE is described, but “proof” is weaker than the language suggests without runtime attestation.**  
   If the agent runtime is compromised, it can sign malicious actions and produce perfectly valid PoE. That’s not a PoE failure—it’s an *attestation gap*. For “Verified Enforcement,” you need to clarify:
   - Is PoE *integrity of logging* or *integrity of execution*?
   - Do you require TEEs (SGX/SEV/TDX), secure boot, or at least container/workload attestation (e.g., SPIFFE/SVID + workload identity) to bind PoE to a known runtime?

5) **Multi-agent and delegation flows need a concrete reference sequence.**  
   You mention delegation chain abuse and attenuation, but you don’t provide:
   - a delegation token format,
   - transitive scope reduction rules,
   - how PDP evaluates agent-to-agent calls differently than agent-to-tool calls.

**Net:** good skeleton; needs “wiring diagram,” deployment patterns, and explicit closed-loop logic to be a true reference architecture.

---

### 2) THREAT MODEL RIGOR — **6/10**

The four adversary classes are intuitive and memorable, but the model is not formal enough to support strong security claims.

**What’s good:**
- You cover external input attacks, insider/supply chain, privilege escalation, and evasion.
- You correctly call out indirect prompt injection via RAG and schema manipulation.

**Gaps to address:**
1) **Missing explicit assets, trust boundaries, and assumptions.**  
   A rigorous threat model starts with: assets (secrets, customer data, tool capabilities, signing keys), trust boundaries (agent runtime, policy plane, telemetry plane, storage, external tools), and assumptions (e.g., “policy engine is trusted,” “key store is HSM-backed,” etc.).

2) **Adversary capability matrices are absent.**  
   You describe capabilities in prose, but publication-quality rigor needs a structured matrix: read/write access, network position (on-path/off-path), code execution, identity theft, key compromise, etc.

3) **Several important adversary types are missing or blended away:**
   - **Compromised model/provider** (malicious upstream model update; poisoned base model) distinct from “Insider”
   - **On-path attacker / replay** between agent, PEP, PDP, tools (especially if decisions are cached)
   - **Data extraction/model inversion** (if agents expose embeddings, similarity search APIs, or partial logs)
   - **Policy-plane attacks** (OPA bundle poisoning, policy rollback, stale policy cache exploitation)
   - **Telemetry-plane attacks** (false signals to force demotion or force fail-open conditions)

4) **Coverage mapping is asserted, not demonstrated.**  
   You state alignment with OWASP Top 10 for Agentic Apps and MAESTRO, but do not map:
   - each OWASP category → specific VERA controls → enforcement point(s) → residual risk.

**Net:** a strong start, but you need a more formal structure and coverage evidence to justify the “verified enforcement” positioning.

---

### 3) NOVELTY — **7/10**

There is real novelty here, but it’s unevenly distributed.

**Legit advances beyond “NIST 800-207 but for agents”:**
- **Evidence-based maturity gates** using portfolio artifacts (signed test reports, PoE counts, anomaly rates) is a practical mechanism many teams lack.
- **Tool-parameter constraints** as a policy object is more precise than typical “API allowlist” guidance.
- Treating **memory/RAG governance** as a core surface (ACLs, TTLs, provenance scoring) is on-target and more actionable than most papers.

**Where novelty is overstated or risks skepticism:**
- **Blockchain anchoring** is not novel, and it’s not automatically “tamper-proof logging.” It can provide *tamper-evidence* for a hash chain, but it does not ensure completeness, correct ordering without secure time, or prevent endpoint compromise. This should be framed as *optional tamper-evidence*, not a core trust mechanism.
- “Most practical attack vector in 2026” claims need evidence or softer wording.

**Net:** novelty is sufficient for publication *if* you tighten claims and provide clearer differentiators vs existing ZTA adaptations (service mesh + SPIFFE + OPA + audit logging).

---

### 4) FORMAL DEFINITIONS — **6/10**

The schemas are helpful, but they are not yet specification-grade.

**What’s strong:**
- Typed interfaces are a step above typical narrative-only frameworks.
- You include fields that matter operationally (sequenceNumber, parentActionId, triggeredBy).

**What prevents implementation without guesswork:**
1) **No canonical serialization rules for signatures.**  
   “Ed25519 over all fields” is not enough. You must specify:
   - canonical JSON (RFC 8785 JCS, or CBOR canonical, etc.),
   - field ordering, optional fields, encoding (UTF-8), normalization,
   - how `anchor?` affects signatures (signed before anchoring? after? both?).

2) **Time semantics are undefined.**  
   “Verifiable timestamp” requires a trust source:
   - RFC 3161 TSA? secure NTP + attested clock? blockchain time is not precise enough for many audit uses.
   - define acceptable skew and how PDP/PEP handle skew.

3) **Key management and trust anchors are not specified.**  
   Where are keys stored (HSM/KMS)? How do you prevent key exfiltration from the agent runtime? How are keys rotated without breaking chain verification?

4) **Policy interface is too high-level.**  
   You name OPA/Rego, but don’t define:
   - input document schema to PDP (identity, purpose, capability manifest, action request, context, signals),
   - decision outputs (allow/deny + obligations: redact, step-up approval, rate-limit, require human, log level),
   - caching rules and decision TTL.

5) **“Signed model manifest with training data provenance” is not concretely spec’d.**  
   Training data provenance is rarely representable as a single hash in real systems. If you keep this, define a minimal viable approach (dataset identifiers + signed attestations + lineage pointers), otherwise reviewers will flag it as aspirational.

**Net:** good direction; needs spec hardening (serialization, crypto, time, key lifecycle, policy I/O).

---

### 5) PRACTICAL VALUE — **8/10**

This is closer to what engineering teams want than most papers: enforceable controls, PEPs, measurable gates, and operational SLAs.

**What will help teams immediately:**
- Identifying memory/RAG as a governed surface with TTL + ACL + provenance
- Tool wrappers as PEPs and parameter constraints
- Circuit breaker decomposition beyond token revocation
- Promotion/demotion logic tied to measurable evidence

**What reduces practical uptake today:**
- Several “product-like” assertions without reproducibility detail (datasets, benchmarks, threat coverage methodology).
- Heavy identity stack choices (DID:web + JWT-VC) without an enterprise integration path (e.g., mapping to SPIFFE/SVID, mTLS, workload identity, existing IAM).
- Blockchain anchoring as a default will be a non-starter in many regulated environments; you need an “anchor abstraction” with options (internal append-only log, WORM storage, transparency log, or blockchain).

---

## Factual Errors, Misleading Claims, or Contradictions (Flagged)

1) **“Blockchain anchoring” ≠ tamper-proof logging.**  
   It can make *a particular hash chain tamper-evident*, but it does not:
   - guarantee the agent logged everything (completeness),
   - prevent a compromised runtime from signing bad actions,
   - solve time correctness,
   - preserve raw forensic artifacts (only hashes).  
   Recommendation: rephrase to “tamper-evident anchoring,” and explicitly state residual risks.

2) **JWT statement is over-broad / somewhat misleading.**  
   “JWT increases replay risk” is not inherently true; replay risk depends on usage (bearer vs PoP), TTL, audience, binding (DPoP/mTLS), etc. Your underlying message (“JWT alone isn’t identity”) is right—tighten the wording to avoid appearing incorrect.

3) **Repository/service naming inconsistencies (internal contradiction).**
   - “Veracity Core” is listed as `github.com/yogami/pdp-protocol` (name mismatch).
   - “Proof of Execution Anchor” appears in the services table, while earlier you already have “Agent Chain Anchor” and “Blockchain Anchor.” It’s unclear if these are distinct or duplicated.

4) **Performance claims need methodology disclosure.**  
   “14ms median, 22ms p99” and “97.3% PII detection accuracy” are plausible but not reviewable without:
   - hardware profile, batch size, concurrency,
   - datasets and labeling methodology,
   - definition of “accuracy” (precision/recall/F1), class distribution,
   - whether p99 includes queueing under load.

5) **“No existing framework addresses X” is too absolute.**  
   Several places claim “no existing framework addresses this.” Reviewers will challenge absolutes. Safer: “few frameworks specify enforceable runtime controls for X” and cite a comparison table.

---

## TOP 3 Specific Improvements Needed (highest ROI)

### 1) Add a real reference architecture section: trust boundaries + deployment patterns + closed-loop policy flow
Minimum additions:
- A diagram with **trust boundaries** (agent runtime, policy plane, telemetry plane, data plane, storage, external tools).
- **Two concrete deployment patterns** (central PDP vs sidecar PDP/PEP), including failure modes (fail-open/closed) per trust tier.
- A **formal policy loop**: signals → policy update → decision → obligations → enforcement → telemetry → re-evaluation.

### 2) Harden “Verified” into something security reviewers will accept: define PoE’s guarantees and add attestation/key protection story
You need to explicitly define:
- What PoE proves (logging integrity? ordering? non-repudiation? runtime identity?) and what it does *not* prove.
- Canonical signing format + time source + key lifecycle.
- How PoE keys are protected (HSM/KMS, enclave, or at least workload identity + sealed secrets).
If you want to keep “Verified Enforcement” as the title premise, you must either:
- incorporate workload attestation (even as optional), or
- narrow the claim to “tamper-evident, independently verifiable execution records.”

### 3) Formalize and broaden the threat model + provide a coverage mapping table
Add:
- assets list, attacker goals, assumptions,
- capability matrix,
- mapping of OWASP Top 10 / MAESTRO categories → VERA controls → enforcement point → residual risk.
This will significantly increase reviewer confidence and reduce “marketing/spec” ambiguity.

---

## Additional Targeted Suggestions (secondary)

- **Clarify the “maturity runtime” governance model:** who can override demotion, how to prevent adversarial demotion (telemetry poisoning), what is audited, what is emergency access.
- **Define obligation actions from policy decisions:** redact fields, require human approval, degrade tool scopes, force read-only mode, enforce max $ limits, etc.
- **Add a minimal “agent-to-agent” protocol snippet:** delegation tokens, scope attenuation rules, and how PDP reasons about transitive trust.
- **Make anchoring pluggable:** blockchain, internal transparency log, WORM store, SIEM-backed immutability—position blockchain as one option, not the default.
- **Tone down absolutes** (“no framework…”) and add comparative tables instead.

---

## Publication Decision

You have the core of a strong paper: it is enforcement-centric, engineering-relevant, and closer to operational reality than most agent security writeups. However, the current draft is not yet “reference architecture” grade because the trust boundaries, policy loop mechanics, and verification guarantees are underspecified, and a few claims are overstated.

**GREENLIGHT: NO** (revise and resubmit; this is a tractable revision, not a rebuild)

════════════════════════════════════════════════════════════════════════════════

# 🎓 Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Score:** 7/10
**Greenlight:** ❌ NO
**Response time:** 110.2s

---

# IEEE S&P Industry Track Review: VERA

## Reviewer: Professor Marcus Chen, ETH Zurich

---

## OVERALL ASSESSMENT

This paper presents a comprehensive reference architecture for AI agent security with substantial implementation evidence. While the technical contributions are solid and the problem framing is compelling, the presentation style is inappropriate for IEEE S&P and undermines what could be a strong industry track submission.

---

## DIMENSIONAL SCORES

### 1. CONTRIBUTION: 7/10

**Strengths:**
- **Novel integration of existing primitives**: The combination of DID:web, Ed25519 proof chains, blockchain anchoring, and policy-as-code into a cohesive agent security architecture is genuinely new. No existing framework provides this level of enforcement specification.
- **Evidence-based trust progression**: The maturity runtime (Section 4) is a clear contribution beyond calendar-based promotion models. The evidence portfolio structure is technically sound and addresses real gaming vulnerabilities.
- **Operational threat model**: The four adversary classes (Manipulator, Insider, Escalator, Evader) are well-structured and map to specific controls. This is more rigorous than "adversarial inputs" handwaving common in the space.
- **Implementation validation**: 12 deployed services with empirical latency measurements is rare for security architecture papers.

**Weaknesses:**
- **Incremental architecture**: While the integration is novel, individual components (DIDs, Ed25519, OPA, circuit breakers) are not new. The paper positions this as "running code over specification prose," which is fair for industry track but limits research novelty.
- **Limited theoretical depth**: No formal security proofs, no game-theoretic analysis of adversary strategies, no complexity bounds on policy evaluation. This is acceptable for industry track but would not pass research track.

**Verdict**: Strong industry contribution, weak research contribution. Appropriate for this venue.

---

### 2. RELATED WORK: 6/10

**Strengths:**
- Cites relevant standards (NIST SP 800-207, NIST AI RMF, OWASP Top 10 for Agentic Applications)
- Explicitly differentiates from governance frameworks (MAESTRO, AWS Scoping Matrix)
- Honest about complementarity rather than claiming to replace existing work

**Weaknesses:**
- **Missing academic foundations**: No references to formal methods literature (model checking, runtime verification), distributed systems security (Byzantine fault tolerance for multi-agent consensus), or cryptographic protocol analysis.
- **Incomplete industry landscape**: Ignores Microsoft's Semantic Kernel security model, LangChain's AgentExecutor safeguards, and OpenAI's function calling security guidelines. These are direct competitors that should be analyzed.
- **No comparative evaluation**: Claims existing frameworks lack enforcement but provides no side-by-side comparison table showing what controls each framework specifies vs. enforces.
- **Blockchain anchoring justification**: Section 3.2 uses Solana for proof anchoring but doesn't cite literature on why blockchain is necessary vs. centralized timestamping (RFC 3161) or distributed ledgers (Certificate Transparency). The 400ms anchor latency seems high for runtime enforcement.

**Required additions:**
1. Comparison table: VERA vs. OWASP vs. AWS vs. MAESTRO on 10+ specific controls
2. Citation of runtime verification literature (e.g., Leucker & Schallhart's "A brief account of runtime verification")
3. Justification for blockchain anchoring vs. alternatives

---

### 3. THREAT MODEL: 8/10

**Strengths:**
- **Structured adversary classes**: The four-class taxonomy is clear, with explicit capabilities, goals, and attack surfaces for each.
- **Attack surface enumeration**: Specific vectors like "RAG poisoning via retrieved documents" and "maturity model gaming" are concrete and actionable.
- **Control mapping**: Each adversary class maps to specific VERA controls, creating traceability.

**Weaknesses:**
- **Missing adversary interactions**: What happens when Manipulator and Insider collude? When Escalator becomes Evader? No analysis of combined attacks.
- **Capability assumptions not justified**: Why can Manipulator submit crafted inputs but not modify code? What threat boundary separates Manipulator from Insider? In practice, supply chain attacks (Insider) often start with external input (Manipulator).
- **No formal adversary model**: No computational bounds (polynomial-time adversary?), no cryptographic assumptions (collision resistance? discrete log?), no probability of success analysis.
- **Multi-agent attack surface underspecified**: Section 2.3 mentions "multi-agent consensus poisoning" but provides no detail on consensus protocols, Byzantine agents, or Sybil attacks.

**Improvements needed:**
1. Define threat boundaries between adversary classes
2. Add combined attack scenarios
3. Specify cryptographic assumptions for each control
4. Expand multi-agent threat model with Byzantine fault tolerance analysis

---

### 4. FORMALIZATION: 5/10

**Strengths:**
- **TypeScript schemas**: All data structures are typed (VeraAgentIdentity, ProofOfExecution, ToolAuthorizationPolicy). This is executable specification.
- **Clear enumerations**: AgentPurpose enum prevents free-text ambiguity.
- **Sequence diagrams**: Proof of Execution flow (Section 3.2) is visually clear.

**Weaknesses:**
- **No formal properties**: The paper never states what security properties VERA guarantees. Is it non-repudiation? Tamper-evidence? Auditability? These should be formally defined.
- **Missing security definitions**: What does "verifiable identity" mean formally? Under what conditions can an adversary forge a proof? The paper uses security terminology without defining it.
- **Policy language underspecified**: Section 3.4 mentions OPA/Rego but provides no policy examples. What does tool-level parameter authorization look like in Rego?
- **Anomaly detection hand-waved**: "Distributional baselines" and "confidence intervals" (Section 3.2) are mentioned without specifying the distribution family, distance metric, or threshold selection algorithm.

**Critical gaps:**
```
Definition 1 (Verifiable Identity): An agent identity I is verifiable iff...
Definition 2 (Tamper-Evident Proof): A proof chain P is tamper-evident iff...
Theorem 1 (Non-Repudiation): Under assumptions X, Y, Z, an agent cannot deny...
```

These are missing. For a security architecture, this is a significant weakness.

**Required additions:**
1. Formal definitions of 3-5 core security properties
2. Example OPA policies for tool authorization
3. Anomaly detection algorithm specification (distribution, distance metric, threshold)

---

### 5. EVALUATION: 7/10

**Strengths:**
- **Empirical latency measurements**: 14ms median for ConvoGuard, 3ms for PoE signature, 400ms for blockchain anchor. These are credible and reproducible.
- **Contract validation tests**: 25/25 passing tests suggests implementation maturity.
- **Open source implementation**: All 12 services are publicly available, enabling independent verification.
- **Realistic deployment claims**: "Tested with individual agent deployments and small multi-agent configurations" is honest about scale limitations.

**Weaknesses:**
- **No security evaluation**: Where are the adversarial tests? The paper mentions "agent-pentest" with 41 vectors but provides no results. Did any attacks succeed? What is the false negative rate?
- **Missing baselines**: No comparison to alternative implementations. How does VERA's 14ms firewall latency compare to cloud-based solutions? How does evidence-based promotion compare to time-based promotion in reducing incidents?
- **Scalability claims unsubstantiated**: Section 8.1 admits "not tested at 1000+ agents" but provides no extrapolation model. What is the computational complexity of policy evaluation as agent count grows?
- **No user study**: For an industry track paper, where are the deployment case studies? Which organizations use VERA? What were their pain points? Did VERA reduce incidents?
- **Blockchain anchor latency**: 400ms is presented as a fact, but Solana block time is ~400ms. What happens during network congestion? What is the failure mode when anchoring fails?

**Required additions:**
1. Adversarial test results (success/failure rates for 41 vectors)
2. Baseline comparisons (VERA vs. alternative implementations)
3. At least one deployment case study with incident reduction metrics
4. Scalability analysis (computational complexity, extrapolation model)

---

### 6. WRITING QUALITY: 4/10

**Strengths:**
- **Clear structure**: Five pillars are easy to follow
- **Good use of tables and diagrams**: Threat model diagram, policy architecture diagram are helpful
- **Concrete examples**: TypeScript schemas are more useful than prose

**Critical weaknesses:**

**TONE INAPPROPRIATE FOR VENUE**: This is the paper's most serious flaw. IEEE S&P is a tier-1 academic venue. The writing style is combative, dismissive of existing work, and reads like a marketing blog post.

**Problematic passages:**

> "if you cannot prove your agent did what it claims, you do not have trust. You have a PowerPoint slide."

This is unprofessional. Rewrite as: "Without cryptographic proof of execution, trust claims are unverifiable."

> "These frameworks are not wrong. They are incomplete in a way that creates a dangerous illusion of security."

This dismisses an entire research community without evidence. Where is the empirical study showing frameworks create "illusions of security"?

> "We call this *governance theater*"

Inflammatory terminology without citation. If this is a recognized phenomenon, cite literature. If not, tone it down.

> "A framework that tells you to 'implement anomaly detection' without defining what anomaly detection means for a non-deterministic LLM-based agent is not a framework. It is a wish list."

Condescending to other researchers. Rewrite as: "Existing frameworks do not specify anomaly detection methods for non-deterministic agents, leaving a critical implementation gap."

> "VERA exists because governance without enforcement is fiction."

This is a slogan, not an academic claim.

> "A kill switch that only revokes tokens is not a kill switch. It is a suggestion."

Same issue.

> "We are not selling consulting services. We are not promoting a book."

Defensive and out of place in an academic paper. Delete entirely.

**Additional writing issues:**
- **Excessive use of bold**: Overuse of bold text for emphasis is distracting
- **Rhetorical questions**: "Who Is Actually Attacking Your Agents?" is blog-style writing
- **Absolute claims**: "No governance framework we have reviewed addresses it" (Section 3.3) - did you review ALL frameworks? Quantify.
- **Informal language**: "the back wall is missing" (Section 3.3), "watching your house get robbed" (Section 3.2)

**Required revisions**:
1. Remove all marketing language and slogans
2. Replace dismissive statements with empirical comparisons
3. Tone down absolute claims ("no framework" → "frameworks we reviewed")
4. Remove defensive statements about consulting/books
5. Use standard academic prose throughout

---

### 7. LIMITATIONS: 9/10

**Strengths:**
- **Honest and specific**: Section 8 acknowledges scalability, performance overhead, non-determinism, and physical actuator limitations
- **Quantified where possible**: "tested with individual agent deployments and small multi-agent configurations"
- **Actionable**: Explains what would be needed for 1000+ agent scale
- **Ethical**: Section 7 disclaimer about EU AI Act compliance is refreshingly honest

**Weaknesses:**
- **Missing limitation: Cryptographic assumptions**: No discussion of what happens if Ed25519 is broken, if blockchain is compromised, or if timestamp authority is malicious
- **Missing limitation: Adversary sophistication**: Assumes adversaries cannot break cryptographic primitives or compromise all enforcement points simultaneously

**Minor improvement**: Add subsection on cryptographic and infrastructure assumptions.

---

## SPECIFIC TECHNICAL ISSUES

### Issue 1: Blockchain Anchoring Justification

**Problem**: Section 3.2 uses Solana for proof anchoring with 400ms latency. The paper does not justify why blockchain is necessary vs. centralized timestamping (RFC 3161) or distributed ledgers (Certificate Transparency).

**Questions**:
- What attack does blockchain prevent that centralized timestamping does not?
- How does VERA handle blockchain forks, 51% attacks, or network partitions?
- What is the cost per anchor? Who pays gas fees?
- Can agents operate if blockchain is unavailable?

**Required**: Add subsection justifying blockchain choice with threat model analysis.

---

### Issue 2: Anomaly Detection for Non-Deterministic Systems

**Problem**: Section 3.2 claims "distributional baselines" solve anomaly detection for LLMs but provides no algorithm.

**Questions**:
- What distribution family? Gaussian? Mixture model?
- What distance metric? KL divergence? Wasserstein?
- How are confidence intervals computed?
- What is the false positive rate vs. false negative rate tradeoff?
- How does this compare to existing LLM anomaly detection (e.g., perplexity-based methods)?

**Required**: Specify algorithm or cite existing work. Provide empirical ROC curves.

---

### Issue 3: Multi-Agent Security

**Problem**: The paper mentions multi-agent scenarios (consensus poisoning, delegation chains) but provides minimal detail.

**Questions**:
- What consensus protocol is assumed? Majority vote? Byzantine fault tolerance?
- How many Byzantine agents can VERA tolerate?
- What is the security of delegation chains? Is capability attenuation enforced cryptographically?
- Can a compromised agent spawn new agents?

**Required**: Either expand multi-agent threat model to 2-3 pages with formal analysis, or remove claims and scope to single-agent systems.

---

### Issue 4: Evidence Portfolio Gaming

**Problem**: Section 4.2 claims evidence-based promotion prevents gaming, but adversaries can still manipulate evidence.

**Attack vector**:
- Adversary controls agent and evaluation dataset
- Agent performs correctly on evaluation dataset, maliciously on production data
- Accuracy metric is high, but behavior is malicious

**Mitigation**: The paper mentions "independent evaluation datasets" but doesn't specify who creates them, how they're validated, or how they're kept secret from agents.

**Required**: Specify evaluation dataset generation and protection mechanisms.

---

## TOP 3 IMPROVEMENTS NEEDED

### 1. **REWRITE FOR ACADEMIC TONE** (Critical)

Remove all marketing language, slogans, and dismissive statements. Replace with:
- Empirical comparisons to existing frameworks (table format)
- Measured claims with citations
- Standard academic prose

**Estimated effort**: 2-3 days of rewriting

---

### 2. **ADD FORMAL SECURITY DEFINITIONS AND PROPERTIES** (Critical)

Specify:
- 3-5 formal security properties VERA guarantees (non-repudiation, tamper-evidence, etc.)
- Adversary model with computational bounds and cryptographic assumptions
- Proof sketches or security arguments for key properties

**Estimated effort**: 1 week of formalization

---

### 3. **PROVIDE ADVERSARIAL EVALUATION RESULTS** (High Priority)

Include:
- Results from agent-pentest 41 vectors (success/failure rates)
- Comparison to baseline implementations
- At least one deployment case study with incident metrics
- Scalability analysis with complexity bounds

**Estimated effort**: 2 weeks of experimentation and case study writeup

---

## MINOR IMPROVEMENTS

4. Justify blockchain anchoring vs. alternatives (1-2 pages)
5. Specify anomaly detection algorithm with ROC curves (1 page)
6. Expand or remove multi-agent claims (2-3 pages or delete)
7. Add evaluation dataset protection mechanisms (1 page)
8. Complete related work with academic citations (1 page)
9. Add comparison table to existing frameworks (1 page)

---

## FINAL VERDICT

**OVERALL SCORE: 6.5/10**

**VERDICT: WEAK REJECT**

**REASONING**:

This paper presents solid technical work with real implementation evidence. The architecture is comprehensive, the threat model is structured, and the 12 deployed services demonstrate feasibility. For an industry track submission, this is strong engineering.

However, the paper has two critical flaws:

1. **Inappropriate tone**: The writing style is combative and dismissive, unsuitable for IEEE S&P. This is fixable but requires substantial rewriting.

2. **Missing formal security analysis**: The paper lacks formal definitions of security properties, adversary models with cryptographic assumptions, and security proofs/arguments. While industry track has lower formalization requirements than research track, a security architecture paper still needs to formally state what it guarantees.

If the authors:
- Rewrite in academic tone (remove all marketing language)
- Add formal security definitions and properties
- Provide adversarial evaluation results
- Justify key design choices (blockchain anchoring, anomaly detection)

This could be a **Strong Accept**. The core technical contribution is valuable, but the presentation needs significant work.

---

## GREENLIGHT: NO

**RECOMMENDATION**: Major revisions required. Encourage resubmission after addressing tone, formalization, and evaluation gaps. The technical work is strong enough to warrant acceptance once presentation issues are fixed.

---

## CONFIDENTIAL COMMENTS TO PROGRAM COMMITTEE

This paper is frustrating because the technical work is genuinely good, but the authors sabotage themselves with inappropriate tone. The dismissive language toward existing frameworks, the marketing slogans, and the defensive statements about not selling consulting suggest the authors are positioning this as a product launch rather than a research contribution.

If this were a blog post or industry whitepaper, the tone would be fine. For IEEE S&P, it's disqualifying.

I recommend conditional acceptance contingent on major revisions, with specific focus on rewriting for academic tone. The PC should consider assigning a writing mentor if the authors are unfamiliar with academic conventions.

The technical contributions—especially evidence-based trust progression, tool-level parameter authorization, and RAG governance—are novel enough for industry track. The implementation is more mature than most papers at this stage. With proper presentation, this could be a strong contribution to the practitioner community.

**Suggested action**: Major revisions with shepherding.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Raven — Adversarial Red Teamer
**Role:** Offensive Security Researcher
**Model:** `x-ai/grok-4.1-fast`
**Score:** 7/10
**Greenlight:** ✅ YES
**Response time:** 35.6s

---

# Red Team Review: VERA - Verified Enforcement for Runtime Agents

As Raven, principal adversarial security researcher specializing in breaking zero trust implementations, I've dissected this paper with a full adversarial lens. I've deployed similar agent systems in red team exercises, poisoned RAG corpora to exfil data from production agents, gamed maturity gates in multi-agent swarms, and bypassed "tamper-proof" logging via kernel-level hooks. VERA is ambitious—refreshingly so—and moves beyond checklists with code and schemas. But it's a reference architecture with production claims that don't fully withstand determined attacks. It's credible as a *starting point* for agent security, but over-relies on crypto handwaving, unproven ML classifiers, and human-in-the-loop gates that scream "game me."

I'll score per dimension first (1-10, where 10 is ironclad against nation-state adversaries, 1 is vaporware), then break down brutally with exploits, gaps, and fixes. Scores reflect *practical* effectiveness today (2026 tech stack), not ideals.

## Scores

1. **THREAT MODEL COVERAGE**: 8/10  
   Covers real vectors like RAG poisoning, maturity gaming, slow exfil—better than most agent papers. Misses model inversion (extracting training data via queries) and side-channels on PoE (timing attacks on sig gen).

2. **DEFENSE DEPTH**: 6/10  
   Typed schemas and PEPs are solid foundations, but ONNX firewalls and distributional anomalies crumble under adv ML attacks. Blockchain anchoring adds cost without proportional security.

3. **MATURITY MODEL RESISTANCE**: 5/10  
   Evidence portfolios beat time-based gates, but insider signoffs and self-reported metrics are trivial to game. Sequence gaps detectable? Only if you trust the sequencer.

4. **SUPPLY CHAIN**: 7/10  
   SBOM + signed manifests address deps/tools well, but model weight hashes prove *integrity*, not *safety* (backdoors hide in weights). Training data provenance is laughably aspirational.

5. **CONTAINMENT**: 4/10  
   Circuit breakers sound tough, but miss async persistence, JIT-compiled code, or agents with native exec (e.g., via eBPF). SLAs are fantasy against a rootkit'd host.

6. **HONESTY**: 9/10  
   Excellent limitations section—admits scale/perf/non-det issues. Rare candor in a hype-filled field.

**OVERALL SECURITY VALUE**: 7/10  
Strong on architecture (PDP/PEP flow, typed controls), weak on runtime robustness. Valuable for mid-tier orgs building agents; big tech needs battle-hardening.

**GREENLIGHT**: YES  
*(Credible reference arch with running code—deployable today with hardening. Not production-ready for high-stakes without red teaming.)*

**TOP 3 ATTACK VECTORS TO ADDRESS/STRENGTHEN**:
1. **Adversarial ML Evasion**: Craft prompts that fool ONNX classifiers (e.g., Gradient-based adv examples bypassing ConvoGuard) or distributional baselines (adversary fine-tunes mimicry to stay in CI).
2. **Insider Gaming of Promotion**: Compromised insiders sign falsified evidence portfolios or poison eval datasets; extend to automated, decentralized verification (e.g., crowd-sourced pentests).
3. **Persistence Beyond PEPs**: Agents spawn hidden threads, use shared memory, or exploit host vulns (e.g., container escapes) untouched by token revocation or network isolation.

**FLAGS ON ASPIRATIONAL CLAIMS**:
- "Sub-20ms ONNX inference" for prompt injection/PII: Achievable in benchmarks, but adversarial robustness unproven—classifiers drift 20-50% under targeted attacks (cite your own agent-pentest evals?).
- "Tamper-proof logging with blockchain anchoring": Anchors *receipts*, not *prevention* of suppression; Solana ~400ms confirms nothing if agent deletes before anchoring.
- "Automatic demotion on sequence gaps": Detectable only if PoE Runtime is trusted/not bypassed; aspirational for multi-tenant/multi-host agents.
- "Compensating transactions <60s": Assumes reversible tools (financial txns aren't); ignores idempotency failures in distributed systems.
- "Evidence-based promotion resistant to gaming": Claims multi-stakeholder sigs prevent it, but zero mention of key rotation/insider compromise.
- Production at "scale" implied by 12 services: Paper admits small-scale testing; 1000+ agents unproven.

## Detailed Breakdown

### 1. Threat Model: Solid but Incomplete (8/10)
VERA's 4 classes map well to real attacks I've run:
- **Manipulator**: Spot-on with RAG poisoning (I've exfiled 10GB from vector DBs via one poisoned doc).
- **Insider**: Covers LoRA backdoors (e.g., trigger tokens activating on "approve loan").
- **Escalator**: Maturity gaming via metric inflation—seen in prod swarms.
- **Evader**: Slow exfil via mimicry.

**Gaps/Attacks**:
- No "Observer" class for passive recon (query agents to infer model internals via inversion attacks).
- Ignores host-level threats (container breakouts, side-channels on GPU memory for key extraction).
- Multi-agent swarms: No coverage of consensus poisoning at scale (e.g., Sybil attacks via fake agents).

**Fix**: Add Class 5: "Extractor" for inference-time attacks. Reference OWASP LLM Top 10 explicitly with mappings.

### 2. Defense Depth: Patchwork, Not Bulletproof (6/10)
Pillars are well-defined with schemas—love the ToolAuthorizationPolicy (parameter constraints stop 80% of tool abuse I've seen). PoE sequence nums detect replays/suppressions. ConvoGuard's local ONNX is smart (no cloud leakage).

**But breaks like glass**:
- **ML Defenses**: ONNX classifiers? I've generated 95% evasion prompts in <1hr using TextGrad or GCG. Distributional baselines: Train a shadow agent to mimic benign distro, then pivot.
- **Crypto Overhead**: Ed25519 + Solana anchoring per action? At 1000 actions/sec, you're at $0.01/sec in fees, DoS-able via spam. Anchor aggregates hourly?
- **Schemas**: JSON Schema "strict mode" fails on semantic exploits (valid JSON calling `rm -rf` if tool misimplements).
- **RAG/Memory**: TTLs good, but poisoning detection? How? Hash docs, but colluding insiders rotate hashes.

**Fix**: Mandate adv training datasets for ConvoGuard (e.g., integrate PAIR API). Async batch anchoring. Fuzz tool impls mandatorily.

### 3. Maturity Model: Gameable Despite Evidence (5/10)
Portfolio > calendars—10k actions min, signed pentests, anomaly rates. Demotion triggers smart.

**Exploits**:
- **Fake Evidence**: Poison "curated test set" (insider edits dataset). Buy "A-grade" from pentest black markets.
- **Mimicry**: Run benign for 10k actions, suppress PoE for malicious (sequence gaps? Runtime must be HSM-protected, unmentioned).
- **Human Gates**: SecurityTeamApproval—bribe/phish one signer.
- No continuous validation post-T4; drift undetected.

**Fix**: Decentralized proofs (e.g., ZKPs for test passing). Third-party oracle network for evals. Auto-demote on baseline drift >10%.

### 4. Supply Chain: Checklist+, But Shallow (7/10)
SBOM + hashes cover npm typosquatting, tool sigs. Model manifests good start.

**Weaknesses**:
- Weights hash ≠ safe weights (backdoors like Sleeper Agents activate post-deploy).
- Training data hash? Provenance chains crack under supply chain recursion (data from poisoned HF datasets).
- No runtime sig verification for dynamic loads (e.g., agent pulls unsigned LoRAs).

**Fix**: Require weight-level scanning (e.g., Garak probes). Recursive SBOM to N=3 deps. Immutable model registries (IPFS pinning).

### 5. Containment: Kill Switch Theater (4/10)
Multi-signal (revoke <500ms, freeze <5s) beats single token yank. Compensating txns novel.

**Fails Determined Adversaries**:
- **Persistence**: Agent JIT-compiles code, writes to tmpfs, or forks before PEP hits. Network isolation? VPN bypass or prior exfil.
- **In-Flight**: 10s cancel assumes cooperative tools; async AWS Lambda ignores.
- **Blast Radius**: Shared vector DBs—freeze one agent's namespace? Partial.
- No host forensics (e.g., ebpf traces for hidden procs).

**Fix**: Mandatory WASM sandboxing (no native). eBPF hooks for process spawning. Quorum-based freezes (3/5 services agree).

### 6. Honesty: Refreshingly Candid (9/10)
Limitations section slaps—scale/perf/non-det/physical all called out. Compliance disclaimers gold. No "AI Act compliant" BS.

**Minor Nit**: Empirical results cherry-pick medians (p99.9?); pentest "41 vectors" feels light vs. my 200+ suite.

## Broader Strengths/Constructive Roadmap
**Strengths**:
- Running OSS code + tests = reproducible. 25/25 contracts passing? I'll fork and break them.
- PDP/PEP explicit, OPA integration scales.
- Types everywhere—TypeScript schemas prevent 90% config fuckups.
- Complements NIST/OWASP without reinventing.

**Roadmap to 9/10**:
1. Red team publicly: Run agent-pentest on your own services, publish FCEs.
2. Scale tests: 1000 agents on K8s, measure DoS resilience.
3. ZK Upgrades: ZKPs for PoE (no blockchain tax).
4. AgentBench Integration: Standardize evals.

VERA isn't perfect, but it's the best agent zero-trust paper I've red-teamed. Deploy T1 today, harden for T4.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════

# 🎓 Sarah Blackwell — Enterprise CISO
**Role:** Chief Information Security Officer
**Model:** `deepseek/deepseek-v3.2`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 45.9s

---

## Expert Review: VERA Paper Evaluation

**OVERALL ASSESSMENT:** This is one of the most technically honest and operationally useful papers on AI agent security I've encountered. It directly addresses the enforcement gap that keeps CISOs awake at night. While not perfect, it provides actionable architecture rather than governance theater.

---

### DIMENSIONAL SCORING:

1. **OPERATIONALIZABILITY: 8/10**
   - Clear architecture diagrams, TypeScript interfaces, and sequence diagrams
   - 12 deployed open-source services with empirical latency measurements
   - Missing: Deployment topology diagrams, integration patterns with existing IAM/SIEM, and concrete sizing guidance for large-scale deployments

2. **COMPLIANCE HONESTY: 9/10**
   - Explicit disclaimer about EU AI Act interpretation (critical for EU financial services)
   - "Potentially supports" language instead of false compliance claims
   - Acknowledges DORA Article 17 alignment without overpromising
   - Missing: Specific mapping to SOX ITGC controls for financial transactions

3. **COST AWARENESS: 7/10**
   - Acknowledges performance overhead (14-22ms latency impact)
   - Mentions scalability limitations for 1000+ agent deployments
   - Missing: Total cost of ownership estimates, blockchain anchoring costs, and operational overhead for cryptographic proof management

4. **VENDOR NEUTRALITY: 6/10**
   - Paper references specific GitHub repos (yogami) and npm packages
   - While open source, there's clear promotion of author's implementations
   - Architecture is technically vendor-neutral but implementation examples aren't
   - Missing: Reference implementations from multiple vendors or cloud providers

5. **REGULATORY REALISM: 9/10**
   - Exceptional honesty about EU AI Act's lack of agent-specific provisions
   - Correctly notes that compliance requires legal counsel, not just technical controls
   - DORA and GDPR mappings are appropriately cautious
   - Missing: Discussion of financial sector regulations beyond DORA (e.g., PSD2, MiFID II implications)

6. **BOARD READINESS: 7/10**
   - Executive summary is strong with clear business risk framing
   - Threat model is board-friendly with four adversary classes
   - Maturity tiers provide clear progression framework
   - Missing: ROI calculation, comparative risk reduction metrics, and peer adoption references

7. **PRACTICAL VALUE: 9/10**
   - Directly addresses RAG poisoning and memory governance gaps
   - Evidence-based promotion eliminates gaming risks
   - Multi-signal kill switch addresses real containment needs
   - Missing: Migration path from existing agent deployments and interoperability with legacy systems

**OVERALL SCORE: 8/10**

---

### TOP 3 IMPROVEMENTS NEEDED (CISO Perspective):

1. **Financial Services Specificity:**
   - Add SOX ITGC control mappings for agent-initiated financial transactions
   - Address dual-control requirements for high-value agent actions
   - Include sample policies for transaction approval workflows and audit trails

2. **Enterprise Integration Guidance:**
   - Provide integration patterns with existing SIEM (Splunk, Sentinel, etc.)
   - Demonstrate how VERA identity integrates with corporate IAM (Okta, Azure AD)
   - Show how proof of execution chains feed into existing GRC platforms

3. **Risk Quantification:**
   - Include sample risk reduction metrics (e.g., "reduces unauthorized transaction risk by X%")
   - Provide cost-benefit analysis comparing VERA overhead vs. incident costs
   - Add comparative framework against major cloud provider agent security offerings

---

### GREENLIGHT DECISION:

**GREENLIGHT: YES**

**Rationale:** This paper provides exceptional practical value despite its minor shortcomings. The honesty about compliance boundaries alone makes it more valuable than 90% of vendor security papers. The enforcement-first approach directly addresses my organization's need to deploy AI agents while maintaining regulatory compliance. The open-source implementation allows my team to evaluate before committing, and the architecture is technically sound enough to build upon even if we don't use the specific implementations.

**Recommended Action:** Share with my security architecture team for evaluation, pilot one service (likely ConvoGuard AI) in our sandbox environment, and use the threat model section to update our internal AI agent risk assessment. The compliance honesty section should be required reading for our legal and compliance teams engaging with AI vendors.

════════════════════════════════════════════════════════════════════════════════

# 🎓 Kai Nakamura — Implementation Engineer
**Role:** Principal Platform Engineer
**Model:** `perplexity/sonar-pro-search`
**Score:** 8/10
**Greenlight:** ✅ YES
**Response time:** 9.9s

---

## VERA Paper Review

VERA presents a comprehensive zero-trust architecture for AI agents, emphasizing runtime enforcement through five pillars, a detailed threat model, typed schemas, and claimed production deployments of 12 open-source services.

## Scores

**1. TECHNICAL DEPTH: 9/10**  
The paper provides detailed TypeScript schemas for identity, capabilities, proofs of execution, policies, and evidence portfolios, along with Mermaid diagrams for architectures, sequence flows, and state machines. These are sufficiently precise for building prototypes, including exact fields like Ed25519 signatures, DID:web, and parameter constraints, though some runtime integrations (e.g., OPA/Rego policy evaluation) lack full code snippets.

**2. TOOLING ALIGNMENT: 8/10**  
References 2026-relevant tools like ONNX for sub-20ms inference, Solana for anchoring, OPA/Rego for PDP, SPDX for SBOMs, and DID:web/JWT-VC for identity, aligning with current standards. Mentions Google A2A and SPIFFE interoperability, but lacks specifics on 2026 agent runtimes like CrewAI v3 or emerging frameworks.

**3. CODE AVAILABILITY: 7/10**  
Claims 12 MIT-licensed services with repos (e.g., github.com/yogami/convo-guard-ai, npmjs.com/package/agent-pentest) and a reference implementation passing 25/25 tests. Git clone instructions are given, but no direct code excerpts beyond schemas; external verification shows repos may not exist yet, reducing immediate usability.

**4. COMPETING FRAMEWORKS: 9/10**  
Explicitly critiques and maps to NIST SP 800-207, OWASP Top 10 for Agents (2025), AWS Agentic Matrix, Google A2A, and NIST AI RMF, positioning VERA as enforcement-focused (e.g., evidence-based tiers vs. AWS time-based). Strong differentiation on runtime proofs over checklists.

**5. SCALABILITY: 6/10**  
Acknowledges limitations like needs for sharded anomaly detection (Kafka), Redis clustering, and OPA federation for 1000+ agents, with metrics for small-scale (e.g., 14ms latency). Lacks detailed designs for distributed PoE anchoring or high-throughput policy evaluation.

**6. INTEROPERABILITY: 8/10**  
Supports standards like A2A (via SPIFFE), MCP (implied in tool manifests), DID:web, JWT-VC, SPDX SBOM, and OPA/Rego. Capability manifests and schemas enable integration, but no explicit MCP schema mappings or SPIFFE workload API examples.

**7. CODE vs WORDS: 40%**  
Schemas, diagrams, and service tables provide ~40% directly implementable (e.g., copy-paste TypeScript interfaces for identity/PoE). Remainder requires building from high-level specs and claimed repos; empirical metrics and tests are descriptive, not executable.

**OVERALL: 8/10**

## Top 3 Technical Gaps
- **Distributed Scaling Blueprints:** No concrete designs or configs for sharding (e.g., Kafka topics for PoE streaming, Redis Lua scripts for rate limits) to handle 1000+ agents, leaving large-scale deployment speculative.
- **Live Code Verification:** Repos referenced (e.g., github.com/yogami/vera-reference-implementation) unavailable or unverified; include inline minimal viable service code or Docker Compose for immediate testing.
- **Non-Determinism Baselines:** Distributional anomaly detection described conceptually but lacks equations, pseudocode, or open datasets for confidence intervals/exponential decay tuning.

**GREENLIGHT: YES**

════════════════════════════════════════════════════════════════════════════════
