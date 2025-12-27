import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

/**
 * Standardized admin page header with blue gradient banner
 * Used across all Learning System admin pages for consistency
 */
export function AdminPageHeader({ title, description, icon: Icon, action }: AdminPageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Icon className="h-8 w-8" />
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-white/90 text-sm">{description}</p>
          )}
        </div>
        {action && (
          <div className="ml-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
