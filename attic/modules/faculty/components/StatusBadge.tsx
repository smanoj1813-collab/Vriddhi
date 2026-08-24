import React from 'react';
import type { AttendanceStatus } from '../types/attendance';
import { STATUS_CONFIG } from '../types/attendance';

interface StatusBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-lg font-medium ${sizeClasses} ${config.bg} ${config.color} border border-current/20`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;