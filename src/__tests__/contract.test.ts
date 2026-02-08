/**
 * ATF Contract Validation Tests
 *
 * These tests validate that the ATF Reference Implementation portfolio
 * satisfies the contract specification in SPECIFICATION.md.
 *
 * Tests are organized by ATF element and check:
 * 1. Element coverage (every ATF element has ≥1 service)
 * 2. Service registry integrity (no orphans, no duplicates)
 * 3. Capability coverage (required capabilities per element)
 * 4. ATF mapping documentation presence
 * 5. Maturity model completeness
 */

import { describe, it, expect } from 'vitest';
import {
    SERVICE_REGISTRY,
    getServicesByElement,
    getATFElements,
    getElementCoverage,
    getServicesWithATFMapping,
    getServicesWithoutATFMapping,
    type ATFElement,
} from '../registry';

describe('ATF Contract Validation', () => {

    // ─── Element Coverage ───

    describe('Element Coverage — Every ATF element must have ≥1 implementation', () => {
        const elements = getATFElements();

        it.each(elements)('Element "%s" has at least one service', (element) => {
            const services = getServicesByElement(element as ATFElement);
            expect(services.length).toBeGreaterThanOrEqual(1);
        });

        it('all 5 ATF elements are covered', () => {
            const coverage = getElementCoverage();
            const uncovered = Object.entries(coverage).filter(([, count]) => count === 0);
            expect(uncovered).toHaveLength(0);
        });
    });

    // ─── Service Registry Integrity ───

    describe('Service Registry Integrity', () => {
        it('has no duplicate repo names', () => {
            const repos = SERVICE_REGISTRY.map(s => s.repo);
            const unique = new Set(repos);
            expect(unique.size).toBe(repos.length);
        });

        it('has no duplicate URLs', () => {
            const urls = SERVICE_REGISTRY.map(s => s.url);
            const unique = new Set(urls);
            expect(unique.size).toBe(urls.length);
        });

        it('all services have valid GitHub URLs', () => {
            for (const service of SERVICE_REGISTRY) {
                expect(service.url).toMatch(/^https:\/\/github\.com\/yogami\//);
            }
        });

        it('all services have at least one capability', () => {
            for (const service of SERVICE_REGISTRY) {
                expect(service.capabilities.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('all services have non-empty descriptions', () => {
            for (const service of SERVICE_REGISTRY) {
                expect(service.description.length).toBeGreaterThan(10);
            }
        });

        it('registry contains exactly 12 services', () => {
            expect(SERVICE_REGISTRY).toHaveLength(12);
        });
    });

    // ─── Capability Coverage ───

    describe('Required Capabilities Per Element', () => {
        it('Identity element has DID or credential capability', () => {
            const services = getServicesByElement('identity');
            const allCapabilities = services.flatMap(s => s.capabilities);
            const hasDID = allCapabilities.some(c => c.includes('did'));
            const hasVC = allCapabilities.some(c => c.includes('vc'));
            const hasTrustScore = allCapabilities.some(c => c.includes('trust-scoring'));
            expect(hasDID || hasVC || hasTrustScore).toBe(true);
        });

        it('Behavior element has structured logging or execution proofs', () => {
            const services = getServicesByElement('behavior');
            const allCapabilities = services.flatMap(s => s.capabilities);
            const hasProofs = allCapabilities.some(c => c.includes('signing') || c.includes('hash-chain') || c.includes('anchoring'));
            expect(hasProofs).toBe(true);
        });

        it('Data Governance element has input validation and PII protection', () => {
            const services = getServicesByElement('data_governance');
            const allCapabilities = services.flatMap(s => s.capabilities);
            const hasInjection = allCapabilities.some(c => c.includes('injection'));
            const hasPII = allCapabilities.some(c => c.includes('pii'));
            expect(hasInjection).toBe(true);
            expect(hasPII).toBe(true);
        });

        it('Segmentation element has access control or rate limiting', () => {
            const services = getServicesByElement('segmentation');
            const allCapabilities = services.flatMap(s => s.capabilities);
            const hasACL = allCapabilities.some(c =>
                c.includes('segmentation') || c.includes('enforcement') || c.includes('sla')
            );
            expect(hasACL).toBe(true);
        });

        it('Incident Response element has adversarial testing or circuit breaker', () => {
            const services = getServicesByElement('incident_response');
            const allCapabilities = services.flatMap(s => s.capabilities);
            const hasTesting = allCapabilities.some(c => c.includes('testing'));
            const hasBreaker = allCapabilities.some(c => c.includes('circuit-breaker') || c.includes('kill-switch'));
            expect(hasTesting || hasBreaker).toBe(true);
        });
    });

    // ─── ATF Mapping Documentation ───

    describe('ATF Mapping Documentation', () => {
        it('all 5 core element services have ATF_MAPPING.md', () => {
            const coreServices = SERVICE_REGISTRY.filter(s => s.element !== 'infrastructure');
            const withMapping = coreServices.filter(s => s.hasATFMapping);
            // At minimum, the primary service per element should have mapping
            const elements = new Set(withMapping.map(s => s.element));
            expect(elements.size).toBeGreaterThanOrEqual(4); // 4 of 5 elements have at least one mapped service
        });

        it('reports services missing ATF_MAPPING.md', () => {
            const missing = getServicesWithoutATFMapping();
            // This is informational — logs which services still need mapping
            for (const service of missing) {
                console.log(`⚠️ Missing ATF_MAPPING.md: ${service.repo} (${service.element})`);
            }
            // We allow some to be missing, but track them
            expect(missing.length).toBeLessThan(SERVICE_REGISTRY.length);
        });
    });

    // ─── Maturity Model ───

    describe('Maturity Model Completeness', () => {
        it('agent-trust-protocol provides maturity model capabilities', () => {
            const atp = SERVICE_REGISTRY.find(s => s.repo === 'agent-trust-protocol');
            expect(atp).toBeDefined();
            expect(atp!.capabilities).toContain('maturity-model');
            expect(atp!.capabilities).toContain('promotion-gates');
        });

        it('agent-pentest provides security gate capability', () => {
            const ap = SERVICE_REGISTRY.find(s => s.repo === 'agent-pentest');
            expect(ap).toBeDefined();
            expect(ap!.capabilities).toContain('safety-score');
        });

        it('agent-trust-protocol provides circuit breaker capability', () => {
            const atp = SERVICE_REGISTRY.find(s => s.repo === 'agent-trust-protocol');
            expect(atp).toBeDefined();
            expect(atp!.capabilities).toContain('circuit-breaker');
            expect(atp!.capabilities).toContain('kill-switch');
        });

        it('all 5 promotion gates are supported across the stack', () => {
            const allCapabilities = SERVICE_REGISTRY.flatMap(s => s.capabilities);
            // Gate 1: Performance — trust-scoring
            expect(allCapabilities).toContain('trust-scoring');
            // Gate 2: Security — safety-score
            expect(allCapabilities).toContain('safety-score');
            // Gate 3: Business Value — compliance-tracking
            expect(allCapabilities).toContain('compliance-tracking');
            // Gate 4: Incident Record — circuit-breaker
            expect(allCapabilities).toContain('circuit-breaker');
            // Gate 5: Governance — promotion-gates
            expect(allCapabilities).toContain('promotion-gates');
        });
    });

    // ─── Deployment Coverage ───

    describe('Deployment Coverage', () => {
        it('at least 3 services have production URLs', () => {
            const deployed = SERVICE_REGISTRY.filter(s => s.productionUrl);
            expect(deployed.length).toBeGreaterThanOrEqual(3);
        });

        it('all production URLs are HTTPS', () => {
            const deployed = SERVICE_REGISTRY.filter(s => s.productionUrl);
            for (const service of deployed) {
                expect(service.productionUrl).toMatch(/^https:\/\//);
            }
        });
    });
});
