import { features, importFeatureBackgroundFile } from '../../configuration.js';
import { createContextMenu, updateContext } from '../../src/contextmenu/manager.js';
import { MESSAGE_ACTION } from '../../src/utils/messaging.js';
import { updateTabState } from './keyboard_shortcut.js';
import { getFinalRunbotURL } from './runbot.js';

export async function handleMessage(message, sender) {
    if (message.action) return handleAction(message, sender);
    return undefined;
}

async function handleAction(message, sender) {
    let callback = undefined;

    switch (message.action) {
        case MESSAGE_ACTION.TO_BACKGROUND.GET_FEATURES_LIST: {
            callback = Promise.resolve({ features: features });
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.GET_FINAL_RUNBOT_URL: {
            callback = getFinalRunbotURL(message);
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.UPDATE_EXT_STATUS: {
            callback = updateTabState(message);
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.RECREATE_MENU: {
            callback = createContextMenu();
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.TRIGGER_FEATURE: {
            if (!message.feature) return undefined;
            callback = handleFeature(message.feature, sender.tab);
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.TAB_LOADED: {
            callback = updateContext(sender.tab.id);
            break;
        }
    }

    return callback;
}

async function handleFeature(feature, tab) {
    if (!features.some((f) => f.id === feature)) return undefined;

    return importFeatureBackgroundFile(feature).then((featureModule) => {
        featureModule.load(tab);
    });
}
