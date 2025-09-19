/**
 * Shared TypeScript types and interfaces for Project Experience Artifacts system
 */

// ===== Core Developer and Project Types =====

export interface Developer {
  name: string;
  email?: string;
  username?: string;
  aliases?: string[]; // Alternative names/usernames to search for
}

export interface Project {
  name: string;
  slug: string; // URL-safe version of name
  description?: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
}

// ===== Git-related Types =====

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface GitContribution {
  developer: Developer;
  project: Project;
  commits: GitCommit[];
}


// ===== Backlog-related Types =====

// Raw CSV row - let AI interpret the columns rather than forcing structure
export interface BacklogTask {
  [key: string]: string; // Raw CSV data
}

export interface BacklogContribution {
  developer: Developer;
  project: Project;
  tasks: BacklogTask[]; // Raw CSV rows assigned to developer
  metadata: {
    totalRows: number;
    assigneeColumns: string[]; // Which columns were used for filtering
    allColumns: string[]; // All available columns in the CSV
  };
}

// ===== Analysis Result Types =====

export interface ProjectSummary {
  developer: Developer;
  project: Project;
  metadata: {
    generatedDate: string;
    version: string;
    sources: ArtifactSource[];
  };
  overview: {
    role: string;
    duration: string;
    technologyStack: string[];
    projectScope: string;
    businessImpact: string;
  };
  technicalContributions: {
    architecture: TechnicalContribution[];
    featureDevelopment: TechnicalContribution[];
    leadership: TechnicalContribution[];
    qualityAssurance: TechnicalContribution[];
  };
  skillsDemonstrated: {
    technical: Record<string, string[]>;
    tools: Record<string, string[]>;
    professional: Record<string, string>;
  };
  projectImpact: {
    technicalAchievements: Achievement[];
    businessValue: Achievement[];
    teamContributions: Achievement[];
  };
  growthIndicators: string[];
}

export interface TechnicalContribution {
  title: string;
  description: string;
  evidence: string[]; // References to specific commits, backlog items, etc.
  technologies?: string[];
  impact?: string;
}

export interface Achievement {
  title: string;
  description: string;
  metrics?: string;
  impact?: string;
}

export interface ProfessionalBio {
  developer: Developer;
  metadata: {
    generatedDate: string;
    version: string;
    basedOnProjects: string[];
  };
  content: string;
  wordCount: number;
  keyThemes: string[];
  careerLevel: 'junior' | 'mid-level' | 'senior' | 'lead' | 'principal';
}

// ===== Processing and Validation Types =====

export interface ArtifactSource {
  type: 'git-log' | 'backlog-csv' | 'json-export' | 'manual-input';
  filename: string;
  processedDate: string;
  recordCount: number;
  developer: string;
  project: string;
}

export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  errors: ProcessingErrorData[];
  warnings: string[];
  metadata: {
    processingTime: number;
    recordsProcessed: number;
    recordsSkipped: number;
  };
}

export interface ProcessingErrorData {
  type: 'validation' | 'processing' | 'parsing' | 'ai-analysis' | 'file-io';
  message: string;
  context?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ProcessingErrorData[];
  warnings: string[];
  score: number; // 0-100 quality score
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

// ===== Template and Prompt Types =====

export interface PromptTemplate {
  name: string;
  version: string;
  description: string;
  template: string;
  requiredVariables: string[];
  optionalVariables: string[];
  outputFormat: 'markdown' | 'json' | 'text';
}

export interface PromptVariables {
  developer: Developer;
  project: Project;
  data: unknown; // Processed artifact data
  context?: {
    careerLevel?: string;
    projectContext?: string;
    additionalInstructions?: string;
  };
}

// ===== Utility Types =====

export interface DateRange {
  start: string;
  end: string;
}

export interface FileMetadata {
  path: string;
  size: number;
  createdDate: string;
  modifiedDate: string;
  checksum?: string;
}

// ===== Error Types =====

export class ProjectArtifactError extends Error {
  constructor(
    message: string,
    public type: 'validation' | 'processing' | 'parsing' | 'ai-analysis' | 'file-io',
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ProjectArtifactError';
  }
}

export class ValidationError extends ProjectArtifactError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'validation', context);
    this.name = 'ValidationError';
  }
}

export class ProcessingError extends ProjectArtifactError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'processing', context);
    this.name = 'ProcessingError';
  }
}

// ===== Configuration Types =====

export interface AnalysisConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  retries: number;
  rateLimitDelay: number;
}

export interface OutputConfig {
  format: 'markdown' | 'json' | 'html';
  includeMetadata: boolean;
  validateOutput: boolean;
  overwriteExisting: boolean;
}
