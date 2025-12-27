import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple';
}

/**
 * Standardized statistics card component
 * Used across all Learning System admin pages for displaying metrics
 */
export function StatCard({ label, value, icon: Icon, color = 'gray' }: StatCardProps) {
  const colorMap = {
    gray: 'text-gray-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  const iconColorMap = {
    gray: 'text-gray-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${iconColorMap[color]}`} />}
      </div>
      <p className={`text-3xl font-bold ${colorMap[color]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
