import { StorageSync } from '../../../src/utils/browser.ts';

export async function loadPage(features, currentSettings) {
    handleToastMode(currentSettings.toastMode);
}

function handleToastMode(mode) {
    const toastModeInput = document.getElementById('joorney-toast-mode');
    toastModeInput.checked = mode === 'ui';
    toastModeInput.onchange = (e) => {
        StorageSync.set({ toastMode: e.target.checked ? 'ui' : 'log' });
    };
}
