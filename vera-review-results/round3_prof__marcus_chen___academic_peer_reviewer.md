# Prof. Marcus Chen — Academic Peer Reviewer
**Role:** Academic Security Researcher
**Model:** `anthropic/claude-sonnet-4.5`
**Response time:** 181.0s
**Score:** 8/10
**Greenlight:** ❌ NO

---

# IEEE S&P Industry Track Review: VERA

## Reviewer: Professor Marcus Chen, ETH Zurich

---

## EXECUTIVE SUMMARY

This paper presents VERA, a zero trust reference architecture for AI agents with formal threat modeling, cryptographic proof of execution, and evidence-based trust progression. The work addresses a genuine enforcement gap in current AI agent security frameworks and backs claims with 12 deployed open-source services and empirical measurements.

**Strengths:** Novel contribution in operationalizing governance frameworks, rigorous threat model with four adversary classes, honest limitations disclosure, running code with reproducible results, excellent technical depth.

**Weaknesses:** Some formalization could be tightened, compliance mapping overstates regulatory applicability, performance evaluation lacks comparative baselines, multi-agent security underspecified.

**Overall Assessment:** Strong Accept with minor revisions. This represents solid systems security engineering with practical impact. The work would benefit IEEE S&P's industry track by bridging the gap between academic rigor and deployment reality.

---

## DIMENSIONAL SCORING

### 1. CONTRIBUTION: 8/10

**Novel Elements:**
- **Evidence-based maturity runtime** (Section 5): This is genuinely novel. Replacing calendar-based trust with cryptographically-signed evidence portfolios addresses a real vulnerability in current frameworks. The promotion criteria are measurable and verifiable.
- **Tool-parameter authorization** (Section 4.4): Existing zero trust frameworks stop at resource-level access. VERA's parameter-level constraints (e.g., `limit <= 1000` in database queries) are a meaningful extension for non-deterministic agents.
- **Pluggable anchor abstraction** (Section 4.2.2): The comparison table between blockchain, transparency logs, and WORM storage provides practical guidance missing from academic work that assumes a single trust model.

**Incremental Elements:**
- PDP/PEP architecture is standard NIST 800-207, adapted but not fundamentally novel
- Ed25519 signatures for non-repudiation are well-established
- Distributional anomaly detection (SWDB algorithm) applies known GMM techniques to a new domain

**Gap Analysis (Section 1.2):** The comparative framework table is useful but slightly unfair. Comparing VERA (a full implementation) against OWASP (a threat taxonomy) and AWS Scoping (a risk matrix) conflates different abstraction levels. A fairer comparison would be against deployed systems like Google's BeyondCorp or Netflix's Zero Trust architecture.

**Recommendation:** Reframe Table 1.2 to compare "enforcement capabilities" rather than "controls," and add a column for "deployment complexity" where VERA's 12-service architecture would show higher operational overhead than simpler frameworks.

**Score Justification:** 8/10 reflects genuine novelty in evidence-based trust and tool-parameter authorization, offset by incremental application of known techniques elsewhere.

---

### 2. RELATED WORK: 7/10

**Comprehensive Coverage:**
Section 11 covers appropriate foundations (NIST 800-207, OWASP Top 10, MAESTRO, AWS Scoping, NIST AI RMF). The paper correctly positions VERA as an enforcement layer complementing governance frameworks rather than replacing them.

**Missing Citations:**

1. **Adversarial ML for agents:** The paper mentions prompt injection and jailbreaking but doesn't cite foundational work:
   - Perez & Ribeiro (2022) on prompt injection taxonomy
   - Wei et al. (2023) on jailbreak attack patterns
   - The cited [Zhong et al., 2023; Zou et al., 2023] for RAG poisoning are mentioned but not in the references section

2. **Runtime verification:** Leucker & Schallhart (2009) is cited but the connection to LTL/CTL temporal logics could be made explicit. VERA's PoE chain is essentially a finite trace in runtime verification terms.

3. **Byzantine fault tolerance:** Section 10.5 acknowledges multi-agent BFT limitations but doesn't cite Lamport's foundational work or recent BFT consensus protocols (PBFT, HotStuff) that could inform future extensions.

4. **Trusted execution environments:** The paper mentions SGX/SEV for PDP isolation (Section 4.0) but doesn't cite Intel SGX papers or discuss attestation protocols (RATS, DICE).

