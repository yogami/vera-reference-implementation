#!/usr/bin/env node
/**
 * VERA Paper — Expert Consortium Review Loop
 *
 * Sends the VERA paper through 5 frontier LLMs for greenlight review.
 * Runs iteratively until all judges score >= 8/10 and greenlight publication.
 *
 * Expert Panel:
 * 1. Zero Trust Architect     → GPT-5.2
 * 2. Academic Peer Reviewer    → Claude Sonnet 4.5
 * 3. Adversarial Red Teamer    → Grok 4.1
 * 4. Enterprise CISO           → DeepSeek V3.2
 * 5. Implementation Engineer   → Perplexity Sonar Pro
 */

import * as fs from 'fs';
import * as path from 'path';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set');
    process.exit(1);
}

const PAPER_PATH = '/Users/user1000/.gemini/antigravity/brain/91fc0891-2dc8-4521-9fc1-26b0c2bca7c5/VERA_PAPER.md';
const OUTPUT_DIR = path.join(process.cwd(), 'vera-review-results');
const ROUND_ARG = parseInt(process.argv[2] || '1');

// ── EXPERT PANEL ───────────────────────────────────────────────────────
interface Judge {
    name: string;
    role: string;
    model: string;
    systemPrompt: string;
}

const JUDGES: Judge[] = [
    {
        name: 'Dr. Elena Volkov — Zero Trust Architect',
        role: 'Zero Trust Architecture Expert',
        model: 'openai/gpt-5.2',
        systemPrompt: `You are Dr. Elena Volkov, a Zero Trust architect with 20 years of experience implementing NIST 800-207 across Fortune 100 companies. You were on the original NIST Zero Trust working group.

Your task: Review this paper for publication quality. Evaluate EACH of these dimensions with a score 1 to 10:

1. ARCHITECTURAL COMPLETENESS: Does the reference architecture fully address Zero Trust for AI agents? PDP/PEP placement? Policy evaluation loops?
2. THREAT MODEL RIGOR: Are the adversary classes well-defined, comprehensive, and formally structured?
3. NOVELTY: Does this advance the state of the art beyond NIST 800-207 applied to agents?
4. FORMAL DEFINITIONS: Are schemas, interfaces, and control specifications precise enough to implement?
5. PRACTICAL VALUE: Would this help engineering teams build secure agent systems?

SCORING:
- Give each dimension a score from 1 to 10
- Give an OVERALL score from 1 to 10
- State GREENLIGHT (yes/no) — would you approve this for publication?
- List your TOP 3 specific improvements needed (if any)
- If you see any factual errors, contradictions, or misleading claims, flag them

Be constructive. This is a review for improvement, not rejection.`
    },
    {
        name: 'Prof. Marcus Chen — Academic Peer Reviewer',
        role: 'Academic Security Researcher',
        model: 'anthropic/claude-sonnet-4.5',
        systemPrompt: `You are Professor Marcus Chen, a tenured professor of Computer Security at ETH Zurich. Chief reviewer for IEEE S&P.

Your task: Review this paper for IEEE industry track quality. Score EACH dimension 1 to 10:

1. CONTRIBUTION: Is there a clear, novel contribution beyond applying existing concepts?
2. RELATED WORK: Does the paper properly cite and differentiate from prior art?
3. THREAT MODEL: Is the threat model formally structured with clear adversary classes?
4. FORMALIZATION: Are definitions precise? Are properties stated clearly?
5. EVALUATION: Is the empirical evaluation adequate? Are the implementation claims verifiable?
6. WRITING QUALITY: Is the prose clear, precise, and appropriate for the venue?
7. LIMITATIONS: Does the paper honestly acknowledge its limitations?

SCORING:
- Score each dimension 1 to 10
- Give OVERALL score 1 to 10
- Give VERDICT: Strong Accept / Accept / Weak Accept / Weak Reject / Reject
- State GREENLIGHT (yes/no) for publication
- List TOP 3 specific improvements needed

If the tone feels inappropriate for the venue, note which passages should be adjusted. Be rigorous but fair.`
    },
    {
        name: 'Raven — Adversarial Red Teamer',
        role: 'Offensive Security Researcher',
        model: 'x-ai/grok-4.1-fast',
        systemPrompt: `You are Raven, a principal adversarial security researcher. You break "zero trust" implementations for a living.

Your task: Red team this paper. Score EACH dimension 1 to 10:

1. THREAT MODEL COVERAGE: Does the 4-class adversary model cover real attack vectors?
2. DEFENSE DEPTH: Are the proposed controls actually effective against practical attacks?
3. MATURITY MODEL RESISTANCE: Is the evidence-based promotion system resistant to gaming?
4. SUPPLY CHAIN: Does the supply chain verification section address real attacks?
5. CONTAINMENT: Would the incident enforcement actually stop a determined attacker?
6. HONESTY: Does the paper accurately represent its own limitations?

SCORING:
- Score each dimension 1 to 10
- Give OVERALL security value score 1 to 10
- State GREENLIGHT (yes/no) — is the security architecture credible?
- List TOP 3 attack vectors the paper should address or strengthen
- Flag any claims that are aspirational rather than achievable

Be brutal but constructive.`
    },
    {
        name: 'Sarah Blackwell — Enterprise CISO',
        role: 'Chief Information Security Officer',
        model: 'deepseek/deepseek-v3.2',
        systemPrompt: `You are Sarah Blackwell, CISO of a large European financial services company. Under pressure to deploy AI agents while maintaining SOX/DORA/EU AI Act compliance.

Your task: Evaluate whether this paper would help your organization. Score EACH dimension 1 to 10:

1. OPERATIONALIZABILITY: Can my team implement this?
2. COMPLIANCE HONESTY: Is the compliance section honest rather than overselling?
3. COST AWARENESS: Does the paper acknowledge implementation costs?
4. VENDOR NEUTRALITY: Is the paper vendor-neutral or pushing specific products?
5. REGULATORY REALISM: Does it honestly handle EU AI Act / DORA / SOX implications?
6. BOARD READINESS: Can I present this to my board?
7. PRACTICAL VALUE: Would this actually protect my organization?

SCORING:
- Score each dimension 1 to 10
- Give OVERALL score 1 to 10
- State GREENLIGHT (yes/no) for publication
- List TOP 3 improvements needed from a CISO perspective`
    },
    {
        name: 'Kai Nakamura — Implementation Engineer',
        role: 'Principal Platform Engineer',
        model: 'perplexity/sonar-pro-search',
        systemPrompt: `You are Kai Nakamura, a Principal Platform Engineer who has built agent infrastructure at scale.

Your task: Evaluate whether this paper is implementable. Score EACH dimension 1 to 10:

1. TECHNICAL DEPTH: Are the schemas, interfaces, and architectures detailed enough to build from?
2. TOOLING ALIGNMENT: Does the implementation reference current 2026 tooling?
3. CODE AVAILABILITY: Does the paper back claims with available open source code?
4. COMPETING FRAMEWORKS: How does this compare to alternatives (AWS, Google A2A, LangChain)?
5. SCALABILITY: Does the architecture address scale challenges?
6. INTEROPERABILITY: Does it work with standard protocols (A2A, MCP, SPIFFE)?
7. CODE vs WORDS: What percentage is implementable directly from the paper?

SCORING:
- Score each dimension 1 to 10
- Give OVERALL score 1 to 10
- State GREENLIGHT (yes/no) for publication
- List TOP 3 technical gaps that should be addressed`
    }
];

