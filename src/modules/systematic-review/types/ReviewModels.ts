export type ReviewStage = 
  | 'setup'
  | 'import'
  | 'deduplication'
  | 'title-abstract-screening'
  | 'full-text-retrieval'
  | 'full-text-screening'
  | 'conflict-resolution'
  | 'included'
  | 'excluded'
  | 'reporting';

export type ReviewType = 
  | 'systematic review'
  | 'scoping review'
  | 'rapid review'
  | 'umbrella review'
  | 'narrative structured review'
  | 'meta-analysis support'
  | 'evidence map'
  | 'custom';

export type Discipline = 
  | 'pharmacy'
  | 'medicine'
  | 'nursing'
  | 'public health'
  | 'biomedical sciences'
  | 'pharmacology'
  | 'toxicology'
  | 'preclinical animal research'
  | 'in vitro/laboratory research'
  | 'education research'
  | 'other';

export type ReviewerRole = 'owner/admin' | 'reviewer' | 'adjudicator' | 'observer';

export interface Reviewer {
  id: string;
  name: string;
  role: ReviewerRole;
}

export interface ExclusionReason {
  id: string;
  label: string;
  type: 'title-abstract' | 'full-text' | 'both';
  requiresNote?: boolean;
}

export interface ReviewProject {
  id: string;
  title: string;
  shortTitle: string;
  type: ReviewType;
  discipline: Discipline;
  reviewers: Reviewer[];
  leadReviewerId: string | null;
  adjudicatorId: string | null;
  startDate: string;
  protocolRegistration: string;
  funding: string;
  notes: string;

  // Frameworks
  pico: { p: string; i: string; c: string; o: string; statement: string };
  
  // Eligibility Criteria
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  publicationYearLimits: [number | null, number | null];
  languageLimits: string[];
  documentTypeRestrictions: string[];

  exclusionReasons: ExclusionReason[];
  topicDictionaries: Record<string, string[]>;
  studyDesignDictionaries: Record<string, string[]>;

  settings: {
    screeningMode: 'single' | 'dual independent' | 'dual with adjudication';
    blinding: boolean;
  };
}

export type ScreeningDecision = 'include' | 'exclude' | 'maybe' | 'unscreened';

export interface DecisionRecord {
  reviewerId: string;
  decision: ScreeningDecision;
  reasonId?: string; // Exclusion reason ID
  note?: string;
  timestamp: string;
}

export interface KeywordMatch {
  keyword: string;
  field: 'title' | 'abstract';
  type: 'inclusion' | 'exclusion';
}

export interface ReviewRecord {
  id: string;
  
  // Raw citation metadata
  title: string;
  abstract: string;
  authors: string;
  year: number | null;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  pmid: string;
  pmcid: string;
  keywords: string[];
  meshTerms: string[];
  publicationType: string;
  language: string;
  urls: string[];
  
  // Provenance
  sourceDatabase: string;
  sourceBatch: string;
  importTimestamp: string;
  
  // Attachments
  pdfAttached: boolean;
  pdfPath?: string;
  supplementaryFiles: string[];

  // Workflow tracking
  stage: ReviewStage;
  dedupClusterId: string | null;
  dedupStatus: 'pending' | 'duplicate' | 'survivor' | 'unique';

  // Decisions
  titleAbstractDecisions: Record<string, DecisionRecord>; // Map<reviewerId, DecisionRecord>
  fullTextDecisions: Record<string, DecisionRecord>;
  
  // Adjudication & Final
  conflictStatus: 'none' | 'title-abstract' | 'full-text' | 'resolved';
  finalDisposition: 'pending' | 'included' | 'excluded' | 'maybe';
  finalReasonId?: string;

  // Smart layer metadata
  relevanceScore?: number;
  likelyStudyDesign?: string[];
  topicTags: string[];
  userLabels: string[];
  flags: string[]; // e.g., 'missing-abstract', 'inconsistent-reason'
}

export interface DeduplicationCluster {
  id: string;
  recordIds: string[];
  confidence: 'exact' | 'very high' | 'high' | 'medium' | 'weak';
  matchingBasis: string; // e.g., "title + year + author"
  survivorId: string | null;
  resolved: boolean;
}

export interface Conflict {
  id: string;
  recordId: string;
  stage: 'title-abstract' | 'full-text' | 'dedup';
  type: 'include vs exclude' | 'include vs maybe' | 'exclude vs maybe' | 'different reasons' | 'other';
  reviewersInvolved: string[];
  status: 'pending' | 'resolved';
  adjudicatorId?: string;
  resolutionDecision?: ScreeningDecision;
  resolutionReasonId?: string;
  resolutionNote?: string;
  resolutionTimestamp?: string;
}

export type ActionType = 
  | 'project_created'
  | 'settings_updated'
  | 'records_imported'
  | 'dedup_resolved'
  | 'metadata_edited'
  | 'screening_decision'
  | 'conflict_resolved'
  | 'pdf_attached'
  | 'export_generated'
  | 'stage_locked';

export interface LogEvent {
  id: string;
  timestamp: string;
  userId: string;
  actionType: ActionType;
  recordId?: string; // Optional if action applies to project
  oldValue?: any;
  newValue?: any;
  stage: ReviewStage;
  comment?: string;
}
