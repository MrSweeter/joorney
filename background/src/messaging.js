import { features, importFeatureBackgroundFile } from '../../configuration.js';
import { MESSAGE_ACTION } from '../../src/utils/messaging';
import { updateTabState } from './keyboard_shortcut.js';
import { getFinalRunbotURL } from './runbot.js';

export async function handleMessage(message, sender) {
    if (message.action) return handleAction(message);
    if (message.feature) return handleFeature(message, sender.tab);

    return undefined;
}

async function handleAction(message) {
    let callback = undefined;

    switch (message.action) {
        case MESSAGE_ACTION.GET_FEATURES_LIST: {
            callback = Promise.resolve({ features: features });
            break;
        }
        case MESSAGE_ACTION.GET_FINAL_RUNBOT_URL: {
            callback = getFinalRunbotURL(message);
            break;
        }
        case MESSAGE_ACTION.UPDATE_EXT_STATUS: {
            callback = updateTabState(message);
            break;
        }
    }

    return callback;
}

async function handleFeature(message, tab) {
    if (!features.some((f) => f.id === message.feature)) return undefined;

    return importFeatureBackgroundFile(message.feature).then((featureModule) => {
        featureModule.load(tab);
    });
}
