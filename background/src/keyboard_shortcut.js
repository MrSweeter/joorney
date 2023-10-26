import { Action, StorageLocal, Tabs, I18N } from '../../utils/browser.js';

export async function updateTabState(request) {
    const tabs = await Tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0].id;
    const origin = new URL(tabs[0].url).origin;
    const offText_i18n = I18N.getMessage('keyboardShortcut_Background_StateOff');

    let isOFF = (await Action.getBadgeText({ tabId: tabId })) === offText_i18n;
    if (request.forceSwitchToOFF) {
        isOFF = false;
    }

    let { offs } = await StorageLocal.get({ offs: [] });
    offs = new Set(offs);

    const badgeText = { tabId: tabId, text: isOFF ? '' : offText_i18n };

    if (isOFF) {
        Action.enable(tabId);
        offs = offs.delete(origin);
    } else {
        Action.disable(tabId);
        offs.add(origin);
    }

    await Action.setBadgeText(badgeText);
    await Action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#FF0000',
    });

    await StorageLocal.set({ offs: Array.from(offs) });

    if (request.forceSwitchToOFF === undefined) {
        Tabs.reload(tabId);
    }
}
