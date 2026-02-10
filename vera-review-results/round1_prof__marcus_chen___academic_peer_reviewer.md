# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 110.2s
**Score:** 7/10
**Greenlight:** ❌ NO

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