// ── QUERY ENGINE ───────────────────────────────────────────────────────
async function queryJudge(judge: Judge, paperContent: string, round: number): Promise<{
    judge: string; model: string; role: string; content: string; elapsed: string;
    greenlight: boolean; overallScore: number;
}> {
    console.log(`\n🎓 Querying: ${judge.name}`);
    console.log(`   Model: ${judge.model}`);
    const startTime = Date.now();

    try {
        console.log(`   ⏳ Sending request...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://berlinailabs.de',
                'X-Title': 'VERA Paper Review'
            },
            body: JSON.stringify({
                model: judge.model,
                messages: [
                    { role: 'system', content: judge.systemPrompt },
                    {
                        role: 'user',
                        content: `Review Round ${round}. Please review the following paper:\n\n${paperContent}\n\nProvide your complete expert review. Be thorough, specific, and constructive. End your review with a clearly labeled GREENLIGHT: YES or GREENLIGHT: NO.`
                    }
                ],
                max_tokens: 8000,
                temperature: 0.7
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        console.log(`   📡 Got HTTP ${response.status}`);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorBody}`);
        }

        const rawText = await response.text();
        console.log(`   📦 Response body: ${rawText.length} chars`);

        const data = JSON.parse(rawText) as any;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const content = data.choices?.[0]?.message?.content || 'No response';

        // Parse greenlight and score
        const greenlightMatch = content.match(/GREENLIGHT:\s*(YES|NO)/i);
        const greenlight = greenlightMatch ? greenlightMatch[1].toUpperCase() === 'YES' : false;

        const overallMatch = content.match(/OVERALL[^:]*:\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i);
        const overallScore = overallMatch ? parseFloat(overallMatch[1]) : 0;

        console.log(`   ✅ Responded in ${elapsed}s (${content.length} chars)`);
        console.log(`   📊 Score: ${overallScore}/10 | Greenlight: ${greenlight ? '✅ YES' : '❌ NO'}`);

        return { judge: judge.name, model: judge.model, role: judge.role, content, elapsed, greenlight, overallScore };
    } catch (err: any) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`   ❌ Failed (${elapsed}s):`, err.message || err);
        return { judge: judge.name, model: judge.model, role: judge.role, content: `ERROR: ${err.message}`, elapsed, greenlight: false, overallScore: 0 };
    }
}

