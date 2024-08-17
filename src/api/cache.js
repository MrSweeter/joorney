import { Runtime, StorageLocal } from '../utils/browser.js';

function getHost() {
    if (typeof window === 'undefined') return `joorney://${Runtime.id}`; // Background
    return window.location.host;
}

export async function getCache() {
    const { joorneyLocalCacheCall } = await StorageLocal.get('joorneyLocalCacheCall');
    return joorneyLocalCacheCall ?? {};
}

async function setCache(cache) {
    await StorageLocal.set({ joorneyLocalCacheCall: cache ?? {} });
}

// Clear host if last change is 12h hours old
async function _checkHostsExpiration(cache, now) {
    let hasChange = false;
    for (const [k, v] of Object.entries(cache)) {
        if (now - (v.lastChange ?? 0) > 12 * 60 * 60 * 1000) {
            delete cache[k];
            hasChange = true;
        }
    }
    return { changed: hasChange, cache: cache };
}

export async function checkHostsExpiration() {
    let cache = await getCache();
    cache = await _checkHostsExpiration(cache, Date.now());
    if (cache.changed) setCache(cache.cache);
}

export async function clearHost(host) {
    const cache = await getCache();
    delete cache[host];
    await setCache(cache);
}

export async function saveCacheCall(expireAfterMinute, call, result, ...params) {
    const hash = btoa(JSON.stringify(params));
    const host = getHost();

    let cache = await getCache();

    const now = Date.now();

    cache[host] ??= {};
    cache[host][call] ??= {};
    cache[host][call][hash] = {
        date: now,
        dateStr: new Date(now).toISOString(),
        expireAfterMinute: expireAfterMinute ?? 0,
        data: btoa(JSON.stringify(result)),
    };
    cache[host].lastChange = now;

    cache = await _checkHostsExpiration(cache, now);
    await setCache(cache.cache);
}

export async function readCacheCall(call, ...params) {
    const hash = btoa(JSON.stringify(params));
    const host = getHost();
    let cache = await getCache();
    cache = cache?.[host]?.[call]?.[hash];
    if (!cache) return undefined;
    const { date, expireAfterMinute, data } = cache;

    const now = Date.now();
    if (now - date > expireAfterMinute * 60 * 1000) return undefined;
    return JSON.parse(atob(data));
}
