import { StorageSync } from '../../src/utils/browser.js';

/**
 * 'optionsAdvancedHostView' (base setting): Home shows the hosts x features table instead of one host at a time.
 * It is a page preference, not feature state, so it does not go through options/src/ui/state.js.
 */
const KEY = 'optionsAdvancedHostView';

export async function isAdvancedHostView() {
    return Boolean((await StorageSync.get({ [KEY]: false }))[KEY]);
}

export function setAdvancedHostView(on) {
    return StorageSync.set({ [KEY]: Boolean(on) });
}
