# @buildlog/types

Type definitions and Zod schemas for the `.buildlog` file format.

## Installation

```bash
npm install @buildlog/types
# or
pnpm add @buildlog/types
```

## Usage

### TypeScript Types

```typescript
import type { BuildlogFile, BuildlogEvent, PromptEvent } from '@buildlog/types';

const buildlog: BuildlogFile = {
  version: '1.0.0',
  metadata: { /* ... */ },
  initialState: { files: [] },
  events: [],
  finalState: { files: [] },
};
```

### Validation

```typescript
import { validateBuildlog, parseBuildlog } from '@buildlog/types';

// Validate unknown data
const result = validateBuildlog(data);
if (result.valid) {
  console.log('Valid buildlog!');
} else {
  console.error('Errors:', result.errors);
}

// Parse and validate JSON
const buildlog = parseBuildlog(jsonString);
```

### Utilities

```typescript
import { 
  isBuildlogFile,
  computeStats,
  formatDuration,
  detectLanguage,
} from '@buildlog/types';

isBuildlogFile('session.buildlog'); // true
detectLanguage('app.tsx'); // 'typescript'
formatDuration(125); // '2:05'
```

## File Format

See [buildlog.ai/docs/format](https://buildlog.ai/docs/format) for the full specification.

## License

MIT
