/**
 * Consent & Honor Code Entity
 *
 * Exports for consent tracking and honor code acceptance
 */

// Types
export * from './consent.types';

// Services
export * from './consent.service';
export * from './honor-code.service';

// Named exports for convenience
export { logConsent, hasUserConsented, getUserConsentSummary, hasAllRequiredConsents, withdrawConsent } from './consent.service';
export { logHonorCodeAcceptance, hasAcceptedHonorCode, needsHonorCodeForExam, getHonorCodeHistory } from './honor-code.service';
