import { regexSchemePrefix } from '../../src/utils/authorize.js';

/**
 * Host (origin) input rules shared by every options page that adds a host to 'originsFilterOrigins'.
 * Errors carry an i18n key, so each page renders them its own way.
 */

// i18n keys of the errors (the *Key names let scripts/i18n_check.js see them)
const ORIGIN_ERRORS = {
    missingKey: 'options_error_missingOrigin',
    invalidKey: 'options_error_invalidOrigin',
    invalidRegexKey: 'optionsHosts_error_invalidRegex',
    existsKey: 'optionsHosts_error_originExists',
};

export class OriginError extends Error {
    constructor(messageKey, cause = undefined) {
        super(messageKey, { cause });
        this.name = 'OriginError';
        this.messageKey = messageKey;
    }
}

export function isRegexOrigin(origin) {
    return `${origin ?? ''}`.startsWith(regexSchemePrefix);
}

/**
 * @param {string} value 'regex://<pattern>'
 * @returns {string} the entry with the pattern as RegExp normalised it ('regex://' + source)
 * @throws {OriginError} invalid regular expression
 */
function validateRegexOrigin(value) {
    const pattern = `${value}`.trim().slice(regexSchemePrefix.length);
    // An empty pattern is stored as 'regex://(?:)', which matches every origin
    if (!pattern) throw new OriginError(ORIGIN_ERRORS.invalidRegexKey);
    try {
        return regexSchemePrefix + new RegExp(pattern).source;
    } catch (ex) {
        throw new OriginError(ORIGIN_ERRORS.invalidRegexKey, ex);
    }
}

export function normalizeOrigin(value) {
    const raw = `${value ?? ''}`.trim();
    if (!raw) throw new OriginError(ORIGIN_ERRORS.missingKey);
    if (isRegexOrigin(raw)) return validateRegexOrigin(raw);

    let url;
    try {
        url = new URL(raw.toLowerCase().replace(/\s/g, ''));
    } catch (ex) {
        throw new OriginError(ORIGIN_ERRORS.invalidKey, ex);
    }
    // Content scripts only run on http(s) pages: 'localhost:8069' parses as a 'localhost:' scheme (opaque 'null'
    // origin), and ftp:, ws: or chrome-extension: hosts would be saved but never match
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new OriginError(ORIGIN_ERRORS.invalidKey);
    return url.origin;
}

export function normalizeNewOrigin(value, origins) {
    const origin = normalizeOrigin(value);
    if (Object.hasOwn(origins ?? {}, origin)) throw new OriginError(ORIGIN_ERRORS.existsKey);
    return origin;
}
