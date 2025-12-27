import { useConfirm } from '@/contexts/ConfirmDialogContext';

// Re-export for cleaner imports throughout the app
export { useConfirm };

// Helper functions for common confirm dialogs
export const useCommonConfirms = () => {
  const { confirm } = useConfirm();

  const confirmDelete = (itemName: string = 'this item') =>
    confirm({
      title: 'Confirm Deletion',
      description: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

  const confirmAction = (action: string, description: string) =>
    confirm({
      title: `Confirm ${action}`,
      description,
      confirmText: action,
      cancelText: 'Cancel',
      variant: 'default',
    });

  const confirmWarning = (title: string, description: string) =>
    confirm({
      title,
      description,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      variant: 'warning',
    });

  const confirmSuccess = (title: string, description: string) =>
    confirm({
      title,
      description,
      confirmText: 'OK',
      cancelText: 'Cancel',
      variant: 'success',
    });

  return {
    confirm,
    confirmDelete,
    confirmAction,
    confirmWarning,
    confirmSuccess,
  };
};