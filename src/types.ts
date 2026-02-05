/**
 * @buildlog/types v2.0.0
 * Type definitions for the .buildlog file format
 * 
 * Slim workflow format - prompts as artifacts, summaries over snapshots
 */

// =============================================================================
// CORE FILE STRUCTURE
// =============================================================================

/**
 * The root structure of a .buildlog file
 */
export interface BuildlogFile {
  /** Schema version (semver) */
  version: "2.0.0";
  
  /** Capture format - slim (default) or full */
  format: BuildlogFormat;
  
  /** Session metadata */
  metadata: BuildlogMetadata;
  
  /** Ordered list of workflow steps */
  steps: BuildlogStep[];
  
  /** Session outcome summary */
  outcome: BuildlogOutcome;
}

/**
 * Capture format type
 * - slim: Prompts + summaries only (default, 2-50KB typical)
 * - full: Includes full AI responses and diffs (opt-in, larger files)
 */
export type BuildlogFormat = "slim" | "full";

/**
 * Metadata about the recording session
 */
export interface BuildlogMetadata {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Human-readable title */
  title: string;
  
  /** Optional longer description */
  description?: string;
  
  /** Author information */
  author?: BuildlogAuthor;
  
  /** When the session was recorded (ISO 8601) */
  createdAt: string;
  
  /** Total session duration in seconds */
  durationSeconds: number;
  
  /** Editor/IDE used */
  editor: EditorType;
  
  /** Primary AI provider used */
  aiProvider: AIProvider;
  
  /** Model identifier (e.g., "claude-sonnet-4", "gpt-4o") */
  model?: string;
  
  /** Primary programming language */
  language?: string;
  
  /** Framework used (e.g., "nextjs", "react", "express") */
  framework?: string;
  
  /** User-applied tags for discovery */
  tags?: string[];
  
  /** Can another agent follow this workflow? */
  replicable: boolean;
  
  /** Other buildlogs this builds upon (URLs or IDs) */
  dependencies?: string[];

  /** Source attribution - which tool created this buildlog */
  source?: BuildlogSource;
}

/**
 * Source attribution for the buildlog
 */
export interface BuildlogSource {
  /** Tool that created this buildlog (e.g., '@buildlogai/mcp', 'vscode-extension', 'cli') */
  tool: string;
  
  /** Version of the tool */
  version: string;
  
  /** Client application if applicable (e.g., 'Claude Desktop', 'Cursor', 'OpenClaw') */
  client?: string;
}

export interface BuildlogAuthor {
  name?: string;
  username?: string;
  url?: string;
}

export type EditorType = 
  | "cursor" 
  | "vscode" 
  | "windsurf" 
  | "zed" 
  | "neovim" 
  | "jetbrains"
  | "openclaw"
  | "other";

export type AIProvider = 
  | "claude" 
  | "gpt" 
  | "copilot" 
  | "gemini" 
  | "other";

// =============================================================================
// STEPS (Workflow Steps - renamed from Events)
// =============================================================================

/**
 * Union type of all possible workflow steps
 */
export type BuildlogStep =
  | PromptStep
  | ActionStep
  | TerminalStep
  | NoteStep
  | CheckpointStep
  | ErrorStep;

/**
 * Base fields present on all steps
 */
export interface BaseStep {
  /** Unique step identifier (UUID v4) */
  id: string;
  
  /** Seconds elapsed since session start */
  timestamp: number;
  
  /** Step sequence number (0-indexed) */
  sequence: number;
}

/**
 * User prompt sent to AI - THE PRIMARY ARTIFACT
 * Always captured in full - prompts are the real artifact.
 * Never summarize or truncate the prompt content.
 */
export interface PromptStep extends BaseStep {
  type: "prompt";
  
  /** The full original prompt text (always captured in full - this is the primary artifact) */
  content: string;
  
  /** File names referenced as context (NOT contents) */
  context?: string[];
  
