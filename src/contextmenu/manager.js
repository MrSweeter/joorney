import { features } from '../../configuration.js';
import { clearHost } from '../api/cache.js';
import { isAuthorizedFeature } from '../utils/authorize.js';
import { ContextMenus, Runtime, StorageSync, sendTabMessage } from '../utils/browser.js';
import { MESSAGE_ACTION } from '../utils/messaging.js';
import { sanitizeURL } from '../utils/util.js';
import { clearLocalCacheMenuItem, optionMenuItem, separatorMenuItem } from './item.js';

const CONTEXT_MENU_DYNAMIC_ITEM_IDS = [];

export async function disableDynamicItems() {
    return Promise.all(CONTEXT_MENU_DYNAMIC_ITEM_IDS.map((id) => ContextMenus.update(id, { visible: false })));
}

export async function createContextMenu() {
    await ContextMenus.removeAll();
    CONTEXT_MENU_DYNAMIC_ITEM_IDS.length = 0;

    const items = [];
    const dynamicItems = await getItems();

    for (const item of dynamicItems.filter((i) => !i.parentId)) {
        items.push(
            createContextMenuItem({
                id: item.id,
                title: item.title ?? item.path ?? 'Unknown item',
                contexts: item.contexts ?? ['all'],
                visible: false,
            })
        );
        CONTEXT_MENU_DYNAMIC_ITEM_IDS.push(item.id);
    }

    for (const item of dynamicItems.filter((i) => i.parentId)) {
        items.push(
            createContextMenuItem({
                id: item.id,
                title: item.title ?? item.path ?? 'Unknown item',
                contexts: item.contexts ?? ['all'],
                visible: false,
                parentId: item.parentId,
            })
        );
        CONTEXT_MENU_DYNAMIC_ITEM_IDS.push(item.id);
    }

    if (dynamicItems.length > 0) items.push(createContextMenuItem(separatorMenuItem));
    items.push(createContextMenuItem(clearLocalCacheMenuItem));
    items.push(createContextMenuItem(optionMenuItem));

    await Promise.all(items);
}

export async function updateContextMenu(tab, isOdoo = undefined) {
    const dynamicItems = await getItems(tab);

    const itemsUpdate = [];
    for (const item of dynamicItems) {
        itemsUpdate.push(
            ContextMenus.update(item.id, {
                visible: isOdoo === true && item.active,
                title: item.title ?? item.path ?? 'Unknown item',
                parentId: null,
            })
        );
    }
    await Promise.all(itemsUpdate);
}

export async function onContextMenuItemClick(info, tab) {
    const itemId = info.menuItemId;

    switch (itemId) {
        case optionMenuItem.id: {
            Runtime.openOptionsPage();
            return;
        }
        case clearLocalCacheMenuItem.id: {
            clearHost(new URL(tab.url).host);
            return;
        }
    }

    const items = await getItems(tab, false);
    const item = items[itemId];
    if (item.path) {
        sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.CM_OPEN_MENU, { menupath: item.path });
    }
}

async function createContextMenuItem(createProperties) {
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/create
    // https://developer.chrome.com/docs/extensions/reference/api/contextMenus#method-create
    // TODO switch to await when Promise flow is release
    return new Promise((resolve) => {
        try {
            ContextMenus.create(createProperties, resolve);
        } catch {
            resolve();
        }
    });
}

async function getItems(tab = undefined, toArray = true) {
    const featureItems = await getFeaturesItems(tab);

    if (!toArray) return featureItems;

    const items = Object.values(featureItems).sort((a, b) => {
        if (a.parentId && !b.parentId) return 1;
        if (!a.parentId && b.parentId) return -1;
        return a.order - b.order;
    });
    return items;
}

async function getFeaturesItems(tab) {
    let url = undefined;
    if (tab) {
        if (!tab.url) return {};
        url = sanitizeURL(tab.url);
        if (!url.origin || !url.origin.startsWith('http')) return;
    }

    const contextFeatures = features.filter((f) => f.trigger.context);
    const allFavorite = contextFeatures.length === 1;

    const result = {};
    for (const feature of contextFeatures) {
        const isActive = url !== undefined && (await isAuthorizedFeature(feature.id, url));

        const defaultSettings = await StorageSync.get(feature.defaultSettings);

        const id = `joorney_cm_${feature.id}`;
        const menus = defaultSettings[`${feature.id}ContextMenu`];
        if (!menus) continue;

        if (Object.keys(menus).length <= 0) continue;
        const menusArray = Object.values(menus);
        const activeMenuCount = menusArray.filter((m) => m.active).length;
        const activeFavoriteCount = menusArray.filter((m) => m.favorite).length;

        const parentActive = !allFavorite && activeFavoriteCount !== activeMenuCount;
        result[id] = {
            id: id,
            title: feature.display_name,
            contexts: ['all'],
            order: Number.MAX_SAFE_INTEGER,
            active: isActive && parentActive,
        };

        for (const menu of menusArray) {
            result[menu.id] = {
                ...menu,
                parentId: parentActive ? (menu.favorite ? undefined : id) : undefined,
                active: isActive && menu.active,
            };
        }
    }
    return result;
}
