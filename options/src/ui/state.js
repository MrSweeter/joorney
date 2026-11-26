import { originMatches } from '../../../src/utils/authorize.js';
import { StorageSync } from '../../../src/utils/browser.js';
import { isRegexOrigin, normalizeNewOrigin, normalizeOrigin } from '../origins.js';
import { dispatchUIEvent, UI_EVENTS } from './events.js';

/**
 * Feature state for the options pages and the popup host list: the only writer of '<id>WhitelistMode' and
 * 'originsFilterOrigins' (besides import and migration, which replace the settings). '<id>Enabled' is also written
 * by the popup feature switches (src/generic/popup.js) and by the install (background/index.js).
 *
 * Storage model:
 * - '<id>Enabled': active or deactivated
 * - '<id>WhitelistMode': true = only on listed hosts, false = everywhere except listed hosts
 * - 'originsFilterOrigins': { origin: { featureId: true } }, origin may be 'regex://<pattern>'
 *
 * Functions taking "features" accept an id, a feature configuration or an array of them. Pass the
 * configuration for limited (runbot) features: they have no mode, only '<id>Enabled' is written for them.
 */

export const FEATURE_STATE = {
    EVERYWHERE: 'everywhere',
    LISTED: 'listed',
    DEACTIVATED: 'deactivated',
};

export const FEATURE_MODE = {
    EVERYWHERE: FEATURE_STATE.EVERYWHERE,
    LISTED: FEATURE_STATE.LISTED,
};

const enabledKey = (id) => `${id}Enabled`;
const modeKey = (id) => `${id}WhitelistMode`;
const toId = (feature) => (typeof feature === 'string' ? feature : feature.id);
const isLimited = (feature) => typeof feature === 'object' && Boolean(feature?.limited);
const toArray = (features) => (Array.isArray(features) ? features : [features]);
// Runtime fallback of src/utils/authorize.js authorizeFeature, it differs from defaultSettings (false)
const storedListedMode = (settings, id) => settings[modeKey(id)] ?? true;

//#region Read
export function runtimeStateDefaults(features) {
    const defaults = { originsFilterOrigins: {} };
    for (const feature of features) {
        defaults[enabledKey(feature.id)] = false;
        if (!feature.limited) defaults[modeKey(feature.id)] = true;
    }
    return defaults;
}

export async function readStateSettings(features, settings = {}) {
    const stored = await StorageSync.get(runtimeStateDefaults(features));
    return { ...settings, ...stored };
}

export function getFeatureMode(settings, feature) {
    if (isLimited(feature)) return FEATURE_MODE.LISTED;
    return storedListedMode(settings, toId(feature)) ? FEATURE_MODE.LISTED : FEATURE_MODE.EVERYWHERE;
}

export function getFeatureState(settings, feature) {
    if (!settings[enabledKey(toId(feature))]) return FEATURE_STATE.DEACTIVATED;
    return getFeatureMode(settings, feature);
}

export function listHosts(settings) {
    return Object.keys(settings.originsFilterOrigins ?? {});
}

export function isListed(settings, host, id) {
    return settings.originsFilterOrigins?.[host]?.[id] === true;
}

// The regex entries of an 'originsFilterOrigins' object, listed once: the pages read the settings fresh from
// storage (readStateSettings) and never change them in place, so one object always has the same entries.
// The advanced grid asks for every host x feature cell: scanning every host for each was O(hosts^2 x features)
const regexEntriesOf = new WeakMap();

function regexEntries(settings) {
    const origins = settings.originsFilterOrigins ?? {};
    if (!regexEntriesOf.has(origins)) regexEntriesOf.set(origins, Object.keys(origins).filter(isRegexOrigin));
    return regexEntriesOf.get(origins);
}

export function getListingHosts(settings, host, id) {
    const own = isListed(settings, host, id) ? [host] : [];
    if (isRegexOrigin(host)) return own;
    const matching = regexEntries(settings).filter(
        (entry) => entry !== host && isListed(settings, entry, id) && originMatches([entry], host)
    );
    return [...own, ...matching];
}

export function isActiveOnHost(settings, feature, host) {
    const id = toId(feature);
    if (!settings[enabledKey(id)]) return false;
    if (isLimited(feature)) return originMatches(feature.limitedOrigins ?? [], host);

    // Same as authorize.js isOriginListedForFeature (the entry itself or a matching regex entry), without
    // scanning every host
    const listed = isRegexOrigin(host) ? isListed(settings, host, id) : getListingHosts(settings, host, id).length > 0;
    return getFeatureMode(settings, feature) === FEATURE_MODE.LISTED ? listed : !listed;
}
//#endregion

//#region Write
// Read-modify-write of shared keys: serialize the writes of the page so fast clicks don't lose one.
// Exported for the pages that read-modify-write other keys (ambientStatus, supported versions)
let writeQueue = Promise.resolve();
export function enqueue(task) {
    const run = writeQueue.then(task);
    writeQueue = run.catch(() => undefined);
    return run;
}

