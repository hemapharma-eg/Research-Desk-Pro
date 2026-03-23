import type { Reference } from '../../../types/electron.d';

export type FieldType = 'text' | 'textarea' | 'number' | 'url' | 'date' | 'tags' | 'select' | 'boolean';

export interface FieldDef {
  name: keyof Reference | string; // maps to a property in the StructuredMetadata JSON or top-level string
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for select
  placeholder?: string;
}

export type ContributorRole = 
  | 'Author' | 'Editor' | 'Series Editor' | 'Translator' | 'Compiler'
  | 'Director' | 'Producer' | 'Inventor' | 'Assignee' | 'Interviewer'
  | 'Interviewee' | 'Presenter' | 'Speaker' | 'Host' | 'Guest'
  | 'Composer' | 'Performer' | 'Principal Investigator' | 'Corporate Author'
  | 'Organization' | 'Government Body' | 'Department / Agency';

export interface ReferenceSchema {
  id: string; // e.g. "journal_article"
  label: string; // e.g. "Journal Article"
  category: string;
  defaultRoles: ContributorRole[];
  fields: {
    primary: FieldDef[];
    publication: FieldDef[];
    identifiers: FieldDef[];
    online: FieldDef[];
    metadata: FieldDef[];
  };
}

// -------------------------------------------------------------
// STANDARD FIELD BLOCKS FOR REUSE
// -------------------------------------------------------------

const stdPrimary = (extras: FieldDef[] = []): FieldDef[] => [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'subtitle', label: 'Subtitle', type: 'text' },
  ...extras,
  { name: 'year', label: 'Year', type: 'text', required: true }
];

const stdPublication = (extras: FieldDef[] = []): FieldDef[] => [
  { name: 'publisher', label: 'Publisher', type: 'text' },
  { name: 'place_published', label: 'Place Published / City', type: 'text' },
  ...extras,
];

const stdJournalPub: FieldDef[] = [
  { name: 'journal', label: 'Journal Title', type: 'text', required: true },
  { name: 'volume', label: 'Volume', type: 'text' },
  { name: 'issue', label: 'Issue', type: 'text' },
  { name: 'pages_start', label: 'Page Start', type: 'text' },
  { name: 'pages_end', label: 'Page End', type: 'text' },
  { name: 'article_number', label: 'Article Number', type: 'text' },
];

const stdBookPub: FieldDef[] = [
  { name: 'edition', label: 'Edition', type: 'text' },
  { name: 'volume', label: 'Volume', type: 'text' },
  { name: 'series_title', label: 'Series Title', type: 'text' },
  { name: 'series_number', label: 'Series Number', type: 'text' },
  { name: 'publisher', label: 'Publisher', type: 'text' },
  { name: 'place_published', label: 'Place Published / City', type: 'text' },
];

const stdIdentifiers = (extras: FieldDef[] = []): FieldDef[] => [
  { name: 'doi', label: 'DOI', type: 'text' },
  ...extras
];

const stdOnline = (extras: FieldDef[] = []): FieldDef[] => [
  { name: 'url', label: 'URL', type: 'url' },
  { name: 'accessed_date', label: 'Accessed Date', type: 'date' },
  ...extras
];

