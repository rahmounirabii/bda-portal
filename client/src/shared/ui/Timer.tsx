import { useEffect, useState, useCallback } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { formatTimeRemaining, isTimeRunningOut } from '@/shared/constants/quiz.constants';

/**
 * Timer Component
 *
 * Countdown timer for quiz time limits with visual warnings
 */

export interface TimerProps {
  /**
   * Initial time in seconds
   */
  initialSeconds: number;

  /**
   * Callback when timer reaches zero
   */
  onTimeUp?: () => void;

  /**
   * Callback triggered every second with remaining time
   */
  onTick?: (remainingSeconds: number) => void;

  /**
   * Whether the timer is paused
   */
  isPaused?: boolean;

  /**
   * Whether to show warning when time is running out
   */
  showWarning?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Display format
   */
  format?: 'compact' | 'full';
}

export const Timer = ({
  initialSeconds,
  onTimeUp,
  onTick,
  isPaused = false,
  showWarning = true,
  className,
  size = 'md',
  format = 'full',
}: TimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isWarning, setIsWarning] = useState(false);

  // Reset timer when initialSeconds changes
  useEffect(() => {
    setRemainingSeconds(initialSeconds);
  }, [initialSeconds]);

  // Handle countdown
  useEffect(() => {
    if (isPaused) return;
    if (remainingSeconds <= 0) {
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = prev - 1;

        // Check if warning threshold reached
        if (showWarning && isTimeRunningOut(newValue)) {
          setIsWarning(true);
        }

        // Trigger tick callback
        onTick?.(newValue);

        // Check if time is up
        if (newValue <= 0) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds, onTimeUp, onTick, showWarning]);

  const formattedTime = formatTimeRemaining(remainingSeconds);
  const timeExpired = remainingSeconds <= 0;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Format display based on variant
  const renderTime = () => {
    if (format === 'compact') {
      return formattedTime;
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return (
      <span className="font-mono">
        {minutes.toString().padStart(2, '0')}
        <span className="animate-pulse">:</span>
        {seconds.toString().padStart(2, '0')}
      </span>
    );
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border font-medium transition-all',
        sizeClasses[size],
        {
          // Normal state
          'border-gray-200 bg-gray-50 text-gray-700': !isWarning && !timeExpired,
          // Warning state (time running out)
          'border-yellow-300 bg-yellow-50 text-yellow-800 shadow-sm animate-pulse':
            isWarning && !timeExpired && !isPaused,
          // Expired state
          'border-red-300 bg-red-50 text-red-800': timeExpired,
          // Paused state
          'opacity-60': isPaused,
        },
        className
      )}
      role="timer"
      aria-label={`Time remaining: ${formattedTime}`}
    >
      {timeExpired ? (
        <AlertCircle className={cn(iconSizeClasses[size], 'text-red-600')} />
      ) : (
        <Clock
          className={cn(iconSizeClasses[size], {
            'text-gray-600': !isWarning,
            'text-yellow-600': isWarning,
          })}
        />
      )}

      <span className="select-none">
        {timeExpired ? (
          <span className="font-bold">Time's Up!</span>
        ) : (
          <>
            {format === 'full' && (
              <span className="text-xs opacity-75 mr-1">
                {isPaused ? 'Paused' : 'Time'}:
              </span>
            )}
            {renderTime()}
          </>
        )}
      </span>
    </div>
  );
};

Timer.displayName = 'Timer';

/**
 * useTimer hook - Manage timer state outside component
 */
export const useTimer = (initialSeconds: number) => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const start = useCallback(() => {
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const reset = useCallback(() => {
    setRemainingSeconds(initialSeconds);
    setIsExpired(false);
    setIsPaused(false);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setIsPaused(true);
    setRemainingSeconds(0);
    setIsExpired(true);
  }, []);

  useEffect(() => {
    if (isPaused || isExpired) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isExpired]);

  return {
    remainingSeconds,
    isPaused,
    isExpired,
    isWarning: isTimeRunningOut(remainingSeconds),
    formattedTime: formatTimeRemaining(remainingSeconds),
    start,
    pause,
    reset,
    stop,
  };
};