function notify(type, detail) {
    dispatchUIEvent(UI_EVENTS.STATE_CHANGE, { type, ...detail });
}

function writeFeatures(type, features, compute) {
    const list = toArray(features);
    return enqueue(async () => {
        // Keys, not defaults: a missing mode must stay missing to get the runtime fallback
        const stored = await StorageSync.get(list.flatMap((f) => [enabledKey(toId(f)), modeKey(toId(f))]));

        const changes = {};
        for (const feature of list) {
            const id = toId(feature);
            const current = { enabled: Boolean(stored[enabledKey(id)]), listed: storedListedMode(stored, id) };
            const next = compute(current);
            changes[enabledKey(id)] = Boolean(next.enabled);
            // Both keys, always: the mode fallbacks differ between runtime (true) and defaultSettings (false)
            if (!isLimited(feature)) changes[modeKey(id)] = Boolean(next.listed);
        }
        await StorageSync.set(changes);
        notify(type, { ids: list.map(toId), changes });
        return changes;
    });
}

export function setFeatureState(features, state) {
    if (!Object.values(FEATURE_STATE).includes(state)) throw new Error(`Unknown feature state '${state}'`);
    return writeFeatures('state', features, (current) =>
        state === FEATURE_STATE.DEACTIVATED
            ? { enabled: false, listed: current.listed }
            : { enabled: true, listed: state === FEATURE_STATE.LISTED }
    );
}

export function setFeatureActive(features, on) {
    return writeFeatures('active', features, (current) => ({ enabled: on, listed: current.listed }));
}

export function setFeatureMode(features, mode) {
    if (!Object.values(FEATURE_MODE).includes(mode)) throw new Error(`Unknown feature mode '${mode}'`);
    return writeFeatures('mode', features, (current) => ({
        enabled: current.enabled,
        listed: mode === FEATURE_MODE.LISTED,
    }));
}

// isListed(stored, id): whether the host lists the feature once written. Only true is stored, the rest is deleted
function writeHostListing(host, ids, isListed) {
    return enqueue(async () => {
        const stored = await StorageSync.get(['originsFilterOrigins', ...ids.map(modeKey)]);
        const origins = stored.originsFilterOrigins ?? {};

        const known = Object.hasOwn(origins, host);
        const key = known ? host : normalizeOrigin(host);
        const entry = { ...(origins[key] ?? {}) };
        for (const id of ids) {
            if (isListed(stored, id)) entry[id] = true;
            else delete entry[id];
        }
        // An unknown host that lists nothing has nothing to store
        if (!Object.hasOwn(origins, key) && Object.keys(entry).length === 0) return { host: key, entry };

        origins[key] = entry;
        await StorageSync.set({ originsFilterOrigins: origins });
        notify('host', { ids, host: key, changes: { originsFilterOrigins: origins } });
        return { host: key, entry };
    });
}

// on: whether the feature runs on the host, the listing follows the mode of each feature
export function setHostFeatures(host, features, on) {
    const ids = toArray(features)
        .filter((f) => !isLimited(f))
        .map(toId);
    return writeHostListing(host, ids, (stored, id) => (storedListedMode(stored, id) ? on : !on));
}

// listedById: { featureId: listed }, the listing itself. The popup switches show the list, not where the feature runs
export function setHostListing(host, listedById) {
    return writeHostListing(host, Object.keys(listedById), (_stored, id) => Boolean(listedById[id]));
}

export function setHostFeature(host, feature, on) {
    return setHostFeatures(host, [feature], on);
}

export function addHost(origin) {
    return enqueue(async () => {
        const { originsFilterOrigins: origins } = await StorageSync.get({ originsFilterOrigins: {} });
        const key = normalizeNewOrigin(origin, origins);
        origins[key] = {};
        await StorageSync.set({ originsFilterOrigins: origins });
        notify('host-add', { ids: [], host: key, changes: { originsFilterOrigins: origins } });
        return key;
    });
}

export function removeHost(origin) {
    return enqueue(async () => {
        const { originsFilterOrigins: origins } = await StorageSync.get({ originsFilterOrigins: {} });
        if (!Object.hasOwn(origins, origin)) return false;
        const ids = Object.keys(origins[origin]);
        delete origins[origin];
        await StorageSync.set({ originsFilterOrigins: origins });
        notify('host-remove', { ids, host: origin, changes: { originsFilterOrigins: origins } });
        return true;
    });
}

export function renameHost(from, to) {
    return enqueue(async () => {
        const { originsFilterOrigins: origins } = await StorageSync.get({ originsFilterOrigins: {} });
        if (!Object.hasOwn(origins, from)) return false;
        const key = normalizeNewOrigin(to, origins);
        const renamed = Object.fromEntries(Object.entries(origins).map(([k, v]) => [k === from ? key : k, v]));
        await StorageSync.set({ originsFilterOrigins: renamed });
        notify('host-rename', {
            ids: Object.keys(origins[from]),
            host: key,
            changes: { originsFilterOrigins: renamed },
        });
        return key;
    });
}
//#endregion
