/**
 * useAuthProgress Hook
 * Manages authentication progress steps for better UX feedback
 */

import { useState, useCallback } from 'react';

export interface AuthProgressStep {
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Hook to manage authentication progress steps
 *
 * Usage:
 * ```tsx
 * const { steps, currentStep, updateStep, nextStep, resetProgress } = useAuthProgress();
 *
 * // Start first step
 * updateStep(0, 'in_progress');
 *
 * // Mark complete and move to next
 * updateStep(0, 'completed');
 * nextStep();
 *
 * // Mark failed
 * updateStep(1, 'failed');
 * ```
 */
export function useAuthProgress(initialSteps?: AuthProgressStep[]) {
  const defaultSteps: AuthProgressStep[] = initialSteps || [
    { label: 'Verifying credentials...', status: 'pending' },
    { label: 'Checking account status...', status: 'pending' },
    { label: 'Syncing session...', status: 'pending' },
  ];

  const [steps, setSteps] = useState<AuthProgressStep[]>(defaultSteps);
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Update a specific step's status
   */
  const updateStep = useCallback(
    (stepIndex: number, status: AuthProgressStep['status']) => {
      setSteps((prevSteps) =>
        prevSteps.map((step, i) => (i === stepIndex ? { ...step, status } : step))
      );
    },
    []
  );

  /**
   * Update a specific step's label and status
   */
  const updateStepLabel = useCallback(
    (stepIndex: number, label: string, status?: AuthProgressStep['status']) => {
      setSteps((prevSteps) =>
        prevSteps.map((step, i) =>
          i === stepIndex
            ? { ...step, label, status: status ?? step.status }
            : step
        )
      );
    },
    []
  );

  /**
   * Move to the next step
   */
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  /**
   * Move to a specific step
   */
  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  /**
   * Mark current step as completed and move to next
   */
  const completeCurrentAndNext = useCallback(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step, i) =>
        i === currentStep ? { ...step, status: 'completed' } : step
      )
    );
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [currentStep, steps.length]);

  /**
   * Mark current step as failed
   */
  const failCurrentStep = useCallback(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step, i) =>
        i === currentStep ? { ...step, status: 'failed' } : step
      )
    );
  }, [currentStep]);

  /**
   * Reset all steps to pending
   */
  const resetProgress = useCallback(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({ ...step, status: 'pending' as const }))
    );
    setCurrentStep(0);
  }, []);

  /**
   * Set new steps (useful for different flows)
   */
  const setNewSteps = useCallback((newSteps: AuthProgressStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
  }, []);

  return {
    steps,
    currentStep,
    updateStep,
    updateStepLabel,
    nextStep,
    goToStep,
    completeCurrentAndNext,
    failCurrentStep,
    resetProgress,
    setNewSteps,
  };
}

/**
 * Pre-configured progress steps for common auth flows
 */
export const AUTH_PROGRESS_STEPS = {
  LOGIN: [
    { label: 'Verifying credentials...', status: 'pending' as const },
    { label: 'Loading profile...', status: 'pending' as const },
    { label: 'Syncing session...', status: 'pending' as const },
  ],
  SIGNUP: [
    { label: 'Creating account...', status: 'pending' as const },
    { label: 'Setting up profile...', status: 'pending' as const },
    { label: 'Finalizing registration...', status: 'pending' as const },
  ],
  SIGNUP_WITH_STORE: [
    { label: 'Creating Portal account...', status: 'pending' as const },
    { label: 'Creating Store account...', status: 'pending' as const },
    { label: 'Linking accounts...', status: 'pending' as const },
    { label: 'Syncing data...', status: 'pending' as const },
  ],
  CONFLICT_RESOLUTION: [
    { label: 'Verifying credentials...', status: 'pending' as const },
    { label: 'Updating Portal account...', status: 'pending' as const },
    { label: 'Updating Store account...', status: 'pending' as const },
    { label: 'Linking accounts...', status: 'pending' as const },
  ],
};
