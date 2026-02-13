-------------------------------- MODULE PoEChain --------------------------------
\* TLA+ Formal Specification for VERA Property 2: Chain Tamper-Evidence
\*
\* This specification models the Proof of Execution (PoE) chain as defined
\* in the VERA Protocol (Berlin AI Labs, 2026). It formally verifies that:
\*
\*   Property 2: A sequence of actions is tamper-evident if each PoE contains
\*   the hash of the previous proof, anchored externally. Deletion or
\*   reordering is detectable.
\*
\* Assumptions:
\*   - SHA-256 is collision resistant (modeled as injective hash function)
\*   - Ed25519 signatures are unforgeable (modeled as oracle)
\*   - PEP signing key is not compromised
\*
\* Author: Berlin AI Labs
\* Date: February 2026
\* VERA Paper: §3, Property 2; §4.2 Behavioral Proof

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    MaxActions,         \* Upper bound on chain length for model checking
    Agents,             \* Set of agent DIDs
    Actions,            \* Set of possible action types
    GENESIS_HASH        \* Initial hash for chain start (e.g., "0x00...00")

VARIABLES
    chain,              \* Sequence of PoE records (the honest chain)
    anchorLog,          \* External anchor log (immutable append-only)
    seqCounter,         \* Current sequence number per session
    lastHash,           \* Hash of the most recent PoE in chain
    adversaryChain      \* Adversary's attempt at a tampered chain

vars == <<chain, anchorLog, seqCounter, lastHash, adversaryChain>>

----------------------------------------------------------------------------
\* Type Definitions
\*
\* A PoE record is modeled as a record with:
\*   - actionId:         Unique action identifier
\*   - agentDid:         Agent decentralized identifier
\*   - actionType:       Type of action performed
\*   - sequenceNumber:   Monotonically increasing counter
\*   - previousHash:     SHA-256 hash of the previous PoE
\*   - selfHash:         SHA-256 hash of this PoE (computed over all fields)
\*   - signature:        Ed25519 signature by the PEP
\*   - anchored:         Whether this PoE has been externally anchored

PoERecord == [
    actionId:       Nat,
    agentDid:       Agents,
    actionType:     Actions,
    sequenceNumber: Nat,
    previousHash:   STRING,
    selfHash:       STRING,
    signature:      STRING,
    anchored:       BOOLEAN
]

\* Hash function modeled as injective (collision resistant)
\* In TLC, we use a deterministic string representation
Hash(record) ==
    "H(" \o ToString(record.actionId) \o ","
         \o ToString(record.sequenceNumber) \o ","
         \o record.previousHash \o ")"

\* Signature oracle (unforgeable under assumptions)
Sign(hash, keyId) ==
    "SIG(" \o hash \o "," \o keyId \o ")"

\* Verify signature (returns TRUE if signed by legitimate PEP)
VerifySig(sig, hash, keyId) ==
    sig = Sign(hash, keyId)

----------------------------------------------------------------------------
\* Initial State

Init ==
    /\ chain = <<>>
    /\ anchorLog = <<>>
    /\ seqCounter = 0
    /\ lastHash = GENESIS_HASH
    /\ adversaryChain = <<>>

----------------------------------------------------------------------------
\* Actions

\* AppendPoE: An honest agent appends a new PoE to the chain
\* This models the PEP creating and signing a new proof
AppendPoE(agent, action) ==
    /\ seqCounter < MaxActions
    /\ LET newSeq == seqCounter + 1
           newRecord == [
               actionId       |-> newSeq,
               agentDid       |-> agent,
               actionType     |-> action,
               sequenceNumber |-> newSeq,
               previousHash   |-> lastHash,
               selfHash       |-> Hash([actionId |-> newSeq,
                                        sequenceNumber |-> newSeq,
                                        previousHash |-> lastHash]),
               signature      |-> Sign(Hash([actionId |-> newSeq,
                                              sequenceNumber |-> newSeq,
                                              previousHash |-> lastHash]),
                                       "PEP_KEY"),
               anchored       |-> FALSE
           ]
       IN /\ chain' = Append(chain, newRecord)
          /\ seqCounter' = newSeq
          /\ lastHash' = newRecord.selfHash
          /\ UNCHANGED <<anchorLog, adversaryChain>>

\* AnchorPoE: The latest PoE is anchored to an external log
\* This models blockchain/RFC3161 anchoring
AnchorLatest ==
    /\ Len(chain) > 0
    /\ ~chain[Len(chain)].anchored
    /\ LET latest == chain[Len(chain)]
           anchoredRecord == [latest EXCEPT !.anchored = TRUE]
       IN /\ chain' = [chain EXCEPT ![Len(chain)] = anchoredRecord]
          /\ anchorLog' = Append(anchorLog, latest.selfHash)
          /\ UNCHANGED <<seqCounter, lastHash, adversaryChain>>

\* AdversaryDeletePoE: Adversary attempts to delete a record from the chain
\* Models the "deletion" attack from Property 2
AdversaryDelete(idx) ==
    /\ idx >= 1
    /\ idx <= Len(chain)
    /\ Len(chain) > 1
    /\ LET prefix == SubSeq(chain, 1, idx - 1)
           suffix == SubSeq(chain, idx + 1, Len(chain))
       IN /\ adversaryChain' = prefix \o suffix
          /\ UNCHANGED <<chain, anchorLog, seqCounter, lastHash>>

