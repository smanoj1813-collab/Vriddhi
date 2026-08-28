// src/components/shared/DateRangeSelector.tsx
// Date Range Selector Component for Attendance Reports

import { Calendar, ChevronDown } from 'lucide-react';
import type { DateRangeType, DateRange } from '@/modules/faculty/hooks/useAttendanceExport';

interface DateRangeSelectorProps {
  selectedType: DateRangeType;
  onTypeChange: (type: DateRangeType) => void;
  customStartDate: string;
  onCustomStartChange: (date: string) => void;
  customEndDate: string;
  onCustomEndChange: (date: string) => void;
  currentRange: DateRange;
  className?: string;
}

const rangeTypeOptions: Array<{ value: DateRangeType; label: string; description: string }> = [
  { value: 'day', label: 'Day', description: 'Single day report' },
  { value: 'week', label: 'Week', description: 'Current week (Mon-Sun)' },
  { value: 'month', label: 'Month', description: 'Current month' },
  { value: 'quarter', label: 'Quarter', description: 'Current quarter (Q1-Q4)' },
  { value: 'custom', label: 'Custom', description: 'Select date range' },
];

export function DateRangeSelector({
  selectedType,
  onTypeChange,
  customStartDate,
  onCustomStartChange,
  customEndDate,
  onCustomEndChange,
  currentRange,
  className = '',
}: DateRangeSelectorProps) {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {/* Range Type Selector */}
      <div className="relative">
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as DateRangeType)}
          className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 cursor-pointer"
        >
          {rangeTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>

      {/* Custom Date Range Inputs */}
      {selectedType === 'custom' && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <span className="text-slate-500 text-sm">to</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
        </div>
      )}

      {/* Current Range Display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {currentRange.label}
        </span>
      </div>
    </div>
  );
}

// Quick select buttons for common ranges
interface QuickRangeButtonsProps {
  onSelect: (type: DateRangeType) => void;
  currentType: DateRangeType;
}

export function QuickRangeButtons({ onSelect, currentType }: QuickRangeButtonsProps) {
  const quickOptions: Array<{ type: DateRangeType; label: string }> = [
    { type: 'day', label: 'Today' },
    { type: 'week', label: 'This Week' },
    { type: 'month', label: 'This Month' },
    { type: 'quarter', label: 'This Quarter' },
  ];

  return (
    <div className="flex items-center gap-2">
      {quickOptions.map((opt) => (
        <button
          key={opt.type}
          onClick={() => onSelect(opt.type)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentType === opt.type
              ? 'bg-teal-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default DateRangeSelector;
