import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ConfirmDialog, ConfirmDialogProps } from '@/components/ui/confirm-dialog';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    open: false,
    options: { title: '', description: '' },
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    dialogState.resolve?.(true);
    setDialogState(prev => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    dialogState.resolve?.(false);
    setDialogState(prev => ({ ...prev, open: false }));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dialogState.resolve?.(false);
    }
    setDialogState(prev => ({ ...prev, open }));
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        onOpenChange={handleOpenChange}
        title={dialogState.options.title}
        description={dialogState.options.description}
        confirmText={dialogState.options.confirmText}
        cancelText={dialogState.options.cancelText}
        variant={dialogState.options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
}