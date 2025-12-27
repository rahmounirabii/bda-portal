/**
 * Support Feature - Barrel Export
 *
 * Support Tickets feature for user assistance
 */

// User Components
export { TicketList } from './components/TicketList';
export { TicketCard, TicketCardSkeleton } from './components/TicketCard';
export { TicketDetail } from './components/TicketDetail';
export { CreateTicketForm } from './components/CreateTicketForm';
export { TicketChat } from './components/TicketChat';

export type { TicketListProps } from './components/TicketList';
export type { TicketCardProps } from './components/TicketCard';
export type { TicketDetailProps } from './components/TicketDetail';
export type { CreateTicketFormProps } from './components/CreateTicketForm';
export type { TicketChatProps } from './components/TicketChat';

// Admin Components
export { TicketDashboard } from './admin/TicketDashboard';
export { TicketQueue } from './admin/TicketQueue';
export { TicketAssignment } from './admin/TicketAssignment';
export { TemplateManager } from './admin/TemplateManager';

export type { TicketDashboardProps } from './admin/TicketDashboard';
export type { TicketQueueProps } from './admin/TicketQueue';
export type { TicketAssignmentProps } from './admin/TicketAssignment';
export type { TemplateManagerProps } from './admin/TemplateManager';
