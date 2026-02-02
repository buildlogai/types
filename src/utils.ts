import type { 
  BuildlogFile, 
  BuildlogStep, 
  BuildlogStats,
  BuildlogSizeCategory,
  ValidationResult,
  ValidationWarning
} from './types';
import { BuildlogFileSchema } from './schema';
import { 
  BUILDLOG_EXTENSIONS, 
  BUILDLOG_MIME_TYPE,
  BUILDLOG_MAX_SLIM_SIZE_BYTES,
  BUILDLOG_MAX_FULL_SIZE_BYTES
} from './constants';

/**
 * Check if a filename has a valid buildlog extension
 */
export function isBuildlogFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return BUILDLOG_EXTENSIONS.some(ext => lower.endsWith(ext));
}

/**
 * Get the file extension for buildlog files
 */
export function getBuildlogExtension(): string {
  return '.buildlog';
}

/**
 * Get the MIME type for buildlog files
 */
export function getBuildlogMimeType(): string {
  return BUILDLOG_MIME_TYPE;
}

/**
 * Validate a buildlog file
 */
export function validateBuildlog(data: unknown): ValidationResult {
  const result = BuildlogFileSchema.safeParse(data);
  
  if (result.success) {
    const buildlog = result.data as BuildlogFile;
    const warnings: ValidationWarning[] = [];
    
    // Check if slim buildlog is too large
    const jsonSize = JSON.stringify(data).length;
    if (buildlog.format === 'slim' && jsonSize > BUILDLOG_MAX_SLIM_SIZE_BYTES) {
      warnings.push({
        path: 'format',
        message: `Slim buildlog is ${formatBytes(jsonSize)}, which exceeds the recommended ${formatBytes(BUILDLOG_MAX_SLIM_SIZE_BYTES)} limit`,
        suggestion: 'Consider removing full diffs or AI responses, or switch to full format'
      });
    }
    
    // Check if full buildlog is too large
    if (buildlog.format === 'full' && jsonSize > BUILDLOG_MAX_FULL_SIZE_BYTES) {
      warnings.push({
        path: 'format',
        message: `Full buildlog is ${formatBytes(jsonSize)}, which exceeds the recommended ${formatBytes(BUILDLOG_MAX_FULL_SIZE_BYTES)} limit`,
        suggestion: 'Consider splitting into multiple buildlogs'
      });
    }
    
    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  };
}

/**
 * Parse and validate a buildlog JSON string
 */
export function parseBuildlog(json: string): BuildlogFile {
  const data = JSON.parse(json);
  const result = BuildlogFileSchema.parse(data);
  return result as BuildlogFile;
}

/**
 * Safely parse a buildlog, returning null on failure
 */
export function safeParseBuildlog(json: string): BuildlogFile | null {
  try {
    return parseBuildlog(json);
  } catch {
    return null;
  }
}

/**
 * Compute statistics from a buildlog
 */
export function computeStats(buildlog: BuildlogFile): BuildlogStats {
  const stats: BuildlogStats = {
    format: buildlog.format,
    durationSeconds: buildlog.metadata.durationSeconds,
    stepCount: buildlog.steps.length,
    promptCount: 0,
    actionCount: 0,
    terminalCount: 0,
    noteCount: 0,
    filesCreated: buildlog.outcome.filesCreated,
    filesModified: buildlog.outcome.filesModified,
    isReplicable: buildlog.outcome.canReplicate,
  };

  for (const step of buildlog.steps) {
    switch (step.type) {
      case 'prompt':
        stats.promptCount++;
        break;
      case 'action':
        stats.actionCount++;
        break;
      case 'terminal':
        stats.terminalCount++;
        break;
      case 'note':
        stats.noteCount++;
        break;
    }
  }
  
  return stats;
}

/**
 * Estimate size category for a buildlog
 */
export function estimateBuildlogSize(buildlog: BuildlogFile): BuildlogSizeCategory {
  const jsonSize = JSON.stringify(buildlog).length;
  
  if (jsonSize < 10 * 1024) return 'tiny';      // < 10KB
  if (jsonSize < 50 * 1024) return 'small';     // < 50KB
  if (jsonSize < 500 * 1024) return 'medium';   // < 500KB
  return 'large';                                // >= 500KB
}

/**
 * Check if a buildlog is replicable (can be followed by another agent)
 */
export function isReplicable(buildlog: BuildlogFile): boolean {
  // Must have at least one prompt
  const hasPrompts = buildlog.steps.some(s => s.type === 'prompt');
  if (!hasPrompts) return false;
  
  // Must have an outcome
  if (!buildlog.outcome) return false;
  
  // Check the explicit replicable flag
  return buildlog.outcome.canReplicate && buildlog.metadata.replicable;
}

/**
 * Convert a buildlog to slim format (strips full mode data)
 */
export function toSlim(buildlog: BuildlogFile): BuildlogFile {
  if (buildlog.format === 'slim') {
    return buildlog;
  }
  
  return {
    ...buildlog,
    format: 'slim',
    steps: buildlog.steps.map(step => {
      if (step.type === 'action') {
        // Remove full mode fields
        const { aiResponse, diffs, ...slimAction } = step;
        return slimAction;
      }
      if (step.type === 'terminal') {
        // Remove full mode fields
        const { output, exitCode, ...slimTerminal } = step;
        return slimTerminal;
      }
      return step;
    }),
  };
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format duration as MM:SS or HH:MM:SS
 */
export function formatDurationClock(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get step icon for display
 */
export function getStepIcon(step: BuildlogStep): string {
  const icons: Record<BuildlogStep['type'], string> = {
    prompt: '💬',
    action: '⚡',
    terminal: '🖥️',
    note: '📝',
    checkpoint: '🚩',
    error: '❌',
  };
  return icons[step.type];
}

/**
 * Get human readable step type label
 */
export function getStepLabel(step: BuildlogStep): string {
  const labels: Record<BuildlogStep['type'], string> = {
    prompt: 'Prompt',
    action: 'Action',
    terminal: 'Terminal',
    note: 'Note',
    checkpoint: 'Checkpoint',
    error: 'Error',
  };
  return labels[step.type];
}

/**
 * Detect programming language from file path
 */
export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    swift: 'swift',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    html: 'html',
    htm: 'html',
    vue: 'vue',
    svelte: 'svelte',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    xml: 'xml',
    md: 'markdown',
    mdx: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'fish',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    cmake: 'cmake',
    tf: 'terraform',
    hcl: 'hcl',
    graphql: 'graphql',
    gql: 'graphql',
    proto: 'protobuf',
    r: 'r',
    scala: 'scala',
    clj: 'clojure',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    hs: 'haskell',
    lua: 'lua',
    pl: 'perl',
    dart: 'dart',
    nim: 'nim',
    zig: 'zig',
    v: 'v',
    sol: 'solidity',
  };

  return languageMap[ext || ''] || 'plaintext';
}

/**
 * Generate a slug from a title
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// =============================================================================
// LEGACY EXPORTS (Deprecated - for v1 compatibility)
// =============================================================================

/** @deprecated Use getStepIcon instead */
export const getEventIcon = getStepIcon;

/** @deprecated Use getStepLabel instead */
export const getEventLabel = getStepLabel;
