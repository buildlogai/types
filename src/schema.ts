import { z } from 'zod';

// =============================================================================
// ENUMS & PRIMITIVES
// =============================================================================

export const BuildlogFormatSchema = z.enum(["slim", "full"]);

export const EditorTypeSchema = z.enum([
  "cursor", "vscode", "windsurf", "zed", "neovim", "jetbrains", "openclaw", "other"
]);

export const AIProviderSchema = z.enum([
  "claude", "gpt", "copilot", "gemini", "other"
]);

export const NoteCategorySchema = z.enum([
  "explanation", "tip", "warning", "decision", "todo"
]);

export const TerminalOutcomeSchema = z.enum([
  "success", "failure", "partial"
]);

export const OutcomeStatusSchema = z.enum([
  "success", "partial", "failure", "abandoned"
]);

// =============================================================================
// NESTED SCHEMAS
// =============================================================================

export const BuildlogAuthorSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  url: z.string().url().optional(),
});

// =============================================================================
// STEP SCHEMAS
// =============================================================================

const BaseStepSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number().nonnegative(),
  sequence: z.number().int().nonnegative(),
});

export const PromptStepSchema = BaseStepSchema.extend({
  type: z.literal("prompt"),
  content: z.string().min(1),
  context: z.array(z.string()).optional(),
  intent: z.string().optional(),
});

export const ActionStepSchema = BaseStepSchema.extend({
  type: z.literal("action"),
  summary: z.string().min(1),
  filesCreated: z.array(z.string()).optional(),
  filesModified: z.array(z.string()).optional(),
  filesDeleted: z.array(z.string()).optional(),
  packagesAdded: z.array(z.string()).optional(),
  packagesRemoved: z.array(z.string()).optional(),
  approach: z.string().optional(),
  aiResponse: z.string().optional(),
  diffs: z.record(z.string()).optional(),
});

export const TerminalStepSchema = BaseStepSchema.extend({
  type: z.literal("terminal"),
  command: z.string().min(1),
  outcome: TerminalOutcomeSchema,
  summary: z.string().optional(),
  output: z.string().optional(),
  exitCode: z.number().int().optional(),
});

export const NoteStepSchema = BaseStepSchema.extend({
  type: z.literal("note"),
  content: z.string().min(1),
  category: NoteCategorySchema.optional(),
});

export const CheckpointStepSchema = BaseStepSchema.extend({
  type: z.literal("checkpoint"),
  name: z.string().min(1),
  summary: z.string().min(1),
});

export const ErrorStepSchema = BaseStepSchema.extend({
  type: z.literal("error"),
  message: z.string().min(1),
  resolution: z.string().optional(),
  resolved: z.boolean(),
});

export const BuildlogStepSchema = z.discriminatedUnion("type", [
  PromptStepSchema,
  ActionStepSchema,
  TerminalStepSchema,
  NoteStepSchema,
  CheckpointStepSchema,
  ErrorStepSchema,
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
  durationSeconds: z.number().int().nonnegative(),
  editor: EditorTypeSchema,
  aiProvider: AIProviderSchema,
  model: z.string().optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  replicable: z.boolean(),
  dependencies: z.array(z.string()).optional(),
});

// =============================================================================
// OUTCOME SCHEMA
// =============================================================================

export const BuildlogOutcomeSchema = z.object({
  status: OutcomeStatusSchema,
  summary: z.string().min(1),
  filesCreated: z.number().int().nonnegative(),
  filesModified: z.number().int().nonnegative(),
  canReplicate: z.boolean(),
  replicationNotes: z.string().optional(),
});

// =============================================================================
// ROOT FILE SCHEMA
// =============================================================================

export const BuildlogFileSchema = z.object({
  version: z.literal("2.0.0"),
  format: BuildlogFormatSchema,
  metadata: BuildlogMetadataSchema,
  steps: z.array(BuildlogStepSchema),
  outcome: BuildlogOutcomeSchema,
});

// Type inference from schemas
export type BuildlogFileFromSchema = z.infer<typeof BuildlogFileSchema>;
export type BuildlogStepFromSchema = z.infer<typeof BuildlogStepSchema>;

// =============================================================================
// LEGACY SCHEMAS (Deprecated - for v1 compatibility reference only)
// =============================================================================

/** @deprecated Use BuildlogStepSchema instead */
export const BuildlogEventSchema = BuildlogStepSchema;
