/**
 * Keys of 'unfocusAppOrigins' (one sync item for every host, 8 KB): an origin, or one of the lists below.
 * Shared by the content script (home menu stars) and the options page (remembered apps).
 */

// "Share between hosts": one list for every host
export const SHARED_ORIGIN = 'unfocus_app_shared';
// Every runbot build is a new origin that is never visited again: they share one list instead of filling the item
export const RUNBOT_BUILDS_ORIGIN = 'unfocus_app_runbot_builds';
// Same builds as the runbot features (impersonateLoginRunbot, adminDebugLoginRunbot limitedOrigins)
const RUNBOT_BUILD = /^https:\/\/[\w-]+\.runbot\d{3}\.odoo\.com$/;

export function isRunbotBuild(origin) {
    return RUNBOT_BUILD.test(origin);
}

export function storageOrigin(origin, shareEnabled) {
    if (shareEnabled) return SHARED_ORIGIN;
    return isRunbotBuild(origin) ? RUNBOT_BUILDS_ORIGIN : origin;
}

export function mergeRunbotBuilds(origins) {
    for (const origin of Object.keys(origins)) {
        if (!isRunbotBuild(origin)) continue;
        origins[RUNBOT_BUILDS_ORIGIN] = { ...origins[origin], ...origins[RUNBOT_BUILDS_ORIGIN] };
        delete origins[origin];
    }
    return origins;
}
