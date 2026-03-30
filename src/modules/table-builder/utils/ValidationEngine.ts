/**
 * ValidationEngine.ts — 17-Category Table Validation System (Section 13)
 * Checks table structure, formatting, and data integrity.
 */

import type { TableDocument, ValidationIssue, TableStyleOptions } from '../types/TableBuilderTypes';

let issueCounter = 0;
function makeIssue(severity: ValidationIssue['severity'], category: string, location: string, description: string, quickFix = false): ValidationIssue {
  return { id: `val-${++issueCounter}`, severity, category, location, description, quickFixAvailable: quickFix };
}

export function validateTable(table: TableDocument, strictness: 'relaxed' | 'standard' | 'strict' = 'standard'): ValidationIssue[] {
  issueCounter = 0;
  const issues: ValidationIssue[] = [];
  const { columns, rows, footnotes, sourceLink, styleOptions } = table;
  const dataRows = rows.filter(r => !r.sectionLabel && !r.isSeparator);

  // 1. Duplicate column names
  const colNames = columns.map(c => c.title.toLowerCase().trim());
  const seen = new Set<string>();
  colNames.forEach((name, i) => {
    if (seen.has(name) && name) {
      issues.push(makeIssue('error', 'Duplicate Columns', `Column "${columns[i].title}"`, `Column name "${columns[i].title}" appears more than once.`, true));
    }
    seen.add(name);
  });

  // 2. Blank required headers
  columns.forEach((col, i) => {
    if (!col.title.trim()) {
      issues.push(makeIssue('warning', 'Blank Header', `Column ${i + 1}`, 'Column header is empty.', true));
    }
  });

  // 3. Inconsistent decimal places (per column)
  columns.forEach(col => {
    const decimals = new Set<number>();
    dataRows.forEach(row => {
      const cell = row.cells[col.id];
      if (cell && typeof cell.rawValue === 'number' && (cell.formatType === 'number' || cell.formatType === 'percentage')) {
        const parts = cell.displayValue.split('.');
        if (parts.length === 2) decimals.add(parts[1].replace(/[^0-9]/g, '').length);
      }
    });
    if (decimals.size > 1) {
      issues.push(makeIssue('warning', 'Inconsistent Decimals', `Column "${col.title}"`, `Mixed decimal places: ${[...decimals].join(', ')}`, true));
    }
  });

  // 4. Inconsistent percentage formatting
  let hasPercentSymbol = false;
  let hasPercentNoSymbol = false;
  dataRows.forEach(row => {
    columns.forEach(col => {
      const cell = row.cells[col.id];
      if (cell && cell.formatType === 'percentage') {
        if (cell.displayValue.includes('%')) hasPercentSymbol = true;
        else hasPercentNoSymbol = true;
      }
    });
  });
  if (hasPercentSymbol && hasPercentNoSymbol) {
    issues.push(makeIssue('warning', 'Percentage Format', 'Table', 'Some percentages use "%" symbol while others do not.', true));
  }

  // 5. P-value formatting inconsistencies
  const pCells: string[] = [];
  let hasThreshold = false;
  let hasExact = false;
  dataRows.forEach(row => {
    columns.forEach(col => {
      const cell = row.cells[col.id];
      if (cell && cell.formatType === 'p-value') {
        pCells.push(cell.displayValue);
        if (cell.displayValue.startsWith('<') || cell.displayValue.startsWith('>')) hasThreshold = true;
        else if (cell.displayValue.match(/^0?\.\d+$/)) hasExact = true;
      }
    });
  });
  if (hasThreshold && hasExact && strictness !== 'relaxed') {
    issues.push(makeIssue('warning', 'P-value Format', 'Table', 'Mixed p-value formats (threshold vs exact). Consider standardizing.', true));
  }

  // 6. CI formatting inconsistencies
  const ciFormats = new Set<string>();
  dataRows.forEach(row => {
    columns.forEach(col => {
      const cell = row.cells[col.id];
      if (cell && cell.formatType === 'ci') {
        if (cell.displayValue.includes('[')) ciFormats.add('brackets');
        else if (cell.displayValue.includes('(')) ciFormats.add('parentheses');
        else if (cell.displayValue.includes(' to ')) ciFormats.add('to');
      }
    });
  });
  if (ciFormats.size > 1) {
    issues.push(makeIssue('warning', 'CI Format', 'Table', `Mixed CI formats: ${[...ciFormats].join(', ')}`, true));
  }

  // 7. Orphan footnotes
  const usedMarkers = new Set<string>();
  dataRows.forEach(row => {
    columns.forEach(col => {
      const cell = row.cells[col.id];
      if (cell) cell.noteMarkers.forEach(m => usedMarkers.add(m));
    });
  });
  footnotes.forEach(fn => {
    if (!usedMarkers.has(fn.id) && fn.attachedTo.length === 0) {
      issues.push(makeIssue('suggestion', 'Orphan Footnote', `Footnote "${fn.marker}"`, 'Footnote is defined but not referenced by any cell.'));
    }
  });

  // 8. Broken merged cells (check for mismatched merge spans)
  columns.forEach(col => {
    if (col.mergeSpan && col.mergeSpan > columns.length) {
      issues.push(makeIssue('error', 'Broken Merge', `Column "${col.title}"`, 'Merge span exceeds table width.'));
    }
  });

  // 9. Unresolved link mappings
  if (sourceLink && sourceLink.status === 'outdated') {
    issues.push(makeIssue('warning', 'Outdated Source', 'Source Link', 'The linked analysis data has changed since the last refresh.', true));
  }
  if (sourceLink && sourceLink.status === 'detached') {
    issues.push(makeIssue('error', 'Detached Source', 'Source Link', 'The linked analysis source no longer exists.'));
  }

  // 10. Table width check (approximate)
  if (columns.length > 15) {
    issues.push(makeIssue('suggestion', 'Table Width', 'Table', `Table has ${columns.length} columns. Consider splitting for readability.`));
  }

  // 11. Caption missing
  if (!table.caption.trim() && strictness !== 'relaxed') {
    issues.push(makeIssue(strictness === 'strict' ? 'error' : 'suggestion', 'Missing Caption', 'Table', 'Table has no caption. Most journals require table captions.', true));
  }

  // 12. Numbering conflict
  if (!table.tableNumber.trim() && strictness === 'strict') {
    issues.push(makeIssue('warning', 'Missing Number', 'Table', 'Table has no assigned number.', true));
  }

  // 13. Source table outdated (already covered in #9)

  // 14. Conflicting significance symbols
  const sigSymbolsUsed = new Set<string>();
  dataRows.forEach(row => {
    columns.forEach(col => {
      const cell = row.cells[col.id];
      if (cell && cell.displayValue) {
        const starMatch = cell.displayValue.match(/[*†‡§¶]+$/);
        if (starMatch) sigSymbolsUsed.add(starMatch[0]);
      }
    });
  });
  // Check if symbols match defined sigSymbols
  if (sigSymbolsUsed.size > 0 && footnotes.filter(f => f.type === 'significance').length === 0) {
    issues.push(makeIssue('suggestion', 'Significance Symbols', 'Table', 'Significance symbols used but no significance footnotes defined.'));
  }

  // 15. Empty columns
  columns.forEach(col => {
    const hasData = dataRows.some(row => {
      const cell = row.cells[col.id];
      return cell && cell.displayValue && cell.displayValue.trim() !== '' && cell.displayValue !== '-';
    });
    if (!hasData && dataRows.length > 0) {
      issues.push(makeIssue('suggestion', 'Empty Column', `Column "${col.title}"`, 'Column contains no data values.'));
    }
  });

  // 16. Inconsistent row grouping
  const groups = new Set<string>();
  dataRows.forEach(r => { if (r.rowGroup) groups.add(r.rowGroup); });
  if (groups.size > 0) {
    const ungrouped = dataRows.filter(r => !r.rowGroup && !r.sectionLabel && !r.isSeparator);
    if (ungrouped.length > 0 && strictness !== 'relaxed') {
      issues.push(makeIssue('suggestion', 'Row Grouping', 'Table', `${ungrouped.length} data rows are not assigned to any group.`));
    }
  }

  // 17. Unit inconsistencies
  const unitsByCol = new Map<string, Set<string>>();
  dataRows.forEach(row => {
    columns.forEach(col => {
      const cell = row.cells[col.id];
      if (cell && cell.formatting?.unit) {
        if (!unitsByCol.has(col.id)) unitsByCol.set(col.id, new Set());
        unitsByCol.get(col.id)!.add(cell.formatting.unit);
      }
    });
  });
  unitsByCol.forEach((units, colId) => {
    if (units.size > 1) {
      const col = columns.find(c => c.id === colId);
      issues.push(makeIssue('warning', 'Unit Inconsistency', `Column "${col?.title || colId}"`, `Mixed units in column: ${[...units].join(', ')}`, true));
    }
  });

  return issues;
}
