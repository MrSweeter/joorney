import { baseSettings } from '../../../configuration.js';
import { ToastManager } from '../../../src/toast/index.js';
import { StorageSync } from '../../../src/utils/browser.js';
import { t } from '../../../src/utils/i18n.js';
import { sleep } from '../../../src/utils/util.js';

export async function loadPage(_features, currentSettings) {
    await ToastManager.load();

    handleToastMode(currentSettings.toastMode);
    handleToastType(JSON.parse(currentSettings.toastType));
}

let joorneyCurrentToastMode;

function handleToastMode(mode) {
    const radioButtons = document.querySelectorAll('.joorney-toast-mode-control input[type="radio"]');
    for (const radio of radioButtons) {
        radio.checked = mode === radio.value;
        if (radio.checked) joorneyCurrentToastMode = mode;
        radio.onchange = (e) => {
            joorneyCurrentToastMode = e.target.value;
            StorageSync.set({ toastMode: joorneyCurrentToastMode });
            ToastManager.load();
        };
    }

    document.getElementById('joorney-toast-mode-showme').onclick = () => showMockToast();
}

function handleToastType(types) {
    const checkboxes = document.querySelectorAll('.joorney-toast-mode-control input[type="checkbox"]');
    for (const checkbox of checkboxes) {
        checkbox.checked = types[checkbox.dataset.toastType];
        checkbox.onchange = (e) => {
            StorageSync.set({
                toastType: JSON.stringify({ ...types, [e.target.dataset.toastType]: e.target.checked }),
            });
            ToastManager.load();
        };
    }
}

async function showMockToast() {
    if (!joorneyCurrentToastMode) return;
    let { toastType } = await StorageSync.get('toastType');
    toastType = toastType ? JSON.parse(toastType) : baseSettings.toastType;

    if (
        ToastManager.info(
            'options-demo-info',
            t('optionsNotifications_demo_info_title'),
            t('optionsNotifications_demo_info_message'),
            true
        )
    )
        await sleep(500);
    if (
        ToastManager.warn(
            'options-demo-warn',
            t('optionsNotifications_demo_warn_title'),
            t('optionsNotifications_demo_warn_message'),
            true
        )
    )
        await sleep(500);

    if (
        ToastManager.error(
            'options-demo-error',
            t('optionsNotifications_demo_error_title'),
            t('optionsNotifications_demo_error_message'),
            true
        )
    )
        await sleep(500);

    if (toastType.success) {
        ToastManager.success(
            'options-demo-success',
            t('optionsNotifications_demo_success_title'),
            t('optionsNotifications_demo_success_message'),
            true
        );
    }
}

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-toast',
    tour: 'tour_toasts',
    labelKey: 'options_menu_notifications',
    path: './pages/toast/index.html',
    loader: loadPage,
};
