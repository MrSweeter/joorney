import { Console } from '../../src/utils/browser.js';

export async function getFinalRunbotURL(request) {
    try {
        const response = await fetch(request.href, {
            method: 'HEAD',
        });
        return { url: response.url };
    } catch (ex) {
        Console.warn(ex);
        return { url: null, error: ex.toString() };
    }
}
