/**
 * tableExporter.ts — Export Utilities (Section 14)
 * Handles CSV, TSV, Markdown, JSON, Clipboard, and plain-text exports.
 * PDF/Image exports delegate to Electron IPC.
 */

import type { TableDocument, ExportFormat } from '../types/TableBuilderTypes';

// ── CSV / TSV ──

function escapeCsv(val: string, sep: string): string {
  if (val.includes(sep) || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function tableToCSV(table: TableDocument, separator = ','): string {
  const lines: string[] = [];

  // Header row
  const headerLine = table.columns.map(c => escapeCsv(c.title, separator)).join(separator);
  lines.push(headerLine);

  // Data rows
  for (const row of table.rows) {
    if (row.sectionLabel) {
      lines.push(escapeCsv(row.sectionLabel, separator));
      continue;
    }
    if (row.isSeparator) {
      lines.push('');
      continue;
    }
    const cells = table.columns.map(col => {
      const cell = row.cells[col.id];
      return escapeCsv(cell?.displayValue || '', separator);
    });
    lines.push(cells.join(separator));
  }

  return lines.join('\n');
}

export function tableToTSV(table: TableDocument): string {
  return tableToCSV(table, '\t');
}

// ── Markdown ──

export function tableToMarkdown(table: TableDocument): string {
  const lines: string[] = [];

  // Caption
  if (table.tableNumber || table.title) {
    lines.push(`**${table.tableNumber ? table.tableNumber + '. ' : ''}${table.title}**`);
    lines.push('');
  }
  if (table.caption) {
    lines.push(`*${table.caption}*`);
    lines.push('');
  }

  // Header
  const headers = table.columns.map(c => c.title);
  lines.push('| ' + headers.join(' | ') + ' |');
  lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');

  // Data rows
  for (const row of table.rows) {
    if (row.sectionLabel) {
      lines.push(`| **${row.sectionLabel}** |` + table.columns.slice(1).map(() => ' |').join(''));
      continue;
    }
    if (row.isSeparator) continue;

    const cells = table.columns.map(col => {
      const cell = row.cells[col.id];
      let val = cell?.displayValue || '';
      if (cell?.formatting?.bold) val = `**${val}**`;
      if (cell?.formatting?.italic) val = `*${val}*`;
      if (cell?.noteMarkers?.length) val += `<sup>${cell.noteMarkers.join(',')}</sup>`;
      return val;
    });
    lines.push('| ' + cells.join(' | ') + ' |');
  }

  // Footnotes
  if (table.footnotes.length > 0) {
    lines.push('');
    table.footnotes.forEach(fn => {
      lines.push(`<sup>${fn.marker}</sup> ${fn.text}`);
    });
  }

  return lines.join('\n');
}

// ── JSON ──

export function tableToJSON(table: TableDocument): string {
  const dataRows = table.rows.filter(r => !r.sectionLabel && !r.isSeparator);
  const data = dataRows.map(row => {
    const obj: Record<string, any> = {};
    table.columns.forEach(col => {
      const cell = row.cells[col.id];
      obj[col.title] = cell?.rawValue ?? cell?.displayValue ?? null;
    });
    return obj;
  });
  return JSON.stringify({ metadata: { title: table.title, caption: table.caption, tableNumber: table.tableNumber, type: table.tableType, columns: table.columns.length, rows: dataRows.length }, data }, null, 2);
}

// ── Plain Text ──

export function tableToPlainText(table: TableDocument): string {
  const cols = table.columns;
  const dataRows = table.rows.filter(r => !r.sectionLabel && !r.isSeparator);

  // Calculate column widths
  const widths = cols.map((col, i) => {
    let max = col.title.length;
    dataRows.forEach(row => {
      const cell = row.cells[col.id];
      const len = (cell?.displayValue || '').length;
      if (len > max) max = len;
    });
    return Math.min(max + 2, 30);
  });

  const lines: string[] = [];

  // Title
  if (table.title) {
    lines.push(`${table.tableNumber ? table.tableNumber + '. ' : ''}${table.title}`);
    lines.push('');
  }

  // Header
  const headerLine = cols.map((c, i) => c.title.padEnd(widths[i])).join(' ');
  lines.push(headerLine);
  lines.push('-'.repeat(headerLine.length));

  // Data
  for (const row of table.rows) {
    if (row.sectionLabel) {
      lines.push(row.sectionLabel);
      continue;
    }
    if (row.isSeparator) {
      lines.push('');
      continue;
    }
    const rowLine = cols.map((col, i) => {
      const val = row.cells[col.id]?.displayValue || '';
      return val.padEnd(widths[i]);
    }).join(' ');
    lines.push(rowLine);
  }

  // Footnotes
  if (table.footnotes.length > 0) {
    lines.push('-'.repeat(headerLine.length));
    table.footnotes.forEach(fn => {
      lines.push(`${fn.marker} ${fn.text}`);
    });
  }

  return lines.join('\n');
}

// ── Rich Text (HTML) ──

export function tableToHTML(table: TableDocument): string {
  const { styleOptions, columns, rows, footnotes } = table;

  let html = '<div style="font-family: ' + styleOptions.fontFamily + '; font-size: ' + styleOptions.fontSize + 'px;">\n';

  // Caption
  if (table.title) {
    html += `<p style="font-weight: bold; margin-bottom: 4px;">${table.tableNumber ? table.tableNumber + '. ' : ''}${table.title}</p>\n`;
  }
  if (table.caption) {
    html += `<p style="font-style: italic; color: #666; margin-bottom: 8px;">${table.caption}</p>\n`;
  }

  html += '<table style="border-collapse: collapse; width: 100%;">\n';

  // Header
  html += '<thead><tr>\n';
  columns.forEach(col => {
    const style = [
      `padding: ${styleOptions.cellPadding}px`,
      `font-weight: ${styleOptions.headerStyle.bold ? 'bold' : 'normal'}`,
      styleOptions.headerStyle.bgColor ? `background: ${styleOptions.headerStyle.bgColor}` : '',
      styleOptions.headerStyle.borderBottom ? 'border-bottom: 2px solid black' : 'border-bottom: 1px solid #ddd',
      styleOptions.borderStyle === 'top-bottom-only' ? 'border-top: 2px solid black' : '',
    ].filter(Boolean).join('; ');
    html += `  <th style="${style}">${col.title}</th>\n`;
  });
  html += '</tr></thead>\n';

  // Body
  html += '<tbody>\n';
  rows.forEach((row, ri) => {
    if (row.sectionLabel) {
      html += `<tr><td colspan="${columns.length}" style="font-weight: bold; padding: ${styleOptions.cellPadding}px; border-bottom: 1px solid #ddd;">${row.sectionLabel}</td></tr>\n`;
      return;
    }
    if (row.isSeparator) {
      html += `<tr><td colspan="${columns.length}" style="height: 8px;"></td></tr>\n`;
      return;
    }
    const isLast = ri === rows.length - 1;
    html += '<tr>\n';
    columns.forEach((col, ci) => {
      const cell = row.cells[col.id];
      const val = cell?.displayValue || '';
      const fmt = cell?.formatting;
      const style = [
        `padding: ${styleOptions.cellPadding}px`,
        fmt?.bold || (ci === 0 && styleOptions.boldFirstColumn) ? 'font-weight: bold' : '',
        fmt?.italic ? 'font-style: italic' : '',
        isLast && styleOptions.borderStyle === 'top-bottom-only' ? 'border-bottom: 2px solid black' : '',
        styleOptions.borderStyle === 'horizontal-only' || styleOptions.borderStyle === 'full-grid' ? 'border-bottom: 1px solid #eee' : '',
      ].filter(Boolean).join('; ');
      html += `  <td style="${style}">${val}</td>\n`;
    });
    html += '</tr>\n';
  });
  html += '</tbody></table>\n';

  // Footnotes
  if (footnotes.length > 0) {
    html += '<div style="font-size: 0.85em; margin-top: 6px; color: #666;">\n';
    footnotes.forEach(fn => {
      html += `<p style="margin: 2px 0;"><sup>${fn.marker}</sup> ${fn.text}</p>\n`;
    });
    html += '</div>\n';
  }

  html += '</div>';
  return html;
}

// ── Clipboard ──

export async function copyToClipboard(table: TableDocument, format: 'text' | 'html' | 'tsv' = 'tsv'): Promise<void> {
  let content: string;
  if (format === 'html') content = tableToHTML(table);
  else if (format === 'text') content = tableToPlainText(table);
  else content = tableToTSV(table);

  try {
    await navigator.clipboard.writeText(content);
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