const stdMetadata = (extras: FieldDef[] = []): FieldDef[] => [
  { name: 'abstract', label: 'Abstract', type: 'textarea' },
  { name: 'keywords', label: 'Keywords (comma-separated)', type: 'tags' },
  { name: 'language', label: 'Language', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  ...extras
];

// -------------------------------------------------------------
// THE REGISTRY (Partial for now to remain scalable, but highly extensible)
// -------------------------------------------------------------

export const REFERENCE_TYPES: ReferenceSchema[] = [
  // --- A. COMMON ACADEMIC ---
  {
    id: 'journal_article',
    label: 'Journal Article',
    category: 'Common Academic',
    defaultRoles: ['Author'],
    fields: {
      primary: stdPrimary([{ name: 'short_title', label: 'Short Title', type: 'text' }]),
      publication: stdJournalPub,
      identifiers: stdIdentifiers([
        { name: 'pmid', label: 'PMID', type: 'text' },
        { name: 'pmcid', label: 'PMCID', type: 'text' },
        { name: 'issn', label: 'ISSN', type: 'text' }
      ]),
      online: stdOnline(),
      metadata: stdMetadata([{ name: 'publication_status', label: 'Publication Status', type: 'select', options: ['Published', 'Online ahead of print', 'In press', 'Accepted manuscript'] }])
    }
  },
  {
    id: 'review_article',
    label: 'Review Article / Systematic Review',
    category: 'Common Academic',
    defaultRoles: ['Author'],
    fields: {
      primary: stdPrimary(),
      publication: stdJournalPub,
      identifiers: stdIdentifiers([{ name: 'pmid', label: 'PMID', type: 'text' }, { name: 'pmcid', label: 'PMCID', type: 'text' }]),
      online: stdOnline(),
      metadata: stdMetadata([{ name: 'publication_status', label: 'Publication Status', type: 'select', options: ['Published', 'Online ahead of print'] }])
    }
  },
  {
    id: 'book',
    label: 'Book',
    category: 'Common Academic',
    defaultRoles: ['Author', 'Editor'],
    fields: {
      primary: stdPrimary(),
      publication: stdBookPub,
      identifiers: stdIdentifiers([{ name: 'isbn', label: 'ISBN', type: 'text' }]),
      online: stdOnline([{ name: 'archive', label: 'Archive/Repository', type: 'text' }]),
      metadata: stdMetadata()
    }
  },
  {
    id: 'edited_book',
    label: 'Edited Book',
    category: 'Common Academic',
    defaultRoles: ['Editor'],
    fields: {
      primary: stdPrimary(),
      publication: stdBookPub,
      identifiers: stdIdentifiers([{ name: 'isbn', label: 'ISBN', type: 'text' }]),
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },
  {
    id: 'book_chapter',
    label: 'Book Chapter',
    category: 'Common Academic',
    defaultRoles: ['Author', 'Editor'],
    fields: {
      primary: [
        { name: 'title', label: 'Chapter Title', type: 'text', required: true },
        { name: 'subtitle', label: 'Chapter Subtitle', type: 'text' },
        { name: 'journal', label: 'Book Title', type: 'text', required: true }, // Using journal internally as the source/container
        { name: 'year', label: 'Year', type: 'text', required: true }
      ],
      publication: [
        { name: 'edition', label: 'Edition', type: 'text' },
        { name: 'volume', label: 'Volume', type: 'text' },
        { name: 'pages_start', label: 'Page Start', type: 'text' },
        { name: 'pages_end', label: 'Page End', type: 'text' },
        { name: 'publisher', label: 'Publisher', type: 'text' },
        { name: 'place_published', label: 'Place Published / City', type: 'text' },
      ],
      identifiers: stdIdentifiers([{ name: 'isbn', label: 'ISBN', type: 'text' }]),
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },
  {
    id: 'conference_paper',
    label: 'Conference Paper / Proceedings',
    category: 'Common Academic',
    defaultRoles: ['Author', 'Editor'],
    fields: {
      primary: [
        { name: 'title', label: 'Paper Title', type: 'text', required: true },
        { name: 'journal', label: 'Conference / Proceedings Name', type: 'text', required: true },
        { name: 'year', label: 'Year', type: 'text', required: true }
      ],
      publication: [
        { name: 'place_published', label: 'Conference Location', type: 'text' },
        { name: 'date_text', label: 'Conference Dates', type: 'text' },
        { name: 'publisher', label: 'Organizer / Publisher', type: 'text' },
        { name: 'pages_start', label: 'Page Start', type: 'text' },
        { name: 'pages_end', label: 'Page End', type: 'text' },
      ],
      identifiers: stdIdentifiers([{ name: 'isbn', label: 'ISBN', type: 'text' }, { name: 'issn', label: 'ISSN', type: 'text' }]),
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },
  {
    id: 'thesis',
    label: 'Thesis / Dissertation',
    category: 'Common Academic',
    defaultRoles: ['Author'],
    fields: {
      primary: stdPrimary([{ name: 'version', label: 'Thesis Type (e.g. PhD, Masters)', type: 'text' }]),
      publication: [
        { name: 'publisher', label: 'Degree Awarding Institution', type: 'text' },
        { name: 'place_published', label: 'Department / Faculty', type: 'text' },
      ],
      identifiers: stdIdentifiers(),
      online: stdOnline([{ name: 'archive', label: 'Repository / Archive', type: 'text' }]),
      metadata: stdMetadata()
    }
  },
  {
    id: 'report',
    label: 'Report',
    category: 'Common Academic',
    defaultRoles: ['Author', 'Organization'],
    fields: {
      primary: stdPrimary(),
      publication: [
        { name: 'report_number', label: 'Report Number', type: 'text' },
        { name: 'publisher', label: 'Institution / Issuing Body', type: 'text' },
        { name: 'place_published', label: 'Place Published', type: 'text' },
      ],
      identifiers: stdIdentifiers([{ name: 'isbn', label: 'ISBN', type: 'text' }]),
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },

  // --- B. WEB & DIGITAL ---
  {
    id: 'webpage',
    label: 'Webpage / Website',
    category: 'Web & Digital',
    defaultRoles: ['Author', 'Organization'],
    fields: {
      primary: [
        { name: 'title', label: 'Page Title', type: 'text', required: true },
        { name: 'journal', label: 'Website Title', type: 'text' },
        { name: 'year', label: 'Publication Year', type: 'text' }
      ],
      publication: [{ name: 'publisher', label: 'Organization / Publisher', type: 'text' }],
      identifiers: [],
      online: stdOnline([{ name: 'date_text', label: 'Last Updated Date', type: 'text' }]),
      metadata: stdMetadata()
    }
  },
  {
    id: 'software',
    label: 'Software / Computer Program / App',
    category: 'Web & Digital',
    defaultRoles: ['Author', 'Organization'],
    fields: {
      primary: stdPrimary([{ name: 'version', label: 'Version', type: 'text' }]),
      publication: [{ name: 'publisher', label: 'Platform / Publisher', type: 'text' }],
      identifiers: stdIdentifiers(),
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },
  {
    id: 'dataset',
    label: 'Dataset',
    category: 'Web & Digital',
    defaultRoles: ['Author', 'Organization'],
    fields: {
      primary: stdPrimary([{ name: 'version', label: 'Version', type: 'text' }]),
      publication: [{ name: 'publisher', label: 'Hosting Institution / Archive', type: 'text' }],
      identifiers: stdIdentifiers(),
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },

  // --- C. MEDIA & NEWS ---
  {
    id: 'newspaper_article',
    label: 'Newspaper Article',
    category: 'Media & News',
    defaultRoles: ['Author'],
    fields: {
      primary: [
        { name: 'title', label: 'Article Title', type: 'text', required: true },
        { name: 'journal', label: 'Newspaper Title', type: 'text', required: true },
        { name: 'year', label: 'Year', type: 'text', required: true }
      ],
      publication: [
        { name: 'date_text', label: 'Exact Date', type: 'text' },
        { name: 'edition', label: 'Edition', type: 'text' },
        { name: 'volume', label: 'Section', type: 'text' },
        { name: 'pages_start', label: 'Page', type: 'text' }
      ],
      identifiers: [],
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },
  {
    id: 'magazine_article',
    label: 'Magazine Article',
    category: 'Media & News',
    defaultRoles: ['Author'],
    fields: {
      primary: [
        { name: 'title', label: 'Article Title', type: 'text', required: true },
        { name: 'journal', label: 'Magazine Title', type: 'text', required: true },
        { name: 'year', label: 'Year', type: 'text', required: true }
      ],
      publication: [
        { name: 'date_text', label: 'Exact Date', type: 'text' },
        { name: 'volume', label: 'Volume', type: 'text' },
        { name: 'issue', label: 'Issue', type: 'text' },
        { name: 'pages_start', label: 'Page', type: 'text' }
      ],
      identifiers: [],
      online: stdOnline(),
      metadata: stdMetadata()
    }
  },

  // --- D. LEGAL & GOVERNMENT ---
  {
    id: 'standard',
    label: 'Standard / Guideline',
    category: 'Legal & Government',
    defaultRoles: ['Organization'],
    fields: {
      primary: stdPrimary([{ name: 'standard_number', label: 'Standard Number', type: 'text' }]),
      publication: [
        { name: 'version', label: 'Version / Revision', type: 'text' },
        { name: 'publisher', label: 'Issuing Organization', type: 'text' },
      ],
      identifiers: stdIdentifiers([{ name: 'isbn', label: 'ISBN (if applicable)', type: 'text' }]),
      online: stdOnline(),
      metadata: stdMetadata([{ name: 'publication_status', label: 'Status', type: 'select', options: ['Active', 'Superseded', 'Withdrawn'] }])
    }
  },
  {
    id: 'patent',
    label: 'Patent',
    category: 'Legal & Government',
    defaultRoles: ['Inventor', 'Assignee'],
    fields: {
      primary: stdPrimary(),
      publication: [
        { name: 'patent_number', label: 'Patent Number', type: 'text' },
        { name: 'application_number', label: 'Application Number', type: 'text' },
        { name: 'place_published', label: 'Jurisdiction / Country', type: 'text' },
        { name: 'date_text', label: 'Issue / Grant Date', type: 'text' }
      ],
      identifiers: [],
      online: stdOnline(),
      metadata: stdMetadata([{ name: 'publication_status', label: 'Patent Status', type: 'select', options: ['Application', 'Published', 'Granted', 'Expired'] }])
    }
  },

  // --- E. CLINICAL ---
  {
    id: 'clinical_trial',
    label: 'Clinical Trial Record',
    category: 'Clinical',
    defaultRoles: ['Principal Investigator', 'Organization'],
    fields: {
      primary: stdPrimary([{ name: 'report_number', label: 'Registration Number', type: 'text' }]),
      publication: [
        { name: 'journal', label: 'Registry Name', type: 'text' },
        { name: 'publisher', label: 'Sponsor', type: 'text' },
      ],
      identifiers: [],
      online: stdOnline(),
      metadata: stdMetadata([{ name: 'publication_status', label: 'Study Status', type: 'text' }])
    }
  },

  // --- F. OTHER / MISC ---
  {
    id: 'miscellaneous',
    label: 'Generic Miscellaneous / Other',
    category: 'Other',
    defaultRoles: ['Author'],
    fields: {
      primary: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'journal', label: 'Source / Container Title', type: 'text' },
        { name: 'year', label: 'Year', type: 'text' }
      ],
      publication: stdPublication(),
      identifiers: stdIdentifiers(),
      online: stdOnline(),
      metadata: stdMetadata()
    }
  }
];

export const getReferenceSchema = (id: string): ReferenceSchema => {
  return REFERENCE_TYPES.find(t => t.id === id) || REFERENCE_TYPES.find(t => t.id === 'journal_article')!;
};

export const getCategoryGroups = () => {
  const categories: Record<string, ReferenceSchema[]> = {};
  for (const t of REFERENCE_TYPES) {
    if (!categories[t.category]) categories[t.category] = [];
    categories[t.category].push(t);
  }
  return categories;
};
