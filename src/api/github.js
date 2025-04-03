import { Console, isLocalMode } from '../utils/browser.js';
import { cache } from './cache.js';

export async function getAnnounceRC() {
    return getRemoteConfiguration('announce');
}

export async function getAmbientsRC() {
    return getRemoteConfiguration('ambients');
}

export async function getOdooRC() {
    return getRemoteConfiguration('odoo');
}

async function getRemoteConfiguration(key, cacheTime = 1 * 24 * 60) {
    const isLocal = await isLocalMode();
    if (isLocal) {
        const d = await import(`../../remoteConfiguration/${key}.json`);
        return d.default;
    }
    const source = `https://raw.githubusercontent.com/MrSweeter/joorney/master/remoteConfiguration/${key}.json`;
    try {
        const { data } = await cache(
            cacheTime,
            async () => {
                const response = await fetch(source);
                if (!response.ok) return {};
                return await response.json();
            },
            `getRemoteConfigurationData_${key}`
        );
        return data;
    } catch (error) {
        Console.critical(`There was a problem with the remote config '${key}' fetch operation:`, error);
    }
    return {};
}
