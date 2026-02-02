/** Current buildlog schema version */
export const BUILDLOG_VERSION = '1.0.0';

/** MIME type for buildlog files */
export const BUILDLOG_MIME_TYPE = 'application/vnd.buildlog+json';

/** Valid file extensions for buildlog files */
export const BUILDLOG_EXTENSIONS = ['.buildlog', '.vibe'];

/** Default file extension */
export const BUILDLOG_DEFAULT_EXTENSION = '.buildlog';

/** Maximum recommended file size for a single buildlog (10MB) */
export const BUILDLOG_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum recommended events per buildlog */
export const BUILDLOG_MAX_EVENTS = 10000;

/** Maximum title length */
export const BUILDLOG_MAX_TITLE_LENGTH = 200;

/** Maximum description length */
export const BUILDLOG_MAX_DESCRIPTION_LENGTH = 2000;

/** Maximum tags */
export const BUILDLOG_MAX_TAGS = 20;

/** Maximum tag length */
export const BUILDLOG_MAX_TAG_LENGTH = 50;
