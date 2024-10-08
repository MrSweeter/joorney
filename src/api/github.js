import { Console } from '../utils/browser';
import { cache } from './cache';

export async function getAnnounceData() {
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
        Console.critical('There was a problem with the fetch operation:', error);
    }
    return {};
}