  /** Short title/summary for display (3-10 words). Optional - used for UI display only. */
  intent?: string;
}

/**
 * Summary of what the AI did - NOT full response or diffs
 */
export interface ActionStep extends BaseStep {
  type: "action";
  
  /** Human/agent readable summary: "Created REST API with 4 endpoints" */
  summary: string;
  
  /** Paths of files created (just paths, not contents) */
  filesCreated?: string[];
  
  /** Paths of files modified (just paths, not contents) */
  filesModified?: string[];
  
  /** Paths of files deleted */
  filesDeleted?: string[];
  
  /** Packages added (e.g., ["stripe", "zod"]) */
  packagesAdded?: string[];
  
  /** Packages removed */
  packagesRemoved?: string[];
  
  /** Key decisions or approaches taken */
  approach?: string;
  
  /** Full AI response text - ONLY in full mode */
  aiResponse?: string;
  
  /** File diffs - ONLY in full mode */
  diffs?: Record<string, string>;
}

/**
 * Terminal command execution - command and outcome, not full output
 */
export interface TerminalStep extends BaseStep {
  type: "terminal";
  
  /** Command that was run */
  command: string;
  
  /** Command outcome */
  outcome: "success" | "failure" | "partial";
  
  /** Summary of result (e.g., "Installed 3 packages" or "Build failed: type error") */
  summary?: string;
  
  /** Full terminal output - ONLY in full mode */
  output?: string;
  
  /** Exit code - ONLY in full mode */
  exitCode?: number;
}

/**
 * Human annotation/commentary
 */
export interface NoteStep extends BaseStep {
  type: "note";
  
  /** Note content (supports markdown) */
  content: string;
  
  /** Optional category */
  category?: NoteCategory;
}

export type NoteCategory = 
  | "explanation" 
  | "tip" 
  | "warning" 
  | "decision" 
  | "todo";

/**
 * Milestone marker in the session
 */
export interface CheckpointStep extends BaseStep {
  type: "checkpoint";
  
  /** Checkpoint name */
  name: string;
  
  /** What's been accomplished so far */
  summary: string;
}

/**
 * Error that occurred during the session
 */
export interface ErrorStep extends BaseStep {
  type: "error";
  
  /** Error message */
  message: string;
  
  /** How it was fixed */
  resolution?: string;
  
  /** Whether this error was resolved during the session */
  resolved: boolean;
}

// =============================================================================
// OUTCOME
// =============================================================================

/**
 * Summary of the session outcome
 */
export interface BuildlogOutcome {
  /** Final status of the session */
  status: "success" | "partial" | "failure" | "abandoned";
  
  /** Summary of what was built: "Built a working Stripe integration with checkout and webhooks" */
  summary: string;
  
  /** Count of files created */
  filesCreated: number;
  
  /** Count of files modified */
  filesModified: number;
  
  /** Can another agent replicate this workflow? */
  canReplicate: boolean;
  
  /** Any caveats for replication */
  replicationNotes?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** All possible step types */
export type StepType = BuildlogStep["type"];

/** Map from step type string to step interface */
export type StepByType<T extends StepType> = Extract<BuildlogStep, { type: T }>;

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

/** Stats computed from a buildlog */
export interface BuildlogStats {
  format: BuildlogFormat;
  durationSeconds: number;
  stepCount: number;
  promptCount: number;
  actionCount: number;
  terminalCount: number;
  noteCount: number;
  filesCreated: number;
  filesModified: number;
  isReplicable: boolean;
}

/** Size category for a buildlog */
export type BuildlogSizeCategory = "tiny" | "small" | "medium" | "large";

// =============================================================================
// LEGACY TYPES (Deprecated - for v1 compatibility only)
// =============================================================================

/** @deprecated Use BuildlogStep instead */
export type BuildlogEvent = BuildlogStep;

/** @deprecated Use StepType instead */
export type EventType = StepType;
