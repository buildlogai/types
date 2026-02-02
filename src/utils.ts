import type { 
  BuildlogFile, 
  BuildlogEvent, 
  BuildlogStats,
  ValidationResult 
} from './types';
import { BuildlogFileSchema } from './schema';
import { BUILDLOG_EXTENSIONS, BUILDLOG_MIME_TYPE } from './constants';

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
    return { valid: true };
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
    durationSeconds: buildlog.metadata.durationSeconds,
    eventCount: buildlog.events.length,
    promptCount: 0,
    responseCount: 0,
    fileCount: buildlog.finalState.files.length,
    linesAdded: 0,
    linesRemoved: 0,
    languages: [],
  };

  const languageSet = new Set<string>();

  for (const event of buildlog.events) {
    switch (event.type) {
      case 'prompt':
        stats.promptCount++;
        break;
      case 'ai_response':
        stats.responseCount++;
        break;
      case 'code_change':
        if (event.linesChanged) {
          stats.linesAdded += event.linesChanged.added;
          stats.linesRemoved += event.linesChanged.removed;
        }
        break;
      case 'file_create':
        languageSet.add(event.language);
        break;
    }
  }

  for (const file of buildlog.finalState.files) {
    languageSet.add(file.language);
  }

  stats.languages = Array.from(languageSet).sort();
  
  return stats;
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get event icon for display
 */
export function getEventIcon(event: BuildlogEvent): string {
  const icons: Record<BuildlogEvent['type'], string> = {
    prompt: '💬',
    ai_response: '🤖',
    code_change: '✏️',
    file_create: '📄',
    file_delete: '🗑️',
    file_rename: '📁',
    terminal: '🖥️',
    note: '📝',
    checkpoint: '🚩',
    error: '❌',
  };
  return icons[event.type];
}

/**
 * Get human readable event type label
 */
export function getEventLabel(event: BuildlogEvent): string {
  const labels: Record<BuildlogEvent['type'], string> = {
    prompt: 'Prompt',
    ai_response: 'AI Response',
    code_change: 'Code Change',
    file_create: 'File Created',
    file_delete: 'File Deleted',
    file_rename: 'File Renamed',
    terminal: 'Terminal',
    note: 'Note',
    checkpoint: 'Checkpoint',
    error: 'Error',
  };
  return labels[event.type];
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
