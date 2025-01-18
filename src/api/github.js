import { Console, isLocalMode } from '../utils/browser.js';
import { cache } from './cache.js';

export async function getAnnounceData() {
    const isLocal = await isLocalMode();
    if (isLocal) {
        const d = await import('../../store/announce.json');
        return d.default;
    }
    const source = 'https://raw.githubusercontent.com/MrSweeter/joorney/master/store/announce.json';
    try {
        const { data } = await cache(
            1 * 24 * 60,
            async () => {
                const response = await fetch(source);
                if (!response.ok) return {};
                return await response.json();
            },
            'getAnnounceData'
        );
        return data;
    } catch (error) {
        Console.critical('There was a problem with the fetch announce operation:', error);
    }
    return {};
}

export async function getOdooData() {
    const isLocal = await isLocalMode();
    if (isLocal) {
        const d = await import('../../store/odoo.json');
        return d.default;
    }
    const source = 'https://raw.githubusercontent.com/MrSweeter/joorney/master/store/odoo.json';
    try {
        const { data } = await cache(
            1 * 24 * 60,
            async () => {
                const response = await fetch(source);
                if (!response.ok) return {};
                return await response.json();
            },
            'getOdooData'
        );
        return data;
    } catch (error) {
        Console.critical('There was a problem with the fetch odoo-version operation:', error);
    }
    return {};
}
