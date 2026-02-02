import { describe, it, expect } from 'vitest';
import {
  slugify,
  getEventIcon,
  getEventLabel,
  getBuildlogExtension,
  getBuildlogMimeType,
  safeParseBuildlog,
} from '../src';
import type { PromptEvent, AIResponseEvent } from '../src';

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

describe('getEventIcon', () => {
  it('returns correct icon for prompt', () => {
    const event: PromptEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'prompt',
      timestamp: 0,
      sequence: 0,
      content: 'test',
    };
    expect(getEventIcon(event)).toBe('💬');
  });

  it('returns correct icon for ai_response', () => {
    const event: AIResponseEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'ai_response',
      timestamp: 0,
      sequence: 0,
      content: 'test',
    };
    expect(getEventIcon(event)).toBe('🤖');
  });
});

describe('getEventLabel', () => {
  it('returns correct label for prompt', () => {
    const event: PromptEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'prompt',
      timestamp: 0,
      sequence: 0,
      content: 'test',
    };
    expect(getEventLabel(event)).toBe('Prompt');
  });

  it('returns correct label for ai_response', () => {
    const event: AIResponseEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'ai_response',
      timestamp: 0,
      sequence: 0,
      content: 'test',
    };
    expect(getEventLabel(event)).toBe('AI Response');
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

describe('safeParseBuildlog', () => {
  it('returns null for invalid JSON', () => {
    expect(safeParseBuildlog('not json')).toBeNull();
  });

  it('returns null for invalid schema', () => {
    expect(safeParseBuildlog('{}')).toBeNull();
  });

  it('returns parsed buildlog for valid input', () => {
    const validBuildlog = {
      version: '1.0.0',
      metadata: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        createdAt: '2026-02-01T14:30:00Z',
        durationSeconds: 0,
        editor: 'vscode',
      },
      initialState: { files: [] },
      events: [],
      finalState: { files: [] },
    };
    const result = safeParseBuildlog(JSON.stringify(validBuildlog));
    expect(result).not.toBeNull();
    expect(result?.metadata.title).toBe('Test');
  });
});
