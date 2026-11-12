import { getWebsiteOff, updateWebsiteOff } from '../../src/api/local.js';
import { Action, Commands, Tabs } from '../../src/utils/browser.js';
import { resolveLanguage, translate } from '../../src/utils/i18n.js';

// Only use this function during the initial install phase. After
// installation the user may have intentionally unassigned commands.
export function checkCommandShortcuts() {
    Commands.getAll((commands) => {
        const missingShortcuts = [];

        for (const { name, shortcut } of commands) {
            if (shortcut === '') {
                missingShortcuts.push(name);
            }
        }

        if (missingShortcuts.length > 0) {
            // Update the extension UI to inform the user that one or more
            // commands are currently unassigned.
        }
    });
}

export function handleCommands() {
    Commands.onCommand.addListener((command, tab) => {
        switch (command) {
            case 'enable-disable-temporary':
                if (!tab) return;
                enableDisableTabExtension(tab);
                break;
        }
    });
}

export async function updateTabState(request, sender) {
    // Use the tab which sent the request, the active tab may be another one (background tab loading)
    let tab = sender?.tab;
    if (!tab) {
        const tabs = await Tabs.query({ active: true, currentWindow: true });
        tab = tabs?.[0];
    }
    if (!tab) return;
    await enableDisableTabExtension(tab, request.forceSwitchToOFF);
}

async function enableDisableTabExtension(tab, forceOff = undefined) {
    const tabId = tab.id;
    const origin = new URL(tab.url).origin;

    // State from the persisted origins (also used by the content script on load), the badge text is translated
    let isOFF = (await getWebsiteOff()).has(origin);
    if (forceOff) {
        isOFF = false;
    }

    const lang = await resolveLanguage({ origin });
    const badgeText = { tabId: tabId, text: isOFF ? '' : translate(lang, 'badge_off') };

    if (isOFF) {
        Action.enable(tabId);
    } else {
        Action.disable(tabId);
    }
    await Action.setBadgeText(badgeText);
    await Action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#FF0000',
    });

    updateWebsiteOff(origin, !isOFF);

    if (forceOff === undefined) {
        Tabs.reload(tabId);
    }
}
