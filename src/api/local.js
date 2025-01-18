import { Console, StorageLocal } from '../utils/browser';
import { hasUnknownKey } from '../utils/util';

// Private
const LOCAL_DEFAULT = {
    journey_announces: {},
    offs: [],
    ambient_dates: {},
    joorney_sunrise: 0,
    joorney_sunset: 23 * 60 + 59,
    joorney_date: '',
    joorneyLocalCacheCall: {},
};

async function setLocal(obj) {
    if (hasUnknownKey(obj, LOCAL_DEFAULT)) {
        Console.warn(`Unknown local key in: ${JSON.stringify(obj)}`);
    }
    await StorageLocal.set(obj);
}

// Developer
export async function getStorageUsage(...keysArg) {
    const keys = Array.from(keysArg);
    const usage = await StorageLocal.getBytesInUse(keys && keys.length > 0 ? keys : undefined);
    return usage;
}
export async function getLocal() {
    return await StorageLocal.get(LOCAL_DEFAULT);
}

// Announce
export async function getAnnounceCloseStatus(hash) {
    const { journey_announces } = await StorageLocal.get({ journey_announces: LOCAL_DEFAULT.journey_announces });
    return journey_announces[hash] ?? false;
}

export async function closeAnnounce(announce) {
    const { journey_announces } = await StorageLocal.get({ journey_announces: LOCAL_DEFAULT.journey_announces });
    journey_announces[announce.hash] = true;
    await StorageLocal.set({ journey_announces });
}

// Off website
export async function getWebsiteOff() {
    const { offs } = await StorageLocal.get({ offs: LOCAL_DEFAULT.offs });
    return new Set(offs);
}

export async function updateWebsiteOff(origin, disabled) {
    const offs = await getWebsiteOff();
    if (disabled) offs.add(origin);
    else offs.delete(origin);
    await StorageLocal.set({ offs: Array.from(offs) });
}

// Cache
export async function getLocalCache() {
    const { joorneyLocalCacheCall } = await StorageLocal.get({
        joorneyLocalCacheCall: LOCAL_DEFAULT.joorneyLocalCacheCall,
    });
    return joorneyLocalCacheCall;
}
export async function setLocalCache(cacheData) {
    await setLocal({ joorneyLocalCacheCall: cacheData });
}

// Ambient
export async function getAmbientDates() {
    const { ambient_dates } = await StorageLocal.get({ ambient_dates: LOCAL_DEFAULT.ambient_dates });
    return ambient_dates;
}
export async function setAmbientDates(datesData) {
    await setLocal({ ambient_dates: datesData });
}

// ThemeSwitch
export async function getSunSchedule() {
    const cached = await StorageLocal.get({
        joorney_sunrise: LOCAL_DEFAULT.joorney_sunrise,
        joorney_sunset: LOCAL_DEFAULT.joorney_sunset,
        joorney_date: LOCAL_DEFAULT.joorney_date,
    });
    return cached;
}

export async function setSunSchedule(scheduleData) {
    await setLocal(scheduleData);
}
