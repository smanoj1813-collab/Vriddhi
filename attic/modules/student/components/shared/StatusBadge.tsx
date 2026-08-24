import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusStyles: Record<string, string> = {
  // Attendance
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  excused: 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Assignments
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  graded: 'bg-green-100 text-green-800 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resubmit: 'bg-orange-100 text-orange-800 border-orange-200',
  
  // Fees
  paid: 'bg-green-100 text-green-800 border-green-200',
  partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  
  // Schedule
  upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
  ongoing: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const style = statusStyles[status.toLowerCase()] || statusStyles.pending;
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${style} ${sizeClasses[size]}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};