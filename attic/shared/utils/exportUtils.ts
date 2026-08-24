/**
 * CSV and Excel export utilities for Vriddhi
 * Zero dependencies — native browser APIs only
 */

export type ExportFormat = 'csv' | 'excel';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | ((row: T) => string);
}

/**
 * Convert data array to CSV string
 */
export function toCSV<T>(data: T[], columns: ExportColumn<T>[]): string {
  const headers = columns.map((c) => c.header).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value =
          typeof col.key === 'function'
            ? col.key(row)
            : String((row as any)[col.key] ?? '');
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const escaped = value.replace(/"/g, '""');
        const needsQuotes = escaped.includes(',') || escaped.includes('\n') || escaped.includes('"');
        return needsQuotes ? `"${escaped}"` : escaped;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Convert data to Excel-compatible HTML table
 * (Trick: save as .xls and Excel opens it natively)
 */
export function toExcelHTML<T>(data: T[], columns: ExportColumn<T>[], title: string): string {
  const headers = columns.map((c) => `<th>${c.header}</th>`).join('');
  const rows = data
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => {
            const value =
              typeof col.key === 'function'
                ? col.key(row)
                : String((row as any)[col.key] ?? '');
            return `<td>${value}</td>`;
          })
          .join('')}</tr>`
    )
    .join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          th { background: #4a90d9; color: white; font-weight: bold; }
          td, th { border: 1px solid #ccc; padding: 8px; }
          tr:nth-child(even) { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

/**
 * Trigger browser download of Excel file
 */
export function downloadExcel(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Generic export dispatcher
 */
export function exportData<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  format: ExportFormat
): void {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }
  if (format === 'csv') {
    const csv = toCSV(data, columns);
    downloadCSV(csv, filename);
  } else {
    const html = toExcelHTML(data, columns, filename);
    downloadExcel(html, filename);
  }
}