**Differentiation:**
The paper clearly differentiates VERA from prior work. However, the claim that "none define where policies are evaluated, where they are enforced" (Section 1) is too strong. NIST 800-207 explicitly defines PDP/PEP placement. The accurate claim is that prior frameworks don't specify PDP/PEP placement *for non-deterministic AI agents*.

**Recommendation:** Add missing citations, soften the "none define" claim to "none specify for AI agents," and expand the runtime verification connection.

**Score Justification:** 7/10 reflects solid coverage with notable gaps in adversarial ML and TEE literature.

---

### 3. THREAT MODEL: 9/10

**Exceptional Rigor:**
Section 2's four-adversary-class model with capability matrices is excellent. The structured presentation (Table 2.2) makes threat boundaries explicit and falsifiable. The mapping to assumptions A1-A4 shows clear reasoning about what each adversary can and cannot do.

**Strengths:**
- **Capability matrix** (Table 2.2): Binary capabilities are clearly defined. The "Partial" entries (e.g., Escalator's write-to-memory) are explained in the text.
- **Combined attack scenarios** (Table 2.3): Multi-adversary compositions are often overlooked. The "Poisoned RAG + prompt injection" scenario is realistic and well-mitigated.
- **OWASP mapping** (Section 2.2): Each adversary class maps to specific OWASP Top 10 categories, making the threat model actionable.

**Weaknesses:**

1. **Assumption A3 (Trusted Key Store):** The paper states "agent runtime cannot exfiltrate the signing key" but doesn't specify *how* this is enforced. Is it HSM-backed? Sealed secrets? The Deployment Pattern B mentions "hardened sidecar" but the isolation mechanism (container, microVM, TEE) is listed as options without guidance on which provides sufficient isolation for each trust tier.

   **Specific issue:** A compromised agent runtime in the same container as the sidecar could use `/proc` filesystem access or shared memory to extract keys from the sidecar process. The paper needs to specify minimum isolation requirements (e.g., T3+ agents require microVM or TEE isolation, not just container separation).

2. **Assumption A4 (Anchor Integrity):** "At least one anchor backend is honest" is vague. For blockchain anchoring, this is well-defined (51% honest consensus). For transparency logs, what constitutes "honest"? A single witness? Threshold witnesses? The Rekor integration should specify witness requirements.

3. **Evader adversary (Section 2.2.4):** The capability to "inject false telemetry signals" is listed but the defense ("requires compromise of 3+ independent signal sources") isn't formally specified. What are the three sources? Are they structurally independent (different codebases, different operators)?

**Recommendation:**
- Add Table 2.4: "Minimum Isolation Requirements per Trust Tier"
- Specify witness/consensus requirements for each anchor backend
- Define the three independent telemetry sources explicitly

**Score Justification:** 9/10 reflects excellent structure with minor specification gaps in assumptions.

---

### 4. FORMALIZATION: 7/10

**Definitions (Section 3.2):**

**Definition 1 (Action Non-Repudiation):** Well-formed. The canonical representation via JCS (RFC 8785) is specified. The verification predicate is clear.

**Issue:** The definition states "the agent cannot deny having performed `a`" but the limitation (Section 10.3) acknowledges a compromised runtime could sign actions it didn't perform. This creates a semantic gap: non-repudiation of *signing* vs. non-repudiation of *execution*.

**Fix:** Restate Definition 1 as "Signature Non-Repudiation" and add Definition 1b for "Execution Non-Repudiation" (requires external verification, out of scope for VERA core but supported via cross-referencing).

**Definition 2 (Chain Tamper-Evidence):** The hash-chaining construction is standard (similar to blockchain). The claim "any deletion, reordering, or insertion produces a detectable gap" is correct under A2.

**Issue:** Multi-replica deployments (mentioned in the definition) create a problem. If each replica has an independent chain identified by `(agentDid, instanceId)`, how is cross-replica ordering established? The definition says "via anchor timestamps" but anchor timestamps have precision limits (Solana: ~400ms, which is 400 million CPU cycles). Two replicas could perform conflicting actions within the same anchor timestamp window.

**Fix:** Specify a total ordering protocol for multi-replica scenarios (e.g., vector clocks, Lamport timestamps, or requiring a single designated signer per agent DID).

**Definition 3 (Policy Enforcement Completeness):** This is more of an operational property than a formal definition. "Every agent action passes through at least one PEP" is not verifiable from the PoE chain alone—it requires knowing the complete set of possible actions.

**Issue:** The detection mechanism ("actions observed at the tool level without corresponding PEP evaluation records") assumes tools are instrumented to log independently of the agent. This is a deployment requirement, not a property of VERA itself.

**Fix:** Restate as "PEP Coverage Requirement" (a deployment constraint) rather than "Completeness" (a provable property). Add a verification procedure: "PEP coverage is verified by comparing PoE action types against registered tool manifests."

**Definition 4 (Containment Bound):** The financial damage bound is useful and measurable. The formula is clear.

**Issue:** The bound assumes synchronous enforcement, but the caveat about in-flight operations undermines the bound's utility. If a compromised agent can queue 10,000 transactions before the circuit breaker activates, the bound is violated.

**Fix:** Add a constraint: "For agents with T3+ trust tier, in-flight transaction queues must be bounded by `max_inflight_tx ≤ hourly_value_cap / per_tx_value_cap`."

**Security Arguments (Section 3.3):**
The arguments are informal proofs, which is appropriate for a systems paper. However, they could be tightened:

- "By A1, an adversary who does not possess the agent's private key cannot forge a valid signature" — this is correct but should cite Bernstein et al. (2012) explicitly here, not just in A1.
- "By A2, an adversary cannot produce a modified action sequence that preserves all hash chain links" — this should specify the adversary's computational bound (e.g., "no polynomial-time adversary").

**Recommendation:**
- Tighten Definitions 1-4 per above
- Add computational bounds to security arguments
- Separate provable properties from deployment requirements

**Score Justification:** 7/10 reflects solid definitions with precision gaps and conflation of properties vs. requirements.

---

### 5. EVALUATION: 8/10

**Empirical Results (Section 7.1):**
The measurements are specific, reproducible, and honest. Latency numbers include p99 (not just median), which is critical for tail-latency-sensitive systems. The methodology is stated (e.g., "DistilBERT ONNX, single CPU core, batch=1").

**Strengths:**
- **Adversarial test results** (Section 7.2): Transparent disclosure of bypassed vectors is excellent. Many papers hide failed tests. The 90.2% block rate is respectable, and the four bypassed vectors are explained with mitigations.
- **Contract validation tests:** 25/25 passing tests with E2E coverage is good for a reference implementation.
- **Latency breakdown:** The 14ms prompt injection detection is fast enough for most use cases. The comparison between local key (3ms) and KMS (15-50ms) for PoE signing helps deployment decisions.

**Weaknesses:**

1. **No comparative baselines:** The paper doesn't compare VERA's performance against alternative approaches. For example:
   - How does the 14ms ONNX firewall compare to cloud-based prompt injection APIs (e.g., OpenAI Moderation API)?
   - How does VERA's PoE overhead compare to standard audit logging (e.g., CloudTrail, Splunk)?
   - What is the throughput degradation? (Latency is reported, but not max actions/second)

2. **Scalability claims unsupported:** Section 10.1 admits "scaling to 1000+ agents" is untested. The largest deployment mentioned is 12 services. What is the actual scale tested? 10 agents? 100? The evaluation should report the maximum tested configuration.

3. **Anomaly detection evaluation:** The SWDB algorithm (Section 4.2.3) specifies false positive rates (FPR ≤ 5% for T1, ≤ 0.01% for T4) but Section 7.1 doesn't report measured FPR. Was the algorithm validated on real agent traces? What is the false negative rate?

4. **Memory/RAG governance results:** Section 4.3 specifies extensive memory governance controls (per-document ACL, source trust scoring, poisoning detection) but Section 7 doesn't report any measurements. Were these controls evaluated? What is the latency overhead of source trust scoring?

**Missing Experiments:**
- **Failure mode testing:** What happens when the PDP is unavailable? The paper specifies fail-closed for T3/T4 agents but doesn't report measured downtime or false denial rates.
- **Anchor backend comparison:** Table 4.2.2 lists five anchor backends with latency estimates. Were these measured in the deployed system, or are they theoretical?
- **Multi-agent scenarios:** Section 10.5 acknowledges multi-agent limitations but doesn't report any multi-agent experiments.

**Recommendation:**
- Add comparative baselines (at minimum, compare VERA vs. no enforcement)
- Report measured FPR/FNR for anomaly detection
- Add throughput measurements (actions/second)
- Specify maximum tested scale explicitly
- Report anchor backend latencies from actual deployments

**Score Justification:** 8/10 reflects solid measurements with notable gaps in baselines, scalability, and anomaly detection validation.

---

### 6. WRITING QUALITY: 8/10

**Clarity:**
The prose is clear, technical, and appropriate for an industry track venue. The paper uses concrete examples (Rego policies, TypeScript schemas) that make abstract concepts tangible. The mermaid diagrams (Sections 1, 4.0) are helpful.

**Structure:**
The paper is well-organized. The progression from problem (Section 1) → threat model (Section 2) → properties (Section 3) → architecture (Section 4) → maturity (Section 5) → implementation (Section 7) is logical.

**Tone Issues:**

The paper's tone occasionally veers into marketing language inappropriate for IEEE S&P:

1. **Abstract:** "When they go wrong, the blast radius is not a misclassified image. It is exfiltrated customer data, unauthorized financial transactions, and cascading failures across downstream systems."
   - **Issue:** This is evocative but imprecise. What is the measured blast radius? How many incidents occurred?
   - **Fix:** "AI agents that interact with production systems can cause data breaches, unauthorized transactions, and cascading failures when compromised. We measured X incidents across Y deployments, with Z median damage."

2. **Section 1:** "Trust without proof is aspiration. VERA makes it architecture."
   - **Issue:** This is a tagline, not a technical claim.
   - **Fix:** Remove or move to a blog post. End with "VERA provides verifiable enforcement through cryptographic proofs and explicit PEP placement."

3. **Section 13 (Conclusion):** "The gap is enforcement: the architectural layer between governance guidance and running infrastructure that makes controls verifiable."
   - **Issue:** This repeats the abstract without adding new information.
   - **Fix:** Summarize contributions numerically: "VERA contributes: (1) a four-adversary threat model, (2) evidence-based trust progression, (3) tool-parameter authorization, (4) 12 open-source enforcement services, and (5) empirical validation with 90.2% adversarial test block rate."

**Jargon:**
Some terms are used without definition:
- "Blast radius" (abstract) — define or replace with "damage scope"
- "Boiling frog attacks" (Section 4.2.3) — define or cite
- "WORM storage" (Table 4.2.2) — spell out "Write-Once-Read-Many"

**Precision:**
- Section 1.1: "These frameworks provide useful guidance" — which frameworks? Name them.
- Section 4.3: "few existing frameworks address" — quantify "few" or say "none we surveyed"
- Section 9: "Compliance is organization-specific, requires legal counsel" — this is correct but could be stated more directly: "VERA does not provide legal compliance. Organizations must engage legal counsel."

**Recommendation:**
- Remove marketing language from abstract, section 1, and conclusion
- Define jargon on first use
- Replace vague quantifiers ("few," "many") with specific counts
- Tighten conclusion to summarize contributions numerically

**Score Justification:** 8/10 reflects clear technical writing with tone issues that need adjustment for venue appropriateness.

---

### 7. LIMITATIONS: 10/10

**Exemplary Honesty:**
Section 10 is one of the best limitations sections I've reviewed. It acknowledges:
- Scalability untested beyond small deployments (10.1)
- Performance overhead unacceptable for sub-millisecond loops (10.2)
- PoE provides signature integrity, not execution correctness (10.3)
- Distributional baselines have false positives and can be evaded (10.4)
- Multi-agent BFT is unsolved (10.5)
- Quantum computing breaks Ed25519 (10.6)
- Physical actuators out of scope (10.7)

**Specific Strengths:**
- **Section 10.3** distinguishes non-repudiation of signing vs. execution. Many papers would hide this gap.
- **Section 10.4** admits "we do not claim VERA solves the alignment problem." This is refreshingly honest.
- **Section 7.2** discloses all four bypassed adversarial vectors with explanations.

**Minor Issue:**
Section 10.5 says "Organizations deploying agent swarms should extend VERA with BFT-specific protocols" but doesn't provide guidance on *which* BFT protocols are compatible. A sentence like "VERA's evidence portfolios can integrate with PBFT or HotStuff consensus by including quorum signatures in promotion approvals" would help.

**Score Justification:** 10/10. This is how limitations should be written.

---

## OVERALL SCORE: 8/10

**Justification:**
VERA makes a solid contribution to AI agent security by operationalizing governance frameworks with enforceable controls and verifiable proofs. The threat model is rigorous, the implementation is real, and the limitations are honestly disclosed. The work would benefit IEEE S&P's industry track by demonstrating how academic security principles (zero trust, runtime verification, cryptographic proofs) apply to a rapidly-evolving domain (AI agents).

Deductions:
- Formalization could be tightened (Definition 3, multi-replica ordering)
- Evaluation lacks comparative baselines and scalability data
- Tone needs adjustment for academic venue
- Related work missing key citations (adversarial ML, TEE)

---

## VERDICT: **STRONG ACCEPT**

This paper represents high-quality systems security engineering with practical impact. The deployment of 12 open-source services and transparent disclosure of bypassed tests demonstrate maturity beyond typical "we propose a framework" papers.

**Conditional acceptance:** Require minor revisions addressing:
1. Tone adjustments (remove marketing language from abstract/conclusion)
2. Tighten Definition 3 (PEP completeness) and add multi-replica ordering protocol
3. Add comparative baselines to evaluation (at minimum, VERA vs. no enforcement)
4. Specify minimum isolation requirements for Assumption A3 per trust tier
5. Add missing citations (adversarial ML, TEE, BFT)

These revisions are achievable in a shepherd revision cycle.

---

## TOP 3 SPECIFIC IMPROVEMENTS

### 1. **Add Comparative Baselines to Evaluation (Section 7)**

**Current state:** Section 7.1 reports VERA's absolute performance (14ms latency, 90.2% block rate) without comparing to alternatives.

**Required addition:**
Create Table 7.3: "Comparative Performance vs. Baselines"

| Metric | VERA | Cloud API (e.g., OpenAI Moderation) | Standard Audit Log | No Enforcement |
|:---|:---|:---|:---|:---|
| Prompt injection detection latency | 14ms | 250-800ms (network RTT) | N/A | N/A |
| PII detection precision | 97.3% | [Measure or cite] | N/A | N/A |
| PoE overhead per action | 3-50ms | N/A | 1-5ms (CloudTrail) | 0ms |
| Adversarial block rate | 90.2% | [Measure or cite] | 0% | 0% |
| Throughput (actions/sec) | [Measure] | [Measure] | [Measure] | [Baseline] |

**Why this matters:** Without baselines, reviewers cannot assess whether VERA's 14ms latency is acceptable. Is it 10x faster than alternatives? 10x slower? The paper needs to show VERA's overhead is justified by security gains.

**Implementation:** Run agent-pentest against: (1) VERA-protected agent, (2) agent with cloud-based moderation, (3) agent with standard logging, (4) unprotected agent. Report block rates and latencies for each.

---

### 2. **Specify Minimum Isolation Requirements for Key Protection (Section 2.1, Assumption A3)**

**Current state:** Assumption A3 states "Key store provides hardware or attested isolation" but doesn't specify what level of isolation is required for each trust tier.

**Required addition:**
Add Table 2.5: "Minimum Key Isolation Requirements per Trust Tier"

| Trust Tier | Minimum Isolation | Rationale | Example Technologies |
|:---|:---|:---|:---|
| T1 (Observer) | Container separation | Read-only, low risk | Docker with read-only filesystem |
| T2 (Advisor) | Process isolation + sealed secrets | Approval required, medium risk | Kubernetes sealed secrets, systemd PrivateTmp |
| T3 (Operator) | MicroVM or HSM | Acts autonomously, high risk | Firecracker, AWS Nitro Enclaves, Cloud KMS |
| T4 (Autonomous) | HSM with remote attestation | Self-directed, critical risk | AWS CloudHSM, Azure Dedicated HSM, SGX with DCAP |

**Why this matters:** The current spec allows a T4 agent to run in the same container as its PDP/PEP, which violates the trust boundary model. A compromised T4 agent in a shared container could use `/proc` filesystem access to extract keys from the sidecar process. The paper needs to specify that T3+ agents require hardware isolation (microVM or HSM), not just process isolation.

**Text change in Section 4.0, Deployment Pattern B:**
Replace: "Isolation options: Container with read-only filesystem + no network egress (minimum); gVisor/Firecracker microVM (recommended); SGX/SEV enclave with remote attestation (highest assurance)"

With: "Isolation requirements by trust tier: T1-T2 may use container isolation; T3 requires microVM (Firecracker, gVisor) or HSM; T4 requires HSM with remote attestation (SGX DCAP, AWS Nitro). Container-only isolation is insufficient for T3+ due to shared kernel attack surface."

---

### 3. **Tighten Formalization of Multi-Replica Ordering (Section 3.2, Definition 2)**

**Current state:** Definition 2 states "For multi-replica deployments, each replica maintains an independent PoE chain identified by `(agentDid, instanceId)`. Cross-replica ordering is established via anchor timestamps."

**Problem:** Anchor timestamps have limited precision. Solana timestamps are accurate to ~400ms. Two replicas could perform conflicting actions (e.g., transferring the same funds to different recipients) within the same 400ms window, and the anchor timestamp wouldn't establish a total order.

**Required addition:**
Add Definition 2b: "Multi-Replica Total Ordering"

**Definition 2b (Multi-Replica Total Ordering):** For an agent deployed across N replicas, a total ordering of actions is established by:
1. **Designated signer:** Only one replica (the elected leader) signs PoE records. Non-leader replicas forward actions to the leader for signing. Leader election uses a consensus protocol (Raft, Paxos) with bounded failover time.
2. **Vector clocks:** Each replica maintains a vector clock `VC[instanceId]`. PoE records include the full vector clock. Total order is established by vector clock comparison (Lamport's happens-before relation).
3. **Anchor-based sequencing:** All replicas anchor to the same external sequencer (e.g., Solana, transparency log). Actions are ordered by `(anchorBlockHeight, anchorTxIndex, instanceId)`.

**Constraint:** For agents with T3+ trust tier performing financial operations, designated signer (option 1) is required to prevent double-spend races. For read-heavy agents, vector clocks (option 2) are sufficient.

**Why this matters:** Without a specified total ordering protocol, VERA's PoE chain doesn't prevent double-spend attacks in multi-replica deployments. This is a critical gap for financial operations (the paper's own example in Section 4.4).

**Text change in Section 3.2:**
Replace: "Cross-replica ordering is established via anchor timestamps."

With: "Cross-replica ordering requires one of three protocols: designated signer (required for T3+ financial ops), vector clocks (sufficient for read-heavy), or anchor-based sequencing (see Definition 2b)."

---

## ADDITIONAL MINOR CORRECTIONS

1. **Section 1.2, Table:** Add "Deployment Complexity" column showing VERA requires 12 services vs. simpler frameworks.

2. **Section 2.2.1, Manipulator:** Clarify that "schema validation" includes recursive decode-and-scan (to catch base64-encoded payloads mentioned in Section 7.2).

3. **Section 3.3, Security Arguments:** Add computational bounds: "no polynomial-time adversary" for collision resistance.

4. **Section 4.2.3, SWDB Algorithm:** Report measured FPR/FNR in Section 7.1.

5. **Section 7.1, Anchor confirmation:** Specify whether 400ms is measured on mainnet or testnet, and during what congestion level.

6. **Section 9, Compliance Mapping:** Add disclaimer: "This table provides guidance only. VERA does not certify compliance. Engage legal counsel."

7. **Section 11, Related Work:** Add citations for Perez & Ribeiro (2022), Wei et al. (2023), Intel SGX papers, PBFT/HotStuff.

8. **References:** Add the missing [Zhong et al., 2023; Zou et al., 2023] citations mentioned in Section 4.3.

---

## FINAL RECOMMENDATION

This is a strong industry track paper that advances the state of practice in AI agent security. The deployment of 12 open-source services, transparent disclosure of limitations, and rigorous threat modeling demonstrate maturity beyond typical proposals.

**Accept with minor revisions** (shepherd required to verify changes).

The three major improvements (comparative baselines, isolation requirements, multi-replica ordering) are essential for publication. The additional minor corrections improve precision but are not blocking.

**Expected impact:** This work will influence how organizations deploy AI agents in production. The open-source reference implementation provides a concrete starting point, and the evidence-based maturity model addresses a real gap in current practice.

**Audience fit:** Perfect for IEEE S&P industry track. Combines academic rigor (formal threat model, security properties) with practical engineering (running code, deployment patterns, honest performance numbers).

---

## GREENLIGHT: **YES**

**Conditional on minor revisions addressing the top 3 improvements.**

The paper makes a solid contribution, is technically sound, and honestly discloses limitations. The required revisions are achievable in a shepherd cycle and will significantly strengthen the work.

I recommend acceptance and look forward to seeing this work presented at the conference.

---

**Reviewed:** February 2026  
**Reviewer:** Prof. Marcus Chen, ETH Zurich  
**Confidence:** High (this is directly in my area of expertise)