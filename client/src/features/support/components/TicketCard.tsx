import { MessageCircle, Clock, User, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import type { TicketWithMeta } from '@/entities/support';
import {
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_CATEGORY_ICONS,
  formatTicketNumber,
  getTimeElapsed,
} from '@/shared/constants/ticket.constants';
import * as Icons from 'lucide-react';

/**
 * TicketCard Component
 *
 * Displays a support ticket preview card
 * Used in ticket lists and browsing interfaces
 */

export interface TicketCardProps {
  /**
   * Ticket data to display
   */
  ticket: TicketWithMeta;

  /**
   * Callback when user clicks on ticket
   */
  onTicketClick?: (ticketId: string) => void;

  /**
   * Whether the card is in a loading state
   */
  isLoading?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Compact mode (smaller card)
   */
  compact?: boolean;

  /**
   * Show in Arabic
   */
  isArabic?: boolean;
}

export const TicketCard = ({
  ticket,
  onTicketClick,
  isLoading = false,
  className,
  compact = false,
  isArabic = false,
}: TicketCardProps) => {
  const handleClick = () => {
    if (!isLoading && onTicketClick) {
      onTicketClick(ticket.id);
    }
  };

  // Get category icon dynamically
  const IconName = TICKET_CATEGORY_ICONS[ticket.category];
  const CategoryIcon = (Icons as any)[IconName] || Icons.HelpCircle;

  // Time elapsed
  const timeElapsed = getTimeElapsed(ticket.updated_at);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-white transition-all cursor-pointer',
        {
          'border-gray-200 hover:border-blue-300 hover:shadow-md': !isLoading,
          'border-gray-100 opacity-60 cursor-not-allowed': isLoading,
          'p-5': !compact,
          'p-3': compact,
        },
        className
      )}
      data-testid="ticket-card"
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Header Row */}
      <div className="mb-3 flex items-start justify-between gap-4">
        {/* Ticket Number & Category */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CategoryIcon className="h-4 w-4 text-gray-400 shrink-0" />
          <span
            className={cn('font-mono font-semibold text-gray-900', {
              'text-sm': !compact,
              'text-xs': compact,
            })}
          >
            {formatTicketNumber(ticket.ticket_number)}
          </span>
          {ticket.unread_count > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {ticket.unread_count}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <StatusBadge
          variant={ticket.status}
          size={compact ? 'sm' : 'md'}
          withDot
          className="shrink-0"
        >
          {TICKET_STATUS_LABELS[ticket.status]}
        </StatusBadge>
      </div>

      {/* Subject */}
      <h3
        className={cn('font-semibold text-gray-900 line-clamp-2 mb-2', {
          'text-base': !compact,
          'text-sm': compact,
        })}
        title={ticket.subject}
      >
        {ticket.subject}
      </h3>

      {/* Metadata Row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Category Badge */}
        <StatusBadge size="sm" variant="default">
          {TICKET_CATEGORY_LABELS[ticket.category]}
        </StatusBadge>

        {/* Priority Badge */}
        <StatusBadge variant={ticket.priority} size="sm">
          {TICKET_PRIORITY_LABELS[ticket.priority]}
        </StatusBadge>
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Message Count */}
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>
              {ticket.message_count}{' '}
              {isArabic ? 'رسالة' : compact ? 'msg' : 'messages'}
            </span>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeElapsed}</span>
          </div>

          {/* Assigned Agent (if any) */}
          {ticket.assigned_agent && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span className="truncate max-w-[100px]">
                {ticket.assigned_agent.first_name}
              </span>
            </div>
          )}
        </div>

        {/* Arrow Icon */}
        <ArrowRight
          className={cn(
            'text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600',
            {
              'h-4 w-4': !compact,
              'h-3 w-3': compact,
            }
          )}
        />
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-500/20 transition-colors pointer-events-none" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
};

TicketCard.displayName = 'TicketCard';

/**
 * TicketCardSkeleton - Loading skeleton for TicketCard
 */
export const TicketCardSkeleton = ({ compact = false }: { compact?: boolean }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white animate-pulse',
        {
          'p-5': !compact,
          'p-3': compact,
        }
      )}
      data-testid="ticket-card-skeleton"
    >
      {/* Header skeleton */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full shrink-0" />
      </div>

      {/* Subject skeleton */}
      <div className="mb-2 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
      </div>

      {/* Badges skeleton */}
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-24 bg-gray-200 rounded-full" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

TicketCardSkeleton.displayName = 'TicketCardSkeleton';