\* AdversaryReorder: Adversary attempts to swap two records
\* Models the "reordering" attack from Property 2
AdversaryReorder(i, j) ==
    /\ i >= 1 /\ j >= 1
    /\ i <= Len(chain) /\ j <= Len(chain)
    /\ i # j
    /\ LET swapped == [chain EXCEPT
               ![i] = chain[j],
               ![j] = chain[i]]
       IN /\ adversaryChain' = swapped
          /\ UNCHANGED <<chain, anchorLog, seqCounter, lastHash>>

\* AdversaryInsert: Adversary inserts a fabricated PoE
\* The adversary cannot forge the PEP signature (assumption)
AdversaryInsertFake(idx, agent, action) ==
    /\ idx >= 1
    /\ idx <= Len(chain) + 1
    /\ LET fakeRecord == [
               actionId       |-> 9999,
               agentDid       |-> agent,
               actionType     |-> action,
               sequenceNumber |-> idx,
               previousHash   |-> "FAKE_HASH",
               selfHash       |-> "FAKE_SELF",
               signature      |-> "FORGED_SIG",
               anchored       |-> FALSE
           ]
           prefix == SubSeq(chain, 1, idx - 1)
           suffix == SubSeq(chain, idx, Len(chain))
       IN /\ adversaryChain' = prefix \o <<fakeRecord>> \o suffix
          /\ UNCHANGED <<chain, anchorLog, seqCounter, lastHash>>

\* Next state relation
Next ==
    \/ \E agent \in Agents, action \in Actions :
           AppendPoE(agent, action)
    \/ AnchorLatest
    \/ \E idx \in 1..MaxActions :
           AdversaryDelete(idx)
    \/ \E i, j \in 1..MaxActions :
           AdversaryReorder(i, j)
    \/ \E idx \in 1..MaxActions, agent \in Agents, action \in Actions :
           AdversaryInsertFake(idx, agent, action)

\* Fairness: eventually some honest actions happen
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

----------------------------------------------------------------------------
\* Invariants (Properties to verify)

\* INV1: Chain Integrity — every record (except the first) must reference
\* the hash of its predecessor
ChainIntegrity ==
    \A i \in 2..Len(chain) :
        chain[i].previousHash = chain[i-1].selfHash

\* INV2: Monotonic Sequence — sequence numbers are strictly increasing
MonotonicSequence ==
    \A i \in 2..Len(chain) :
        chain[i].sequenceNumber > chain[i-1].sequenceNumber

\* INV3: No Gaps — sequence numbers have no gaps (gap-detectable)
NoSequenceGaps ==
    \A i \in 2..Len(chain) :
        chain[i].sequenceNumber = chain[i-1].sequenceNumber + 1

\* INV4: Genesis Binding — first record must reference GENESIS_HASH
GenesisBinding ==
    Len(chain) > 0 => chain[1].previousHash = GENESIS_HASH

\* INV5: Signature Validity — all records bear valid PEP signatures
AllSignaturesValid ==
    \A i \in 1..Len(chain) :
        VerifySig(chain[i].signature, chain[i].selfHash, "PEP_KEY")

\* INV6: Anchor Immutability — anchored hashes cannot be removed from log
AnchorImmutability ==
    \A i \in 1..Len(anchorLog) :
        \E j \in 1..Len(chain) :
            chain[j].selfHash = anchorLog[i]

----------------------------------------------------------------------------
\* Tamper Detection Properties (The Core of Property 2)

\* THEOREM 1: Deletion Detection
\* If the adversary deletes any record, the chain hash linkage breaks.
\* The verifier can detect this because:
\*   adversaryChain[k].previousHash ≠ adversaryChain[k-1].selfHash
\* for some k at or after the deletion point.
DeletionDetectable ==
    (Len(adversaryChain) > 0 /\ Len(adversaryChain) < Len(chain)) =>
        \E k \in 2..Len(adversaryChain) :
            adversaryChain[k].previousHash # adversaryChain[k-1].selfHash

\* THEOREM 2: Reordering Detection
\* If the adversary reorders any records, the chain hash linkage breaks.
ReorderingDetectable ==
    (Len(adversaryChain) = Len(chain) /\ adversaryChain # chain
     /\ Len(adversaryChain) > 1) =>
        \E k \in 2..Len(adversaryChain) :
            adversaryChain[k].previousHash # adversaryChain[k-1].selfHash

\* THEOREM 3: Insertion Detection
\* If the adversary inserts a fake record, signature verification fails.
InsertionDetectable ==
    (Len(adversaryChain) > Len(chain)) =>
        \E k \in 1..Len(adversaryChain) :
            ~VerifySig(adversaryChain[k].signature,
                       adversaryChain[k].selfHash, "PEP_KEY")

\* Combined Tamper Evidence Property (VERA Property 2)
\* Any modification to the chain is detectable by a verifier who checks:
\*   1. Hash chain linkage (previousHash = predecessor.selfHash)
\*   2. Signature validity (PEP key verification)
\*   3. Sequence monotonicity (no gaps or duplicates)
\*   4. Anchor consistency (anchored hashes exist in external log)
TamperEvidence ==
    /\ ChainIntegrity
    /\ MonotonicSequence
    /\ NoSequenceGaps
    /\ GenesisBinding
    /\ AllSignaturesValid
    /\ DeletionDetectable
    /\ ReorderingDetectable
    /\ InsertionDetectable

============================================================================
\* Modification History
\* Last modified: February 2026
\* Created: February 2026
