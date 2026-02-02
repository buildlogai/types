import { describe, it, expect } from 'vitest';
import { 
  BuildlogFileSchema,
  validateBuildlog,
  parseBuildlog,
  computeStats,
  isBuildlogFile,
  detectLanguage,
  formatDuration,
} from '../src';

const validBuildlog = {
  version: '1.0.0',
  metadata: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Session',
    createdAt: '2026-02-01T14:30:00Z',
    durationSeconds: 300,
    editor: 'vscode',
  },
  initialState: {
    files: [],
  },
  events: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      type: 'prompt',
      timestamp: 0,
      sequence: 0,
      content: 'Create a hello world function',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'ai_response',
      timestamp: 5,
      sequence: 1,
      content: 'Here is a hello world function...',
      codeBlocks: [
        { language: 'typescript', code: 'function hello() { return "Hello"; }' }
      ],
    },
  ],
  finalState: {
    files: [
      { path: 'index.ts', content: 'function hello() {}', language: 'typescript' }
    ],
  },
};

describe('BuildlogFileSchema', () => {
  it('validates a correct buildlog', () => {
    const result = BuildlogFileSchema.safeParse(validBuildlog);
    expect(result.success).toBe(true);
  });

  it('rejects invalid version', () => {
    const invalid = { ...validBuildlog, version: '2.0.0' };
    const result = BuildlogFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const invalid = { 
      ...validBuildlog, 
      metadata: { ...validBuildlog.metadata, title: '' } 
    };
    const result = BuildlogFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid event type', () => {
    const invalid = {
      ...validBuildlog,
      events: [{ ...validBuildlog.events[0], type: 'invalid' }],
    };
    const result = BuildlogFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('validateBuildlog', () => {
  it('returns valid: true for correct buildlog', () => {
    const result = validateBuildlog(validBuildlog);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('returns errors for invalid buildlog', () => {
    const result = validateBuildlog({ version: 'bad' });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe('parseBuildlog', () => {
  it('parses valid JSON', () => {
    const json = JSON.stringify(validBuildlog);
    const result = parseBuildlog(json);
    expect(result.metadata.title).toBe('Test Session');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseBuildlog('not json')).toThrow();
  });

  it('throws on invalid schema', () => {
    expect(() => parseBuildlog('{}')).toThrow();
  });
});

describe('computeStats', () => {
  it('computes correct stats', () => {
    const stats = computeStats(validBuildlog as any);
    expect(stats.eventCount).toBe(2);
    expect(stats.promptCount).toBe(1);
    expect(stats.responseCount).toBe(1);
    expect(stats.fileCount).toBe(1);
  });
});

describe('isBuildlogFile', () => {
  it('recognizes .buildlog extension', () => {
    expect(isBuildlogFile('session.buildlog')).toBe(true);
    expect(isBuildlogFile('path/to/file.buildlog')).toBe(true);
  });

  it('recognizes .vibe extension', () => {
    expect(isBuildlogFile('session.vibe')).toBe(true);
  });

  it('rejects other extensions', () => {
    expect(isBuildlogFile('file.json')).toBe(false);
    expect(isBuildlogFile('file.txt')).toBe(false);
  });
});

describe('detectLanguage', () => {
  it('detects TypeScript', () => {
    expect(detectLanguage('file.ts')).toBe('typescript');
    expect(detectLanguage('file.tsx')).toBe('typescript');
  });

  it('detects JavaScript', () => {
    expect(detectLanguage('file.js')).toBe('javascript');
    expect(detectLanguage('file.jsx')).toBe('javascript');
  });

  it('returns plaintext for unknown', () => {
    expect(detectLanguage('file.xyz')).toBe('plaintext');
  });
});

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(0)).toBe('0:00');
  });
});
