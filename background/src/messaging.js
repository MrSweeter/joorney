import { features } from '../../configuration.js';
import { updateTabState } from './keyboard_shortcut.js';
import { getFinalRunbotURL } from './runbot.js';
import { MESSAGE_ACTION } from '../../src/utils/messaging.js';

export async function handleMessage(message, _, sendResponse) {
    let callback = undefined;
    console.log(message);

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

    console.log(callback);

    return callback;
}
