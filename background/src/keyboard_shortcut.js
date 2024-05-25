import { Action, Commands, StorageLocal, Tabs } from '../../src/utils/browser.ts';

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

export async function updateTabState(request) {
    const tabs = await Tabs.query({ active: true, currentWindow: true });
    if (!tabs) return;
    const tab = tabs[0];
    enableDisableTabExtension(tab, request.forceSwitchToOFF);
}

async function enableDisableTabExtension(tab, forceOff = undefined) {
    const tabId = tab.id;
    const origin = new URL(tab.url).origin;

    let isOFF = (await Action.getBadgeText({ tabId: tabId })) === 'OFF';
    if (forceOff) {
        isOFF = false;
    }

    let { offs } = await StorageLocal.get({ offs: [] });
    offs = new Set(offs);

    const badgeText = { tabId: tabId, text: isOFF ? '' : 'OFF' };

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

    if (forceOff === undefined) {
        Tabs.reload(tabId);
    }
}
