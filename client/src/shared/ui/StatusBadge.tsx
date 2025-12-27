import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

/**
 * StatusBadge Component
 *
 * Reusable badge component for displaying status, priority, or category indicators
 * with consistent styling across the application
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
  {
    variants: {
      variant: {
        // Ticket Status variants
        new: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
        in_progress: 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
        waiting_user: 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100',
        resolved: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',
        closed: 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100',

        // Ticket Priority variants
        low: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100',
        normal: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
        high: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',

        // Quiz Difficulty variants
        easy: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
        medium: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
        hard: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',

        // Certification Type variants
        CP: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
        SCP: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',

        // Generic variants
        default: 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100',
        primary: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
        success: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',
        warning: 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
        danger: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
        info: 'text-cyan-700 bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-3 py-1',
        lg: 'text-sm px-4 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon to display (Lucide icon component or emoji)
   */
  icon?: React.ReactNode;

  /**
   * Text content of the badge
   */
  children: React.ReactNode;

  /**
   * Whether the badge should have a dot indicator
   */
  withDot?: boolean;
}

export const StatusBadge = ({
  className,
  variant,
  size,
  icon,
  children,
  withDot = false,
  ...props
}: StatusBadgeProps) => {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {withDot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            // Match dot color to variant
            variant === 'new' && 'bg-blue-500',
            variant === 'in_progress' && 'bg-yellow-500',
            variant === 'waiting_user' && 'bg-orange-500',
            variant === 'resolved' && 'bg-green-500',
            variant === 'closed' && 'bg-gray-500',
            variant === 'low' && 'bg-gray-500',
            variant === 'normal' && 'bg-blue-500',
            variant === 'high' && 'bg-red-500',
            variant === 'easy' && 'bg-green-500',
            variant === 'medium' && 'bg-yellow-500',
            variant === 'hard' && 'bg-red-500',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'primary' && 'bg-blue-500',
            variant === 'info' && 'bg-cyan-500',
            !variant && 'bg-gray-500'
          )}
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';
