import { baseSettings } from '../../../configuration.js';
import {
    buildContainer,
    buildToastItem,
    ToastContainerElementID,
    toastDelayMillis,
    toastDurationMillis,
    toastFadeInOutDurationMillis,
} from '../../../src/toast/html.js';
import { Console, StorageSync } from '../../../src/utils/browser.js';
import { t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { sleep } from '../../../src/utils/util.js';
import { UI_EVENTS } from '../../src/ui/events.js';

// type -> Material icon (Odoo has Font Awesome, the options page does not), Console method, demo strings
const TYPES = {
    info: {
        icon: 'info',
        log: 'info',
        title: () => t('optionsNotifications_demo_info_title'),
        message: () => t('optionsNotifications_demo_info_message'),
    },
    warning: {
        icon: 'warning',
        log: 'warn',
        title: () => t('optionsNotifications_demo_warn_title'),
        message: () => t('optionsNotifications_demo_warn_message'),
    },
    danger: {
        icon: 'error',
        log: 'error',
        title: () => t('optionsNotifications_demo_error_title'),
        message: () => t('optionsNotifications_demo_error_message'),
    },
    success: {
        icon: 'check_circle',
        log: 'info',
        title: () => t('optionsNotifications_demo_success_title'),
        message: () => t('optionsNotifications_demo_success_message'),
    },
};
const hideDelayMillis = toastDelayMillis + toastFadeInOutDurationMillis;

let currentMode = 'ui';
let currentTypes = { ...JSON.parse(baseSettings.toastType) };
// Pending timers of the previews (entrance, hide, hint), cleared with the toasts
let previewTimers = [];

export async function loadPage(_features, currentSettings) {
    currentMode = currentSettings.toastMode ?? baseSettings.toastMode;
    currentTypes = JSON.parse(currentSettings.toastType ?? baseSettings.toastType);

    handleToastMode();
    handleToastType();

    document.getElementById('joorney-toast-mode-showme').onclick = () => showMockToasts();
    for (const button of document.querySelectorAll('[data-toast-preview]')) {
        button.setAttribute(
            'aria-label',
            t('optionsNotifications_previewType', typeLabel(button.dataset.toastPreview))
        );
        button.onclick = () => showMockToast(button.dataset.toastPreview);
    }

    // Toasts and the hint belong to this page only: do not let them linger on the others
    const onPageChange = () => {
        clearPreviews();
        document.removeEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
    };
    document.addEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
}

function typeLabel(type) {
    return document.querySelector(`.joorney-toast-type[data-toast-type="${type}"] .joorney-toast-type-label`)
        .textContent;
}

function handleToastMode() {
    for (const radio of document.querySelectorAll('.joorney-toast-tiles input[type="radio"]')) {
        radio.checked = currentMode === radio.value;
        radio.onchange = () => {
            currentMode = radio.value;
            StorageSync.set({ toastMode: currentMode });
            clearPreviews();
        };
    }
}

function handleToastType() {
    for (const toggle of document.querySelectorAll('.joorney-toast-type .joorney-switch')) {
        const type = toggle.dataset.toastType;
        toggle.setAttribute('aria-checked', String(!!currentTypes[type]));
        toggle.onclick = () => {
            currentTypes = { ...currentTypes, [type]: !currentTypes[type] };
            toggle.setAttribute('aria-checked', String(!!currentTypes[type]));
            StorageSync.set({ toastType: JSON.stringify(currentTypes) });
        };
    }
}

//#region Previews
const hintElement = () => document.getElementById('joorney-toast-hint');

function setHint(text) {
    const hint = hintElement();
    if (hint) hint.textContent = text;
}

// Bumped to stop a running "Show me" sequence (page left, or started again)
let previewRun = 0;

function clearPreviews() {
    previewRun++;
    for (const timer of previewTimers) clearTimeout(timer);
    previewTimers = [];
    document.getElementById(ToastContainerElementID)?.remove();
    setHint('');
}

// Created on demand with the real container, laid out like in Odoo but under the options navbar
function getContainer() {
    let container = document.getElementById(ToastContainerElementID);
    if (container) return container;
    container = buildContainer();
    container.style.top = 'calc(64px + env(safe-area-inset-top, 0px))';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
}

function hideToast(item) {
    item.style.transform = 'translateX(200%)';
    item.style.opacity = 0;
    previewTimers.push(
        setTimeout(() => {
            item.remove();
            if (!document.getElementById(ToastContainerElementID)?.querySelector('.joorney-toasty')) {
                document.getElementById(ToastContainerElementID)?.remove();
            }
        }, hideDelayMillis)
    );
}

// Same entrance, timings and dismissal as ToastManager._show
function showToast(type, title, message) {
    const item = buildToastItem('notification', title, message, type, currentMode === 'large-ui');
    item.querySelector('.toast-icon').innerHTML = iconHTML(TYPES[type].icon, { filled: true });
    item.querySelector('.toast-close').innerHTML = iconHTML('close');
    item.querySelector('.toast-close').setAttribute('aria-label', t('optionsNotifications_close'));
    item.style.display = 'flex';
    item.style.transform = 'translateX(200%)';
    item.style.transition = `transform ${toastFadeInOutDurationMillis}ms ease-in-out, opacity ${toastFadeInOutDurationMillis}ms ease-in-out`;
    getContainer().appendChild(item);

    previewTimers.push(
        setTimeout(() => {
            item.style.transform = 'translateX(0%)';
            item.style.opacity = 1;
        }, toastDelayMillis)
    );
    item.onclick = () => hideToast(item);
    previewTimers.push(setTimeout(() => hideToast(item), hideDelayMillis + toastDurationMillis));
}

function showLog(type, title, message) {
    Console[TYPES[type].log](`Joorney: [${t('toast_badgeNotification')}] ${title}: ${message}`);
    setHint(t('optionsNotifications_loggedHint'));
    previewTimers.push(setTimeout(() => setHint(''), hideDelayMillis + toastDurationMillis));
}
//#endregion

// Shown whatever the type switches say: a preview of a type is how you decide to switch it on
function showMockToast(type) {
    if (currentMode === 'disabled') {
        setHint(t('optionsNotifications_disabledHint'));
        return;
    }
    const title = TYPES[type].title();
    const message = TYPES[type].message();
    setHint('');
    if (currentMode === 'log') showLog(type, title, message);
    else showToast(type, title, message);
}

async function showMockToasts() {
    const run = ++previewRun;
    const types = ['info', 'warning', 'danger'];
    if (currentTypes.success) types.push('success');
    for (const type of types) {
        showMockToast(type);
        await sleep(500);
        if (run !== previewRun) return;
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
