/**
 * Robust CSV export helper. Prepends a UTF-8 BOM so Excel opens Thai correctly.
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

