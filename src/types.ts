/**
 * @buildlog/types
 * Type definitions for the .buildlog file format
 */

// =============================================================================
// CORE FILE STRUCTURE
// =============================================================================

/**
 * The root structure of a .buildlog file
 */
export interface BuildlogFile {
  /** Schema version (semver) */
  version: "1.0.0";
  
  /** Session metadata */
  metadata: BuildlogMetadata;
  
  /** Starting state of tracked files */
  initialState: BuildlogState;
  
  /** Ordered list of events that occurred during the session */
  events: BuildlogEvent[];
  
  /** Ending state of tracked files */
  finalState: BuildlogState;
}

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
  
  /** When the file was last modified (ISO 8601) */
  updatedAt?: string;
  
  /** Total session duration in seconds */
  durationSeconds: number;
  
  /** Editor/IDE used */
  editor: EditorType;
  
  /** AI provider(s) used */
  aiProviders?: AIProvider[];
  
  /** Primary programming language */
  primaryLanguage?: string;
  
  /** All languages detected */
  languages?: string[];
  
  /** User-applied tags for discovery */
  tags?: string[];
  
  /** Project/repository information */
  project?: BuildlogProject;
  
  /** Arbitrary key-value pairs for extensibility */
  custom?: Record<string, unknown>;
}

export interface BuildlogAuthor {
  name?: string;
  username?: string;
  url?: string;
  avatarUrl?: string;
}

export interface BuildlogProject {
  name?: string;
  repository?: string;
  branch?: string;
  commit?: string;
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
// STATE SNAPSHOTS
// =============================================================================

/**
 * Snapshot of file system state at a point in time
 */
export interface BuildlogState {
  /** List of file snapshots */
  files: FileSnapshot[];
  
  /** Working directory structure (file tree without content) */
  fileTree?: string[];
}

/**
 * A single file's content at a point in time
 */
export interface FileSnapshot {
  /** Relative path from workspace root */
  path: string;
  
  /** Full file content */
  content: string;
  
  /** Language identifier for syntax highlighting */
  language: string;
  
  /** File size in bytes */
  sizeBytes?: number;
  
  /** SHA-256 hash of content (for integrity checking) */
  hash?: string;
}

// =============================================================================
// EVENTS
// =============================================================================

/**
 * Union type of all possible events
 */
export type BuildlogEvent =
  | PromptEvent
  | AIResponseEvent
  | CodeChangeEvent
  | FileCreateEvent
  | FileDeleteEvent
  | FileRenameEvent
  | TerminalEvent
  | NoteEvent
  | CheckpointEvent
  | ErrorEvent;

/**
 * Base fields present on all events
 */
export interface BaseEvent {
  /** Unique event identifier (UUID v4) */
  id: string;
  
  /** Seconds elapsed since session start */
  timestamp: number;
  
  /** Event sequence number (0-indexed) */
  sequence: number;
}

/**
 * User prompt sent to AI
 */
export interface PromptEvent extends BaseEvent {
  type: "prompt";
  
  /** The prompt text */
  content: string;
  
  /** Files explicitly attached/referenced as context */
  contextFiles?: string[];
  
  /** Selected text that was highlighted when prompting */
  selection?: TextSelection;
  
  /** Which AI provider received this prompt */
  provider?: AIProvider;
  
  /** Model identifier if known */
  model?: string;
}

export interface TextSelection {
  filePath: string;
  startLine: number;
  endLine: number;
  text: string;
}

/**
 * AI response to a prompt
 */
export interface AIResponseEvent extends BaseEvent {
  type: "ai_response";
  
  /** The AI's text response */
  content: string;
  
  /** Code blocks extracted from the response */
  codeBlocks?: CodeBlock[];
  
  /** ID of the prompt this responds to */
  promptEventId?: string;
  
  /** Which AI provider generated this */
  provider?: AIProvider;
  
  /** Model identifier if known */
  model?: string;
  
