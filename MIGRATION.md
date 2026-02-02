# Migration Guide: v1 → v2

This guide explains how to migrate from Buildlog format v1 to v2.

## Why the Breaking Change?

**v1 was the wrong approach.** It captured everything — full file contents, line-by-line diffs, complete AI responses — resulting in 130MB files for a 20-minute session. This made buildlogs impractical to share and impossible for other agents to consume.

**v2 captures what matters:** The prompts are the artifact. The code is ephemeral and non-deterministic. We capture the workflow, not the output.

## What Changed

| Aspect | v1 | v2 |
|--------|----|----|
| File size | 10-130 MB | 2-50 KB |
| Primary artifact | Code diffs | Prompts |
| AI responses | Full text | Summary (optional full) |
| File contents | Full snapshots | Names only |
| Structure | `events[]` | `steps[]` |
| States | `initialState`, `finalState` | Removed |
| Outcome | None | Required `outcome` |
| Format | Single | `slim` or `full` |

## Schema Changes

### Root Structure

```typescript
// v1
interface BuildlogFile {
  version: "1.0.0";
  metadata: BuildlogMetadata;
  initialState: BuildlogState;  // ❌ Removed
  events: BuildlogEvent[];      // Renamed to steps
  finalState: BuildlogState;    // ❌ Removed
}

// v2
interface BuildlogFile {
  version: "2.0.0";
  format: "slim" | "full";      // ✅ New
  metadata: BuildlogMetadata;
  steps: BuildlogStep[];        // Renamed from events
  outcome: BuildlogOutcome;     // ✅ New
}
```

### Metadata

```typescript
// v1
interface BuildlogMetadata {
  // ...existing fields...
  aiProviders?: AIProvider[];   // ❌ Changed to singular
  primaryLanguage?: string;     // ❌ Renamed
  languages?: string[];         // ❌ Removed
  project?: BuildlogProject;    // ❌ Removed
  updatedAt?: string;           // ❌ Removed
  custom?: Record<string, unknown>; // ❌ Removed
}

// v2
interface BuildlogMetadata {
  // ...existing fields...
  aiProvider: AIProvider;       // ✅ Singular, required
  language?: string;            // ✅ Renamed from primaryLanguage
  framework?: string;           // ✅ New
  replicable: boolean;          // ✅ New, required
  dependencies?: string[];      // ✅ New
}
```

### Events → Steps

v1 had 10 event types. v2 has 6 step types:

| v1 Event | v2 Step | Notes |
|----------|---------|-------|
| `prompt` | `prompt` | Context field simplified |
| `ai_response` | `action` | Now captures summary, not full response |
| `code_change` | (merged into `action`) | File paths only, no diffs in slim |
| `file_create` | (merged into `action`) | Just `filesCreated[]` |
| `file_delete` | (merged into `action`) | Just `filesDeleted[]` |
| `file_rename` | (merged into `action`) | Part of file lists |
| `terminal` | `terminal` | Outcome-focused, no full output in slim |
| `note` | `note` | Categories updated |
| `checkpoint` | `checkpoint` | Now has required `summary` |
| `error` | `error` | Simplified, no `category` |

### Removed Entirely

- `BuildlogState` — No more file snapshots
- `FileSnapshot` — No file contents stored
- `CodeBlock` — AI response parsing removed
- `TokenUsage` — Usage tracking removed
- `LinesChanged` — Diff metrics removed
- `TextSelection` — Selection tracking removed
- `NoteReference` — File line references removed

## Automatic Conversion

If you have v1 buildlogs, you can convert them with the CLI:

```bash
# Convert v1 to v2 (extracts prompts, summarizes actions)
buildlog convert old-session.buildlog --output new-session.buildlog

# Convert full to slim (strips file contents and diffs)
buildlog convert verbose.buildlog --slim --output slim.buildlog
```

## Manual Conversion

To manually convert a v1 buildlog:

1. **Change version**: `"1.0.0"` → `"2.0.0"`
2. **Add format**: Add `"format": "slim"`
3. **Remove states**: Delete `initialState` and `finalState`
4. **Rename events**: Change `events` to `steps`
5. **Convert events to steps**:
   - Keep `prompt` events as `prompt` steps
   - Merge `ai_response`, `code_change`, `file_create`, `file_delete`, `file_rename` into `action` steps
   - Convert `terminal` events (remove full output)
   - Keep `note`, `checkpoint`, `error` with updated structure
6. **Add outcome**: Create an `outcome` object summarizing the session

### Example Conversion

```typescript
// v1
{
  version: "1.0.0",
  metadata: { ... },
  initialState: { files: [...] },
  events: [
    { type: "prompt", content: "Add login" },
    { type: "ai_response", content: "...", codeBlocks: [...] },
    { type: "file_create", filePath: "auth.ts", content: "..." }
  ],
  finalState: { files: [...] }
}

// v2
{
  version: "2.0.0",
  format: "slim",
  metadata: { ..., aiProvider: "claude", replicable: true },
  steps: [
    { type: "prompt", content: "Add login" },
    { 
      type: "action", 
      summary: "Created authentication module",
      filesCreated: ["auth.ts"]
    }
  ],
  outcome: {
    status: "success",
    summary: "Added authentication module",
    filesCreated: 1,
    filesModified: 0,
    canReplicate: true
  }
}
```

## Breaking Changes Summary

1. **Version literal changed**: `"1.0.0"` → `"2.0.0"`
2. **Format field required**: Must specify `"slim"` or `"full"`
3. **States removed**: No `initialState` or `finalState`
4. **Events renamed to steps**: And reduced from 10 types to 6
5. **Outcome required**: Must include session outcome
6. **Metadata changes**: `aiProvider` singular and required, `replicable` required
7. **File contents removed**: Only paths stored, not contents (in slim mode)
8. **AI responses as summaries**: Full response only in full mode

## Questions?

If you have buildlogs that can't be easily converted, please open an issue at [github.com/buildlog/types](https://github.com/buildlog/types/issues).
