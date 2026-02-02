/** Current buildlog schema version */
export const BUILDLOG_VERSION = '2.0.0';

/** Default capture format */
export const BUILDLOG_DEFAULT_FORMAT = 'slim';

/** MIME type for buildlog files */
export const BUILDLOG_MIME_TYPE = 'application/vnd.buildlog+json';

/** Valid file extensions for buildlog files */
export const BUILDLOG_EXTENSIONS = ['.buildlog', '.vibe'];

/** Default file extension */
export const BUILDLOG_DEFAULT_EXTENSION = '.buildlog';

/** Maximum recommended file size for slim buildlogs (100KB warning threshold) */
export const BUILDLOG_MAX_SLIM_SIZE_BYTES = 100 * 1024;

/** Maximum recommended file size for full buildlogs (50MB) */
export const BUILDLOG_MAX_FULL_SIZE_BYTES = 50 * 1024 * 1024;

/** Maximum recommended steps per buildlog */
export const BUILDLOG_MAX_STEPS = 500;

/** Maximum title length */
export const BUILDLOG_MAX_TITLE_LENGTH = 200;

/** Maximum description length */
export const BUILDLOG_MAX_DESCRIPTION_LENGTH = 2000;

/** Maximum tags */
export const BUILDLOG_MAX_TAGS = 20;

/** Maximum tag length */
export const BUILDLOG_MAX_TAG_LENGTH = 50;

/** Files/patterns that should always be ignored during capture */
export const BUILDLOG_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/coverage/**',
  '**/*.lock',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/*.log',
  '**/.env*',
  '**/*.map',
  '**/.DS_Store',
  '**/Thumbs.db',
];
