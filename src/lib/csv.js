import * as XLSX from 'xlsx';

/**
 * Robust CSV export helper. Prepends a UTF-8 BOM so Excel opens Thai correctly.
 * Note: Plain CSV files do not support column width metadata in their specification.
 */
export function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return false;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(',')).join('\r\n');
  const csv = '\uFEFF' + headers.map((h) => escape(h)).join(',') + '\r\n' + body;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Calculate visual width of text, accounting for Thai characters and tone marks.
 */
function calculateVisualWidth(str) {
  if (!str) return 0;
  let width = 0;
  // Thai upper/lower vowels and tone marks (e.g. ่ ้ ๊ ๋ ์ ิ ี ึ ื ุ ู) do not take horizontal column width
  const thaiZeroWidthMarks = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (thaiZeroWidthMarks.test(ch)) {
      continue;
    }
    // Thai consonants, Thai vowels (เ แ โ ใ ไ ฯ), and non-ASCII chars occupy ~1.35x visual character width
    if (ch.charCodeAt(0) > 255) {
      width += 1.35;
    } else {
      width += 1.0;
    }
  }
  return Math.ceil(width);
}

/**
 * Export rows to Excel (.xlsx) with auto-fitted column widths!
 * Measures every column's content to ensure text fits without being truncated.
 */
export function downloadExcel(filename, rows, sheetName = 'รายงาน') {
  if (!rows || rows.length === 0) return false;

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-calculate column widths to fit content nicely
  const headers = Object.keys(rows[0]);
  const colWidths = headers.map((key) => {
    let maxWidth = calculateVisualWidth(key);

    for (let r = 0; r < rows.length; r++) {
      const val = rows[r][key];
      if (val !== null && val !== undefined) {
        const str = String(val);
        // If multiline, check each line
        const lines = str.split('\n');
        for (let l = 0; l < Math.min(lines.length, 3); l++) {
          const w = calculateVisualWidth(lines[l].trim());
          if (w > maxWidth) maxWidth = w;
        }
      }
    }

    // Add safe padding (+4) and clamp width between 12 and 65 characters
    return { wch: Math.min(Math.max(maxWidth + 4, 12), 65) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  const safeSheetName = (sheetName || 'Report').slice(0, 31).replace(/[:\\/?*\[\]]/g, '_');
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const cleanName = filename.replace(/\.(csv|xlsx)$/i, '');
  XLSX.writeFile(workbook, `${cleanName}.xlsx`);
  return true;
}
