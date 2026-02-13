/**
 * VERA Enforcement Latency Benchmark
 * 
 * Measures the actual enforcement overhead per action to support
 * the latency claims in the VERA Paper §7 and IETF draft §7.
 * 
 * Measures:
 *   1. JCS Canonicalization
 *   2. Ed25519 Signature Generation
 *   3. SHA-256 Chain Hash
 *   4. Full Enforcement Loop (combined)
 * 
 * Hardware: Apple M2 Pro, 12-core CPU, 32GB RAM
 * Runtime: Node.js v20 LTS
 * 
 * Run: npx tsx benchmarks/enforcement-latency.ts
 */

import * as crypto from 'crypto';
import nacl from 'tweetnacl';
import canonicalize from 'canonicalize';

const ITERATIONS = 1000;

// ─── Setup ───
const keyPair = nacl.sign.keyPair();

function createSamplePoE(seqNum: number, previousHash: string) {
    return {
        actionId: crypto.randomUUID(),
        agentDid: 'did:web:agent.berlinailabs.de',
        signerType: 'enforcer',
        signatureAlgorithm: 'Ed25519',
        action: {
            type: 'tool_call',
            target: 'database.read',
            parameters: { query: 'SELECT * FROM users WHERE id = 42', limit: 100 },
            resultHash: crypto.createHash('sha256')
                .update('sample_result_' + seqNum).digest('hex'),
        },
        context: {
            sessionId: '550e8400-e29b-41d4-a716-446655440000',
            sequenceNumber: seqNum,
            previousProofHash: previousHash,
            triggeredBy: 'user_request',
        },
        timestamp: {
            agentClock: new Date().toISOString(),
        },
    };
}

// ─── Benchmark Functions ───

function benchmarkCanonicalization(): number[] {
    const latencies: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
        const poe = createSamplePoE(i, 'GENESIS');
        const start = performance.now();
        canonicalize(poe);
        latencies.push(performance.now() - start);
    }
    return latencies;
}

function benchmarkSigning(): number[] {
    const latencies: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
        const poe = createSamplePoE(i, 'GENESIS');
        const canonical = canonicalize(poe) || '';
        const msg = new TextEncoder().encode(canonical);
        const start = performance.now();
        nacl.sign.detached(msg, keyPair.secretKey);
        latencies.push(performance.now() - start);
    }
    return latencies;
}

function benchmarkHashing(): number[] {
    const latencies: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
        const poe = createSamplePoE(i, 'GENESIS');
        const canonical = canonicalize(poe) || '';
        const start = performance.now();
        crypto.createHash('sha256').update(canonical).digest('hex');
        latencies.push(performance.now() - start);
    }
    return latencies;
}

function benchmarkFullEnforcementLoop(): number[] {
    const latencies: number[] = [];
    let previousHash = 'GENESIS';

    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();

        // Step 1: Create PoE
        const poe = createSamplePoE(i, previousHash);

        // Step 2: Canonicalize
        const canonical = canonicalize(poe) || '';

        // Step 3: Hash (chain link)
        const selfHash = crypto.createHash('sha256').update(canonical).digest('hex');

        // Step 4: Sign
        nacl.sign.detached(
            new TextEncoder().encode(canonical),
            keyPair.secretKey
        );

        previousHash = selfHash;
        latencies.push(performance.now() - start);
    }
    return latencies;
}

// ─── Statistics ───

function stats(latencies: number[]) {
    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
        min: sorted[0].toFixed(3),
        p50: sorted[Math.floor(sorted.length * 0.5)].toFixed(3),
        p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(3),
        p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(3),
        max: sorted[sorted.length - 1].toFixed(3),
        mean: (sum / sorted.length).toFixed(3),
    };
}

// ─── Run ───

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║    VERA Enforcement Latency Benchmark                   ║');
console.log('║    Hardware: Apple M2 Pro | Node.js v20 LTS             ║');
console.log(`║    Iterations: ${ITERATIONS} per component                        ║`);
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Warm up JIT
benchmarkFullEnforcementLoop();

console.log('Component                 | p50 (ms) | p95 (ms) | p99 (ms) | max (ms)');
console.log('─────────────────────────-+-─────────+──────────+──────────+─────────');

const canon = stats(benchmarkCanonicalization());
console.log(`JCS Canonicalization      | ${canon.p50.padStart(8)} | ${canon.p95.padStart(8)} | ${canon.p99.padStart(8)} | ${canon.max.padStart(8)}`);

const sign = stats(benchmarkSigning());
console.log(`Ed25519 Signature         | ${sign.p50.padStart(8)} | ${sign.p95.padStart(8)} | ${sign.p99.padStart(8)} | ${sign.max.padStart(8)}`);

const hash = stats(benchmarkHashing());
console.log(`SHA-256 Chain Hash        | ${hash.p50.padStart(8)} | ${hash.p95.padStart(8)} | ${hash.p99.padStart(8)} | ${hash.max.padStart(8)}`);

const full = stats(benchmarkFullEnforcementLoop());
console.log(`Full Enforcement Loop     | ${full.p50.padStart(8)} | ${full.p95.padStart(8)} | ${full.p99.padStart(8)} | ${full.max.padStart(8)}`);

console.log('\n✓ All latency measurements in milliseconds');
console.log(`✓ Full enforcement p50: ${full.p50}ms, p99: ${full.p99}ms`);
console.log(`✓ Claim validation: sub-20ms enforcement overhead = ${parseFloat(full.p99) < 20 ? 'VERIFIED ✓' : 'FAILED ✗'}`);
