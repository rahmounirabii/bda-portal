/**
 * AuthProgressIndicator Component
 * Visual progress indicator for multi-step authentication flows
 * Shows current step with icons and status
 */

import React from 'react';
import { Loader2, CheckCircle, XCircle, Circle } from 'lucide-react';

export interface AuthProgressStep {
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AuthProgressIndicatorProps {
  steps: AuthProgressStep[];
  currentStep: number;
  className?: string;
}

/**
 * Auth Progress Indicator
 *
 * Shows multi-step authentication progress with visual feedback
 *
 * Usage:
 * ```tsx
 * const steps = [
 *   { label: 'Verifying credentials...', status: 'completed' },
 *   { label: 'Checking account status...', status: 'in_progress' },
 *   { label: 'Syncing session...', status: 'pending' },
 * ];
 *
 * <AuthProgressIndicator steps={steps} currentStep={1} />
 * ```
 */
export function AuthProgressIndicator({
  steps,
  currentStep,
  className = '',
}: AuthProgressIndicatorProps) {
  return (
    <div className={`space-y-2 bg-gray-50 p-4 rounded-md border ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = step.status === 'completed';
        const isFailed = step.status === 'failed';
        const isPending = step.status === 'pending';
        const isInProgress = step.status === 'in_progress';

        // Determine icon
        let icon = null;
        if (isInProgress && !isFailed) {
          icon = <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
        } else if (isCompleted) {
          icon = <CheckCircle className="h-4 w-4 text-green-500" />;
        } else if (isFailed) {
          icon = <XCircle className="h-4 w-4 text-red-500" />;
        } else if (isPending) {
          icon = <Circle className="h-4 w-4 text-gray-300" />;
        }

        // Determine text color
        let textColor = 'text-gray-500';
        if (isActive || isInProgress) {
          textColor = 'font-medium text-gray-900';
        } else if (isCompleted) {
          textColor = 'text-green-600';
        } else if (isFailed) {
          textColor = 'text-red-600';
        }

        return (
          <div key={index} className="flex items-center space-x-3">
            {icon}
            <span className={`text-sm ${textColor}`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact variant - single line with current step only
 */
export function AuthProgressCompact({
  currentLabel,
  status,
}: {
  currentLabel: string;
  status: 'loading' | 'success' | 'error';
}) {
  return (
    <div className="flex items-center space-x-3 text-sm">
      {status === 'loading' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-gray-700">{currentLabel}</span>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-600">{currentLabel}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-600">{currentLabel}</span>
        </>
      )}
    </div>
  );
}
