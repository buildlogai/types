import { describe, it, expect } from 'vitest';
import {
  slugify,
  getStepIcon,
  getStepLabel,
  getBuildlogExtension,
  getBuildlogMimeType,
  safeParseBuildlog,
  formatBytes,
} from '../src';
import type { PromptStep, ActionStep } from '../src';

describe('slugify', () => {
  it('converts title to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(slugify('Hello   World')).toBe('hello-world');
  });

  it('trims leading/trailing dashes', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('truncates to 50 characters', () => {
    const longTitle = 'a'.repeat(100);
    expect(slugify(longTitle).length).toBeLessThanOrEqual(50);
  });
});

describe('getStepIcon', () => {
  it('returns correct icon for prompt', () => {
    const step: PromptStep = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'prompt',
      timestamp: 0,
      sequence: 0,
      content: 'test',
    };
    expect(getStepIcon(step)).toBe('💬');
  });

  it('returns correct icon for action', () => {
    const step: ActionStep = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'action',
      timestamp: 0,
      sequence: 0,
      summary: 'test action',
    };
    expect(getStepIcon(step)).toBe('⚡');
  });
});

describe('getStepLabel', () => {
  it('returns correct label for prompt', () => {
    const step: PromptStep = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'prompt',
      timestamp: 0,
      sequence: 0,
      content: 'test',
    };
    expect(getStepLabel(step)).toBe('Prompt');
  });

  it('returns correct label for action', () => {
    const step: ActionStep = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'action',
      timestamp: 0,
      sequence: 0,
      summary: 'test action',
    };
    expect(getStepLabel(step)).toBe('Action');
  });
});

describe('getBuildlogExtension', () => {
  it('returns .buildlog', () => {
    expect(getBuildlogExtension()).toBe('.buildlog');
  });
});

describe('getBuildlogMimeType', () => {
  it('returns correct MIME type', () => {
    expect(getBuildlogMimeType()).toBe('application/vnd.buildlog+json');
  });
});

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });
});

describe('safeParseBuildlog', () => {
  it('returns null for invalid JSON', () => {
    expect(safeParseBuildlog('not json')).toBeNull();
  });

  it('returns null for invalid schema', () => {
    expect(safeParseBuildlog('{}')).toBeNull();
  });

  it('returns parsed buildlog for valid input', () => {
    const validBuildlog = {
      version: '2.0.0',
      format: 'slim',
      metadata: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        createdAt: '2026-02-01T14:30:00Z',
        durationSeconds: 0,
        editor: 'vscode',
        aiProvider: 'claude',
        replicable: true,
      },
      steps: [],
      outcome: {
        status: 'success',
        summary: 'Test outcome',
        filesCreated: 0,
        filesModified: 0,
        canReplicate: true,
      },
    };
    const result = safeParseBuildlog(JSON.stringify(validBuildlog));
    expect(result).not.toBeNull();
    expect(result?.metadata.title).toBe('Test');
  });
});
