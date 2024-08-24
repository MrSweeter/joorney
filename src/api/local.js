import { StorageLocal } from '../utils/browser';

// Announce
export async function getAnnounceCloseStatus(version) {
    const { announces } = await StorageLocal.get({ journey_announces: {} });
    return announces[version] ?? false;
}

export async function closeAnnounce(announce) {
    const { announces } = await StorageLocal.get({ journey_announces: {} });
    announces[announce.hash] = true;
}

// Off website
export async function getWebsiteOff() {
    const { offs } = await StorageLocal.get({ offs: [] });
    return new Set(offs);
}

export async function updateWebsiteOff(origin, disabled) {
    const offs = await getWebsiteOff();
    if (disabled) offs.add(origin);
    else offs.delete(origin);
    await StorageLocal.set({ offs: Array.from(offs) });
}
