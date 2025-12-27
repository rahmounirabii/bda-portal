/**
 * Audit Trail Entity
 *
 * Exports for comprehensive audit logging system
 */

// Types
export * from './audit.types';

// Services
export * from './audit.service';

// Named exports for convenience
export {
  logAuditEvent,
  getUserAuditHistory,
  getExamAuditTrail,
  getSuspiciousActivities,
  getUserEventSummary,
  // Convenience functions
  logUserLogin,
  logUserLogout,
  logExamStarted,
  logExamSubmitted,
  logAnswerSaved,
  logSuspiciousActivity,
  logProfileUpdate,
  logConsentAccepted,
  logHonorCodeAccepted,
  logIdentityVerificationSubmitted,
} from './audit.service';
