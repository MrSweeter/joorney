import { baseSettings } from '../../configuration.js';
import { stringToHTML } from '../html_generator.js';
import { isSupportedOdoo } from '../utils/authorize.js';
import { StorageSync } from '../utils/browser.js';
import {
    ToastContainerElementID,
    buildContainer,
    buildToastItem,
    toastDelayMillis,
    toastDurationMillis,
    toastFadeInOutDurationMillis,
} from './html.js';

export async function loadToast(versionInfo) {
    const { isOdoo, version } = versionInfo;
    if (!isOdoo) return;
    if (!version) return;

    const odooSupported = await isSupportedOdoo(version);
    if (!odooSupported) return;
    await ToastManager.load();
}

const existingToast = {};
const maximumNotification = 3;

export const ToastManager = {
    async load() {
        const container = buildContainer();
        document.documentElement.appendChild(container);
        this.toastMode = (await StorageSync.get(baseSettings))?.toastMode ?? 'ui';
    },

    isUI() {
        return this.toastMode === 'ui';
    },

    info(feature, title, message) {
        this._notify(feature, title, message, 'info');
    },

    warn(feature, title, message) {
        this._notify(feature, title, message, 'warning');
    },

    error(feature, title, message) {
        this._notify(feature, title, message, 'danger');
    },

    success(feature, title, message) {
        this._notify(feature, title, message, 'success');
    },

    async _notify(feature, title, message, type) {
        const existing = Object.entries(existingToast).find((entry) => entry[1].msg === message);
        if (existing) {
            if (existing[1].id) clearTimeout(existing[1].id);
            const features = document.getElementById(existing[0]).getElementsByClassName('toast-feature')[0];
            const featureBadge = stringToHTML(`
                <span class="badge rounded-pill">${feature}</span>
            `);
            features.appendChild(featureBadge);

            const progress = document.getElementById(existing[0]).getElementsByClassName('toast-progress')[0];
            progress.style.animation = 'none';
            progress.offsetWidth; // force re-render
            progress.style.animation = '';
            existingToast[existing[0]].id = setTimeout(() => {
                this._hide(existing[0]);
            }, toastDurationMillis + toastFadeInOutDurationMillis);

            return;
        }

        const isUI = this.isUI();
        if (!isUI || Object.keys(existingToast).length >= maximumNotification) {
            this._logs(feature, title, message, type);
            return;
        }

        const container = document.getElementById(ToastContainerElementID);
        if (!container) return;
        const item = buildToastItem(feature, title, message, type);
        container.appendChild(item);
        const toastID = item.id;
        existingToast[toastID] = { msg: message, id: this._show(toastID) };
    },

    _logs(feature, title, message, type) {
        const itemID = `log-${Date.now()}`;
        existingToast[itemID] = message;
        switch (type) {
            case 'info':
                console.info(`(${feature})\n${title}\n${message}`);
                break;
            case 'danger':
                console.log(`[${type}] (${feature})\n${title}\n${message}`);
                break;
            case 'warning':
                console.log(`[${type}] (${feature})\n${title}\n${message}`);
                break;
            case 'success':
                console.success(`(${feature})\n${title}\n${message}`);
                break;
            default:
                console.log(`[${type}] (${feature})\n${title}\n${message}`);
        }
        setTimeout(() => {
            delete existingToast[itemID];
        }, 10000);
    },

    _show(toastID) {
        const toast = document.getElementById(toastID);
        if (!toast) return;

        toast.style.display = 'flex';
        toast.style.transform = 'translateX(200%)';
        toast.style.transition = `transform ${toastFadeInOutDurationMillis}ms ease-in-out, opacity ${toastFadeInOutDurationMillis}ms ease-in-out`;
        setTimeout(() => {
            toast.style.transform = 'translateX(0%)';
            toast.style.opacity = 1;
        }, toastDelayMillis);

        document.getElementById(`close-${toastID}`).onclick = () => this._hide(toastID);
        toast.onclick = () => this._hide(toastID);

        return setTimeout(
            () => {
                this._hide(toastID);
            },
            toastDelayMillis + toastFadeInOutDurationMillis + toastDurationMillis
        );
    },

    _hide(toastID) {
        const toast = document.getElementById(toastID);
        if (!toast) return;
        toast.style.transform = 'translateX(200%)';
        toast.style.opacity = 0;
        setTimeout(() => {
            toast.remove();
            delete existingToast[toastID];
        }, toastDelayMillis + toastFadeInOutDurationMillis);
    },
};