// ── MAIN ───────────────────────────────────────────────────────────────
async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Read the paper
    if (!fs.existsSync(PAPER_PATH)) {
        console.error(`❌ Paper not found: ${PAPER_PATH}`);
        process.exit(1);
    }
    const paperContent = fs.readFileSync(PAPER_PATH, 'utf-8');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  🔬 VERA PAPER — EXPERT CONSORTIUM REVIEW');
    console.log(`  📋 Round: ${ROUND_ARG}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Paper: VERA: Verified Enforcement for Runtime Agents`);
    console.log(`  Author: Berlin AI Labs`);
    console.log(`  Judges: ${JUDGES.length}`);
    JUDGES.forEach(j => console.log(`    → ${j.name} [${j.model}]`));
    console.log('');

    const results: Awaited<ReturnType<typeof queryJudge>>[] = [];
    for (const judge of JUDGES) {
        const result = await queryJudge(judge, paperContent, ROUND_ARG);
        results.push(result);

        // Save individual result
        const safeName = judge.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        fs.writeFileSync(
            path.join(OUTPUT_DIR, `round${ROUND_ARG}_${safeName}.md`),
            `# ${result.judge}\n**Role:** ${result.role}\n**Model:** \`${result.model}\`\n**Response time:** ${result.elapsed}s\n**Score:** ${result.overallScore}/10\n**Greenlight:** ${result.greenlight ? '✅ YES' : '❌ NO'}\n\n---\n\n${result.content}`
        );
    }

    // Summary
    const allGreenlit = results.every(r => r.greenlight);
    const avgScore = (results.reduce((s, r) => s + r.overallScore, 0) / results.length).toFixed(1);

    const summary = `
═══════════════════════════════════════════════════════
  VERA PAPER REVIEW — ROUND ${ROUND_ARG} RESULTS
═══════════════════════════════════════════════════════

  Average Score: ${avgScore}/10
  All Greenlit:  ${allGreenlit ? '✅ YES — PAPER APPROVED' : '❌ NO — REVISIONS NEEDED'}

  Individual Results:
${results.map(r => `    ${r.greenlight ? '✅' : '❌'} ${r.judge}: ${r.overallScore}/10`).join('\n')}

═══════════════════════════════════════════════════════
`;
    console.log(summary);

    // Save compiled report
    const compiled = results.map(r =>
        `# 🎓 ${r.judge}\n**Role:** ${r.role}\n**Model:** \`${r.model}\`\n**Score:** ${r.overallScore}/10\n**Greenlight:** ${r.greenlight ? '✅ YES' : '❌ NO'}\n**Response time:** ${r.elapsed}s\n\n---\n\n${r.content}\n\n${'═'.repeat(80)}\n`
    ).join('\n');

    const reportPath = path.join(OUTPUT_DIR, `ROUND_${ROUND_ARG}_REPORT.md`);
    fs.writeFileSync(reportPath, `# VERA Paper — Expert Review Round ${ROUND_ARG}\n\n**Date:** ${new Date().toISOString()}\n**Average Score:** ${avgScore}/10\n**All Greenlit:** ${allGreenlit ? 'YES' : 'NO'}\n\n${'═'.repeat(80)}\n\n${compiled}`);

    console.log(`  📋 Full report: ${reportPath}`);

    if (!allGreenlit) {
        // Extract improvement suggestions
        console.log('\n📝 IMPROVEMENTS NEEDED (extract from individual reports above)\n');
        console.log(`  Run next round: OPENROUTER_API_KEY="..." npx tsx scripts/vera-paper-review.ts ${ROUND_ARG + 1}\n`);
    }
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection:', reason);
    process.exit(1);
});
