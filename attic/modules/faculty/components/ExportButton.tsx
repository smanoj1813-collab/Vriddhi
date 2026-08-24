
import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { ExportFormat } from '../../../modules/faculty/types/attendance';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  exporting: boolean;
  hasData: boolean;
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  exporting,
  hasData,
  label = 'Export',
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!hasData) return null;

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={exporting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all"
      >
        {exporting ? (
          <>
            <span className="animate-spin">⏳</span>
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            {label}
            <span className="text-xs ml-1">▼</span>
          </>
        )}
      </button>

      {showOptions && !exporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => {
              onExport('csv');
              setShowOptions(false);
            }}
            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
          >
            <FileText className="w-4 h-4 text-green-500" />
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Export as CSV</div>
              <div className="text-xs text-slate-500">Opens in Excel, Sheets</div>
            </div>
          </button>
          <div className="border-t border-slate-200 dark:border-slate-700" />
          <button
            onClick={() => {
              onExport('excel');
              setShowOptions(false);
            }}
            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Export as Excel</div>
              <div className="text-xs text-slate-500">.xls with formatting</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};