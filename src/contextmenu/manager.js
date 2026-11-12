import { loadFeaturesConfiguration } from '../../configuration.js';
import { clearHost } from '../api/cache.js';
import { openRunbotWithVersionMenuItem } from '../features/autoOpenRunbot/configuration.js';
import { isAuthorizedFeature, isAuthorizedLimitedFeature } from '../utils/authorize.js';
import { Console, ContextMenus, Runtime, StorageSync, Tabs, sendTabMessage } from '../utils/browser.js';
import { featureName, getLanguage, resolveLanguage, translate } from '../utils/i18n.js';
import { MESSAGE_ACTION } from '../utils/messaging.js';
import { sanitizeURL } from '../utils/util.js';
import { clearLocalCacheMenuItem, optionMenuItem, separatorMenuItem } from './item.js';

const CONTEXT_MENU_DYNAMIC_ITEM_IDS = [];
// Serialize menu (re)creation: overlapping removeAll/create calls fail with "duplicate id"
let menuBuild = Promise.resolve();
// Only the latest context update is applied (tab activation, window focus and tab load fire together)
let updateGeneration = 0;

export async function disableDynamicItems() {
    return Promise.all(CONTEXT_MENU_DYNAMIC_ITEM_IDS.map((id) => ContextMenus.update(id, { visible: false })));
}

export function createContextMenu(initiator) {
    menuBuild = menuBuild.then(() => buildContextMenu(initiator)).catch((err) => Console.error(err));
    return menuBuild;
}

async function buildContextMenu(initiator) {
    await ContextMenus.removeAll();
    CONTEXT_MENU_DYNAMIC_ITEM_IDS.length = 0;

    const items = [];
    // Built without tab: system or static language, updateContext switches to the tab language ('odoo' mode)
    const lang = await resolveLanguage();
    const dynamicItems = await getItems(undefined, true, lang);

    for (const item of dynamicItems.filter((i) => !i.parentId)) {
        items.push(
            createContextMenuItem(
                {
                    id: item.id,
                    title: item.title ?? item.path ?? translate(lang, 'contextMenu_unknownItem'),
                    contexts: item.contexts ?? ['all'],
                    visible: false,
                },
                initiator
            )
        );
        CONTEXT_MENU_DYNAMIC_ITEM_IDS.push(item.id);
    }

    for (const item of dynamicItems.filter((i) => i.parentId)) {
        items.push(
            createContextMenuItem(
                {
                    id: item.id,
                    title: item.title ?? item.path ?? translate(lang, 'contextMenu_unknownItem'),
                    contexts: item.contexts ?? ['all'],
                    visible: false,
                    parentId: item.parentId,
                },
                initiator
            )
        );
        CONTEXT_MENU_DYNAMIC_ITEM_IDS.push(item.id);
    }

    if (dynamicItems.length > 0) items.push(createContextMenuItem(separatorMenuItem, initiator));
    items.push(
        createContextMenuItem(
            { ...clearLocalCacheMenuItem, title: translate(lang, 'contextMenu_clearCache') },
            initiator
        )
    );
    items.push(
        createContextMenuItem({ ...optionMenuItem, title: translate(lang, 'contextMenu_openOptions') }, initiator)
    );

    await Promise.all(items);
}

export async function updateContext(tabId) {
    const generation = ++updateGeneration;

    try {
        await menuBuild;
        await disableDynamicItems();

        const tab = await Tabs.get(tabId);
        if (!tab.active) return;
        if (!tab.url.startsWith('http')) return;
        const lang = await resolveLanguage({ origin: new URL(tab.url).origin });
        if (generation !== updateGeneration) return;
        await updateStaticItems(lang);
        const odooInfo = await sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.REQUEST_ODOO_INFO);
        if (!odooInfo || !odooInfo.isOdoo) return;
        if (generation !== updateGeneration) return;
        await updateContextMenu(tab, odooInfo.isOdoo, odooInfo.version, generation, lang);
    } catch (error) {
        // Error: No tab with id (from Tabs.get) is expected
        if (`${error}`.includes(tabId)) Console.log(`background.js - updateContext: ${error}`);
        else Console.error(error);
    }
}

