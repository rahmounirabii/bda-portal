/**
 * Email Entity
 *
 * Exports for email notification system
 */

// Types
export * from './email.types';

// Services
export * from './email.service';

// Named exports for convenience
export {
  queueEmail,
  getEmailQueue,
  getPendingEmails,
  updateEmailStatus,
  getEmailStatistics,
  replaceTemplateVariables,
} from './email.service';
