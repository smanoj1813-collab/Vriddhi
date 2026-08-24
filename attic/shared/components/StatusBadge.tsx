import { AttendanceStatus, STATUS_CONFIG } from '../../modules/faculty/types/attendance';

interface StatusBadgeProps {
  status: AttendanceStatus;
  onClick?: () => void;
  size?: 'sm' | 'md';
  tooltip?: boolean;
}

export function StatusBadge({ status, onClick, size = 'sm', tooltip = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 rounded-md border font-medium transition-all duration-200
        ${config.bg} ${config.color} ${sizeClasses}
        ${onClick ? 'cursor-pointer hover:brightness-95 active:scale-95' : 'cursor-default'}
        group relative
      `}
    >
      <span className="font-bold">{(config as any).key || status.charAt(0).toUpperCase()}</span>
      <span className="hidden sm:inline">{config.label}</span>
      {tooltip && (
        <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {(config as any).description || config.label}
        </span>
      )}
    </button>
  );
}