async function updateStaticItems(lang) {
    await Promise.all([
        ContextMenus.update(clearLocalCacheMenuItem.id, { title: translate(lang, 'contextMenu_clearCache') }),
        ContextMenus.update(optionMenuItem.id, { title: translate(lang, 'contextMenu_openOptions') }),
    ]);
}

async function updateContextMenu(tab, isOdoo, version, generation, lang) {
    const dynamicItems = await getItems(tab, true, lang);
    if (generation !== updateGeneration) return;

    const itemsUpdate = [];
    for (const item of dynamicItems) {
        itemsUpdate.push(
            ContextMenus.update(item.id, {
                visible: isOdoo === true && item.active,
                title: formatTitle(item.title ?? item.path ?? translate(lang, 'contextMenu_unknownItem'), { version }),
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
        case openRunbotWithVersionMenuItem.id: {
            sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.CM_OPEN_RUNBOT);
            return;
        }
    }

    const items = await getItems(tab, false);
    const item = items[itemId];
    if (item?.path) {
        sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.CM_OPEN_MENU, { menupath: item.path });
    }
}

function formatTitle(title, args) {
    const placeholders = ['%version%'];
    let finalTitle = title;
    for (const p of placeholders) {
        finalTitle = finalTitle.replaceAll(p, args[p.replaceAll('%', '')]);
    }
    return finalTitle;
}

async function createContextMenuItem(createProperties, initiator) {
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/create
    // https://developer.chrome.com/docs/extensions/reference/api/contextMenus#method-create
    // TODO switch to await when Promise flow is release
    return new Promise((resolve, reject) => {
        ContextMenus.create(createProperties, () => {
            const err = Runtime.lastError;
            if (err) {
                console.error(`initiator: ${initiator}\n${err}`);
                reject(`initiator: ${initiator}\n${err}`);
                return;
            }
            resolve();
        });
    });
}

async function getItems(tab = undefined, toArray = true, lang = undefined) {
    const featureItems = await getFeaturesItems(tab, lang);

    if (!toArray) return featureItems;

    const items = Object.values(featureItems).sort((a, b) => {
        if (a.parentId && !b.parentId) return 1;
        if (!a.parentId && b.parentId) return -1;
        return a.order - b.order;
    });
    return items;
}

async function getFeaturesItems(tab, lang) {
    let url = undefined;
    if (tab) {
        if (!tab.url) return {};
        url = sanitizeURL(tab.url);
        if (!url.origin || !url.origin.startsWith('http')) return {};
    }

    const features = await loadFeaturesConfiguration();
    const contextFeatures = features.filter((f) => f.trigger.context);
    const allFavorite = contextFeatures.length === 1;

    const result = {};
    for (const feature of contextFeatures) {
        const isActive = feature.limited
            ? await isAuthorizedLimitedFeature(feature.id, feature.limitedOrigins, url)
            : await isAuthorizedFeature(feature.id, url);

        const defaultSettings = await StorageSync.get(feature.defaultSettings);

        const id = `joorney_cm_${feature.id}`;
        const menus = defaultSettings[`${feature.id}ContextMenu`];
        if (!menus) continue;

        if (Object.keys(menus).length <= 0) continue;
        const menusArray = Object.values(menus);
        const activeMenuCount = menusArray.filter((m) => m.active).length;
        const activeFavoriteCount = menusArray.filter((m) => m.favorite).length;

        const parentActive = !allFavorite && activeFavoriteCount !== activeMenuCount && activeMenuCount > 1;
        result[id] = {
            id: id,
            title: featureName(feature, lang),
            contexts: ['all'],
            order: Number.MAX_SAFE_INTEGER,
            active: isActive && parentActive,
        };

        for (const menu of menusArray) {
            result[menu.id] = {
                ...menu,
                // Built-in entry, not editable by the user: show the translated title instead of the
                // English copy saved in storage at install. Remove if this title ever becomes editable.
                ...(menu.id === openRunbotWithVersionMenuItem.id && {
                    title: translate(lang ?? getLanguage(), 'autoOpenRunbot_menu_openWithVersion'),
                }),
                parentId: parentActive ? (menu.favorite ? undefined : id) : undefined,
                active: isActive && menu.active,
            };
        }
    }
    return result;
}
