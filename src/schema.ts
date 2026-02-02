import { z } from 'zod';

// =============================================================================
// ENUMS & PRIMITIVES
// =============================================================================

export const EditorTypeSchema = z.enum([
  "cursor", "vscode", "windsurf", "zed", "neovim", "jetbrains", "openclaw", "other"
]);

export const AIProviderSchema = z.enum([
  "claude", "gpt", "copilot", "gemini", "other"
]);

export const ChangeSourceSchema = z.enum([
  "manual", "ai_accepted", "ai_partial", "ai_rejected_then_manual"
]);

export const NoteCategorySchema = z.enum([
  "explanation", "gotcha", "tip", "warning", "todo"
]);

export const ErrorCategorySchema = z.enum([
  "build", "runtime", "lint", "type", "test", "other"
]);

// =============================================================================
// NESTED SCHEMAS
// =============================================================================

export const BuildlogAuthorSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  url: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
});

export const BuildlogProjectSchema = z.object({
  name: z.string().optional(),
  repository: z.string().optional(),
  branch: z.string().optional(),
  commit: z.string().optional(),
});

export const FileSnapshotSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  language: z.string(),
  sizeBytes: z.number().int().nonnegative().optional(),
  hash: z.string().optional(),
});

export const BuildlogStateSchema = z.object({
  files: z.array(FileSnapshotSchema),
  fileTree: z.array(z.string()).optional(),
});

export const TextSelectionSchema = z.object({
  filePath: z.string(),
  startLine: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  text: z.string(),
});

export const CodeBlockSchema = z.object({
  language: z.string(),
  code: z.string(),
  filePath: z.string().optional(),
  startLine: z.number().int().nonnegative().optional(),
});

export const TokenUsageSchema = z.object({
  input: z.number().int().nonnegative().optional(),
  output: z.number().int().nonnegative().optional(),
});

export const LinesChangedSchema = z.object({
  added: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
});

export const NoteReferenceSchema = z.object({
  filePath: z.string(),
  startLine: z.number().int().nonnegative().optional(),
  endLine: z.number().int().nonnegative().optional(),
});

// =============================================================================
// EVENT SCHEMAS
// =============================================================================

const BaseEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number().nonnegative(),
  sequence: z.number().int().nonnegative(),
});

export const PromptEventSchema = BaseEventSchema.extend({
  type: z.literal("prompt"),
  content: z.string().min(1),
  contextFiles: z.array(z.string()).optional(),
  selection: TextSelectionSchema.optional(),
  provider: AIProviderSchema.optional(),
  model: z.string().optional(),
});

export const AIResponseEventSchema = BaseEventSchema.extend({
  type: z.literal("ai_response"),
  content: z.string(),
  codeBlocks: z.array(CodeBlockSchema).optional(),
  promptEventId: z.string().uuid().optional(),
  provider: AIProviderSchema.optional(),
  model: z.string().optional(),
  tokenUsage: TokenUsageSchema.optional(),
});

export const CodeChangeEventSchema = BaseEventSchema.extend({
  type: z.literal("code_change"),
  filePath: z.string().min(1),
  diff: z.string(),
  source: ChangeSourceSchema,
  linesChanged: LinesChangedSchema.optional(),
  aiResponseEventId: z.string().uuid().optional(),
});

export const FileCreateEventSchema = BaseEventSchema.extend({
  type: z.literal("file_create"),
  filePath: z.string().min(1),
  content: z.string(),
  language: z.string(),
  source: z.enum(["manual", "ai_accepted"]),
  aiResponseEventId: z.string().uuid().optional(),
});

export const FileDeleteEventSchema = BaseEventSchema.extend({
  type: z.literal("file_delete"),
  filePath: z.string().min(1),
  previousContent: z.string().optional(),
});

export const FileRenameEventSchema = BaseEventSchema.extend({
  type: z.literal("file_rename"),
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
});

export const TerminalEventSchema = BaseEventSchema.extend({
  type: z.literal("terminal"),
  command: z.string().min(1),
  output: z.string().optional(),
  exitCode: z.number().int().optional(),
  cwd: z.string().optional(),
  durationSeconds: z.number().nonnegative().optional(),
});

export const NoteEventSchema = BaseEventSchema.extend({
  type: z.literal("note"),
  content: z.string().min(1),
  category: NoteCategorySchema.optional(),
  reference: NoteReferenceSchema.optional(),
});

export const CheckpointEventSchema = BaseEventSchema.extend({
  type: z.literal("checkpoint"),
  name: z.string().min(1),
  description: z.string().optional(),
  state: BuildlogStateSchema.optional(),
});

export const ErrorEventSchema = BaseEventSchema.extend({
  type: z.literal("error"),
  message: z.string().min(1),
  category: ErrorCategorySchema,
  filePath: z.string().optional(),
  line: z.number().int().nonnegative().optional(),
  stackTrace: z.string().optional(),
  resolved: z.boolean().optional(),
  resolvedByEventId: z.string().uuid().optional(),
});

export const BuildlogEventSchema = z.discriminatedUnion("type", [
  PromptEventSchema,
  AIResponseEventSchema,
  CodeChangeEventSchema,
  FileCreateEventSchema,
  FileDeleteEventSchema,
  FileRenameEventSchema,
  TerminalEventSchema,
  NoteEventSchema,
  CheckpointEventSchema,
  ErrorEventSchema,
]);

// =============================================================================
// METADATA SCHEMA
// =============================================================================

export const BuildlogMetadataSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  author: BuildlogAuthorSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().nonnegative(),
  editor: EditorTypeSchema,
  aiProviders: z.array(AIProviderSchema).optional(),
  primaryLanguage: z.string().optional(),
  languages: z.array(z.string()).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  project: BuildlogProjectSchema.optional(),
  custom: z.record(z.unknown()).optional(),
});

// =============================================================================
// ROOT FILE SCHEMA
// =============================================================================

export const BuildlogFileSchema = z.object({
  version: z.literal("1.0.0"),
  metadata: BuildlogMetadataSchema,
  initialState: BuildlogStateSchema,
  events: z.array(BuildlogEventSchema),
  finalState: BuildlogStateSchema,
});

// Type inference from schemas
export type BuildlogFileFromSchema = z.infer<typeof BuildlogFileSchema>;
export type BuildlogEventFromSchema = z.infer<typeof BuildlogEventSchema>;
