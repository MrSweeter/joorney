import { ContextMenus } from '../../src/utils/browser.ts';

export const CLEAR_CACHE_HOST_ID_MENU = 'clear_cache_host';

export async function createClearHostCache() {
    await ContextMenus.removeAll();
    await ContextMenus.create({
        id: CLEAR_CACHE_HOST_ID_MENU,
        title: 'Clear cache for this host',
        contexts: ['all'],
    });
}
