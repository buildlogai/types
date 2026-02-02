import { describe, it, expect } from 'vitest';
import { 
  BuildlogFileSchema,
  validateBuildlog,
  parseBuildlog,
  computeStats,
  isBuildlogFile,
  detectLanguage,
  formatDuration,
  estimateBuildlogSize,
  isReplicable,
  toSlim,
} from '../src';

const validBuildlog = {
  version: '2.0.0',
  format: 'slim',
  metadata: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Session',
    createdAt: '2026-02-01T14:30:00Z',
    durationSeconds: 300,
    editor: 'vscode',
    aiProvider: 'claude',
    replicable: true,
  },
  steps: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      type: 'prompt',
      timestamp: 0,
      sequence: 0,
      content: 'Create a hello world function',
      context: ['index.ts'],
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'action',
      timestamp: 5,
      sequence: 1,
      summary: 'Created hello world function in index.ts',
      filesCreated: ['index.ts'],
    },
  ],
  outcome: {
    status: 'success',
    summary: 'Created a simple hello world function',
    filesCreated: 1,
    filesModified: 0,
    canReplicate: true,
  },
};

describe('BuildlogFileSchema', () => {
  it('validates a correct buildlog', () => {
    const result = BuildlogFileSchema.safeParse(validBuildlog);
    expect(result.success).toBe(true);
  });

  it('rejects invalid version', () => {
    const invalid = { ...validBuildlog, version: '1.0.0' };
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

  it('rejects invalid step type', () => {
    const invalid = {
      ...validBuildlog,
      steps: [{ ...validBuildlog.steps[0], type: 'invalid' }],
    };
    const result = BuildlogFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
  
  it('rejects missing outcome', () => {
    const { outcome, ...noOutcome } = validBuildlog;
    const result = BuildlogFileSchema.safeParse(noOutcome);
    expect(result.success).toBe(false);
  });
  
  it('rejects missing format', () => {
    const { format, ...noFormat } = validBuildlog;
    const result = BuildlogFileSchema.safeParse(noFormat);
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
});

describe('computeStats', () => {
  it('computes correct stats', () => {
    const stats = computeStats(validBuildlog as any);
    expect(stats.stepCount).toBe(2);
    expect(stats.promptCount).toBe(1);
    expect(stats.actionCount).toBe(1);
    expect(stats.filesCreated).toBe(1);
    expect(stats.isReplicable).toBe(true);
  });
});

describe('estimateBuildlogSize', () => {
  it('returns tiny for small buildlogs', () => {
    const size = estimateBuildlogSize(validBuildlog as any);
    expect(size).toBe('tiny');
  });
});

describe('isReplicable', () => {
  it('returns true for replicable buildlogs', () => {
    expect(isReplicable(validBuildlog as any)).toBe(true);
  });
  
  it('returns false for buildlogs without prompts', () => {
    const noPrompts = {
      ...validBuildlog,
      steps: validBuildlog.steps.filter(s => s.type !== 'prompt'),
    };
    expect(isReplicable(noPrompts as any)).toBe(false);
  });
});

describe('toSlim', () => {
  it('strips full mode fields from actions', () => {
    const fullBuildlog = {
      ...validBuildlog,
      format: 'full' as const,
      steps: [
        ...validBuildlog.steps,
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          type: 'action' as const,
          timestamp: 10,
          sequence: 2,
          summary: 'With full data',
          aiResponse: 'Full AI response text here...',
          diffs: { 'file.ts': '+ line added' },
        },
      ],
    };
    
    const slim = toSlim(fullBuildlog as any);
    expect(slim.format).toBe('slim');
    
    const actionWithFullData = slim.steps.find(s => s.id === '550e8400-e29b-41d4-a716-446655440003');
    expect(actionWithFullData).toBeDefined();
    expect((actionWithFullData as any).aiResponse).toBeUndefined();
    expect((actionWithFullData as any).diffs).toBeUndefined();
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
  it('formats duration correctly', () => {
    expect(formatDuration(65)).toBe('1m 5s');
    expect(formatDuration(3661)).toBe('1h 1m');
    expect(formatDuration(0)).toBe('0s');
  });
});
