/**
 * Table Builder — Journal Style Presets (Section 11)
 * 8 predefined style configurations for different publication contexts.
 */

import type { TableStyleOptions } from '../types/TableBuilderTypes';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  preview: string; // will be set to generated image path
  options: TableStyleOptions;
}

const BASE: TableStyleOptions = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: 11,
  headerStyle: { bold: true, bgColor: '#f1f3f5', borderBottom: true, uppercase: false },
  borderStyle: 'top-bottom-only',
  rowStriping: false,
  sectionRowEmphasis: true,
  cellPadding: 6,
  lineSpacing: 1.4,
  numericAlignment: 'right',
  boldFirstColumn: true,
  pValueDecimals: 3,
  pValueThreshold: true,
  pValueItalic: true,
  pValueLeadingZero: false,
  significanceStars: true,
  ciStyle: 'brackets',
  ciDecimals: 2,
  effectSizeDecimals: 2,
  sigSymbols: [
    { threshold: 0.001, symbol: '***' },
    { threshold: 0.01,  symbol: '**'  },
    { threshold: 0.05,  symbol: '*'   },
  ],
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'general-journal',
    name: 'General Journal',
    description: 'Clean top-and-bottom rules. Suitable for most biomedical and scientific journals.',
    preview: '',
    options: { ...BASE },
  },
  {
    id: 'thesis-classic',
    name: 'Thesis Classic',
    description: 'Traditional dissertation format with serif fonts and full horizontal rules.',
    preview: '',
    options: {
      ...BASE,
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: 12,
      borderStyle: 'horizontal-only',
      rowStriping: false,
      headerStyle: { bold: true, bgColor: '', borderBottom: true, uppercase: false },
      lineSpacing: 1.6,
      cellPadding: 8,
    },
  },
  {
    id: 'clinical-trial',
    name: 'Clinical Trial',
    description: 'ICH/GCP-compliant style with dense formatting and full gridlines.',
    preview: '',
    options: {
      ...BASE,
      fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      fontSize: 9,
      borderStyle: 'full-grid',
      rowStriping: true,
      headerStyle: { bold: true, bgColor: '#e9ecef', borderBottom: true, uppercase: true },
      cellPadding: 4,
      lineSpacing: 1.2,
      pValueDecimals: 4,
      pValueThreshold: false,
      significanceStars: false,
    },
  },
  {
    id: 'apa-like',
    name: 'APA-like',
    description: 'American Psychological Association style with italic headers and minimal borders.',
    preview: '',
    options: {
      ...BASE,
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: 12,
      borderStyle: 'top-bottom-only',
      headerStyle: { bold: false, bgColor: '', borderBottom: true, uppercase: false },
      boldFirstColumn: false,
      pValueItalic: true,
      lineSpacing: 2.0,
      cellPadding: 6,
    },
  },
  {
    id: 'vancouver',
    name: 'Vancouver Neutral',
    description: 'Neutral scientific style common in medical and health sciences journals.',
    preview: '',
    options: {
      ...BASE,
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: 10,
      borderStyle: 'top-bottom-only',
      headerStyle: { bold: true, bgColor: '', borderBottom: true, uppercase: false },
      pValueDecimals: 3,
      pValueThreshold: true,
      ciStyle: 'parentheses',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Ultra-clean design with no gridlines, maximum whitespace.',
    preview: '',
    options: {
      ...BASE,
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSize: 11,
      borderStyle: 'none',
      headerStyle: { bold: true, bgColor: '', borderBottom: true, uppercase: false },
      rowStriping: false,
      cellPadding: 8,
      lineSpacing: 1.5,
      significanceStars: false,
    },
  },
  {
    id: 'supplementary-dense',
    name: 'Supplementary Dense',
    description: 'Compact format for appendix and supplementary tables with maximum data density.',
    preview: '',
    options: {
      ...BASE,
      fontFamily: "'Arial Narrow', Arial, sans-serif",
      fontSize: 8,
      borderStyle: 'full-grid',
      rowStriping: true,
      headerStyle: { bold: true, bgColor: '#dee2e6', borderBottom: true, uppercase: true },
      cellPadding: 3,
      lineSpacing: 1.1,
      pValueDecimals: 4,
      pValueThreshold: false,
      ciStyle: 'compact',
      significanceStars: true,
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start from scratch with your own institutional or journal-specific formatting.',
    preview: '',
    options: { ...BASE },
  },
];

export function getPreset(id: string): StylePreset {
  return STYLE_PRESETS.find(p => p.id === id) || STYLE_PRESETS[0];
}
