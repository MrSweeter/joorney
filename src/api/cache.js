import { StorageLocal } from '../utils/browser.js';

function getHost() {
    return window.location.host;
}

export async function clearHost(host) {
    const { qolLocalCacheCall } = await StorageLocal.get('qolLocalCacheCall');
    if (!qolLocalCacheCall) return;
    delete qolLocalCacheCall[host];
    await StorageLocal.set({ qolLocalCacheCall });
}

export async function saveCacheCall(expireAfterMinute, call, result, ...params) {
    const hash = btoa(JSON.stringify(params));
    const host = getHost();

    let { qolLocalCacheCall } = await StorageLocal.get('qolLocalCacheCall');
    if (!qolLocalCacheCall) qolLocalCacheCall = {};

    qolLocalCacheCall[host] ??= {};
    qolLocalCacheCall[host][call] ??= {};
    qolLocalCacheCall[host][call][hash] = {
        date: Date.now(),
        expireAfterMinute: expireAfterMinute ?? 0,
        data: btoa(JSON.stringify(result)),
    };

    await StorageLocal.set({ qolLocalCacheCall });
}

export async function readCacheCall(call, ...params) {
    const hash = btoa(JSON.stringify(params));
    const host = getHost();

    const { qolLocalCacheCall } = await StorageLocal.get('qolLocalCacheCall');
    const cache = qolLocalCacheCall?.[host]?.[call]?.[hash];
    if (!cache) return undefined;
    const { date, expireAfterMinute, data } = cache;

    const now = Date.now();
    if (now - date > expireAfterMinute * 60 * 1000) return undefined;
    return JSON.parse(atob(data));
}
