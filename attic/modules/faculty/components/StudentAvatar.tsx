import React from 'react';

interface StudentAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string;
}

export function StudentAvatar({ name, size = 'sm', src }: StudentAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initial = name?.charAt(0)?.toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 dark:border-slate-700`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-slate-600 dark:text-slate-300`}>
      {initial}
    </div>
  );
}

export default StudentAvatar;