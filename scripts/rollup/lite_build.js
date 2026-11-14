/**
 * Lite feature build helpers, shared by rollup.lite.config.mjs and scripts/zip_lite.js.
 */

export const LITE_BUILD_OUTPUT = 'bundle-lite';

/**
 * @param {string} featureEnv FEATURE environment variable, comma-separated feature ids
 * @returns {string[]}
 */
export function parseFeatureIDs(featureEnv) {
    return [...new Set((featureEnv ?? '').split(',').map((f) => f.trim()))].filter(Boolean);
}

export function getLiteBuildName(featureIDs) {
    return featureIDs.join('_');
}