  /** Token usage if available */
  tokenUsage?: TokenUsage;
}

export interface CodeBlock {
  /** Programming language */
  language: string;
  /** The code content */
  code: string;
  /** Target file path if AI specified one */
  filePath?: string;
  /** Start line if AI specified line numbers */
  startLine?: number;
}

export interface TokenUsage {
  input?: number;
  output?: number;
}

/**
 * Code modification in an existing file
 */
export interface CodeChangeEvent extends BaseEvent {
  type: "code_change";
  
  /** File that was changed */
  filePath: string;
  
  /** Unified diff format */
  diff: string;
  
  /** How the change was made */
  source: ChangeSource;
  
  /** Lines changed summary */
  linesChanged?: LinesChanged;
  
  /** ID of AI response that suggested this change (if applicable) */
  aiResponseEventId?: string;
}

export type ChangeSource = 
  | "manual" 
  | "ai_accepted" 
  | "ai_partial" 
  | "ai_rejected_then_manual";

export interface LinesChanged {
  added: number;
  removed: number;
}

/**
 * New file creation
 */
export interface FileCreateEvent extends BaseEvent {
  type: "file_create";
  
  /** Path of new file */
  filePath: string;
  
  /** Initial content */
  content: string;
  
  /** Language for syntax highlighting */
  language: string;
  
  /** How the file was created */
  source: "manual" | "ai_accepted";
  
  /** ID of AI response that suggested this file (if applicable) */
  aiResponseEventId?: string;
}

/**
 * File deletion
 */
export interface FileDeleteEvent extends BaseEvent {
  type: "file_delete";
  
  /** Path of deleted file */
  filePath: string;
  
  /** Content at time of deletion (for undo/reference) */
  previousContent?: string;
}

/**
 * File rename/move
 */
export interface FileRenameEvent extends BaseEvent {
  type: "file_rename";
  
  /** Original path */
  fromPath: string;
  
  /** New path */
  toPath: string;
}

/**
 * Terminal command execution
 */
export interface TerminalEvent extends BaseEvent {
  type: "terminal";
  
  /** Command that was run */
  command: string;
  
  /** Terminal output (may be truncated) */
  output?: string;
  
  /** Exit code if process completed */
  exitCode?: number;
  
  /** Working directory */
  cwd?: string;
  
  /** Duration in seconds */
  durationSeconds?: number;
}

/**
 * User annotation/commentary
 */
export interface NoteEvent extends BaseEvent {
  type: "note";
  
  /** Note content (supports markdown) */
  content: string;
  
  /** Optional category */
  category?: NoteCategory;
  
  /** Reference to specific file/line */
  reference?: NoteReference;
}

export type NoteCategory = 
  | "explanation" 
  | "gotcha" 
  | "tip" 
  | "warning" 
  | "todo";

export interface NoteReference {
  filePath: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Named checkpoint/milestone in the session
 */
export interface CheckpointEvent extends BaseEvent {
  type: "checkpoint";
  
  /** Checkpoint name */
  name: string;
  
  /** Description of what's been accomplished */
  description?: string;
  
  /** Snapshot of all files at this point */
  state?: BuildlogState;
}

/**
 * Error that occurred during the session
 */
export interface ErrorEvent extends BaseEvent {
  type: "error";
  
  /** Error message */
  message: string;
  
  /** Error category */
  category: ErrorCategory;
  
  /** File where error occurred */
  filePath?: string;
  
  /** Line number */
  line?: number;
  
  /** Full stack trace */
  stackTrace?: string;
  
  /** Whether this error was resolved during the session */
  resolved?: boolean;
  
  /** ID of event that resolved it */
  resolvedByEventId?: string;
}

export type ErrorCategory = 
  | "build" 
  | "runtime" 
  | "lint" 
  | "type" 
  | "test" 
  | "other";

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** All possible event types */
export type EventType = BuildlogEvent["type"];

/** Map from event type string to event interface */
export type EventByType<T extends EventType> = Extract<BuildlogEvent, { type: T }>;

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

/** Stats computed from a buildlog */
export interface BuildlogStats {
  durationSeconds: number;
  eventCount: number;
  promptCount: number;
  responseCount: number;
  fileCount: number;
  linesAdded: number;
  linesRemoved: number;
  languages: string[];
}
