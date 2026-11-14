import {
    getFeaturesListResponse,
    importFeatureBackgroundFile,
    loadFeaturesConfiguration,
} from '../../configuration.js';
import { createContextMenu, updateContext } from '../../src/contextmenu/manager.js';
import { MESSAGE_ACTION } from '../../src/utils/messaging.js';
import { updateTabState } from './keyboard_shortcut.js';
import { openRunbotAdminDebug } from './runbot.js';

export async function handleMessage(message, sender) {
    if (message.action) return handleAction(message, sender);
    return Promise.resolve();
}

async function handleAction(message, sender) {
    let callback = Promise.resolve();

    switch (message.action) {
        case MESSAGE_ACTION.TO_BACKGROUND.GET_FEATURES_LIST: {
            callback = getFeaturesListResponse();
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.OPEN_RUNBOT_ADMIN_DEBUG: {
            callback = openRunbotAdminDebug(message, sender);
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.UPDATE_EXT_STATUS: {
            callback = updateTabState(message, sender);
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.RECREATE_MENU: {
            callback = createContextMenu('messaging');
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.TRIGGER_FEATURE: {
            if (!message.feature) return undefined;
            callback = handleFeature(message.feature, sender.tab, message.args);
            break;
        }
        case MESSAGE_ACTION.TO_BACKGROUND.TAB_LOADED: {
            if (!sender.tab) return undefined;
            callback = updateContext(sender.tab.id);
            break;
        }
    }

    return callback;
}

async function handleFeature(feature, tab, args) {
    const features = await loadFeaturesConfiguration();
    if (!features.some((f) => f.id === feature)) return undefined;

    const featureModule = await importFeatureBackgroundFile(feature);
    return featureModule.load(tab, args);
}
