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
        const existElement = document.getElementById(container.id);
        if (existElement) existElement.remove();

        document.documentElement.appendChild(container);
        this.toastMode = (await StorageSync.get(baseSettings))?.toastMode ?? 'ui';
        this.toastType = JSON.parse((await StorageSync.get(baseSettings))?.toastType);
    },

    isDisabled() {
        return this.toastMode === 'disabled';
    },

    isLogConsole() {
        return this.toastMode === 'log';
    },

    isLargeMode() {
        return this.toastMode === 'large-ui';
    },

    info(feature, title, message, force = false) {
        return this._notify(feature, title, message, 'info', force);
    },

    warn(feature, title, message, force = false) {
        return this._notify(feature, title, message, 'warning', force);
    },

    error(feature, title, message, force = false) {
        return this._notify(feature, title, message, 'danger', force);
    },

    success(feature, title, message, force = false) {
        return this._notify(feature, title, message, 'success', force);
    },

    async _notify(feature, title, message, type, force) {
        if (this.isDisabled()) return false;
        if (!this.toastType[type]) return false;

        const existing = Object.entries(existingToast).find((entry) => entry[1].msg === message);
        if (existing) {
            if (existing[1].id) clearTimeout(existing[1].id);
            const features = document.getElementById(existing[0]).getElementsByClassName('toast-feature')[0];
            const featureBadge = stringToHTML(`
                <span class="badge rounded-pill">${feature}</span>
            `);
            features.appendChild(featureBadge);

            const toast = document.getElementById(existing[0]);
            if (!toast) return true;
            const progress = toast.getElementsByClassName('toast-progress')[0];
            if (!progress) return true;

            progress.style.animation = 'none';
            progress.offsetWidth; // force re-render
            progress.style.animation = '';
            existingToast[existing[0]].id = setTimeout(() => {
                this._hide(existing[0]);
            }, toastDurationMillis + toastFadeInOutDurationMillis);

            return true;
        }

        const isLogConsole = this.isLogConsole();
        if (isLogConsole) {
            this._log(feature, title, message, type);
            return true;
        }

        if (!force && Object.keys(existingToast).length >= maximumNotification) {
            this._log(feature, title, message, type, false);
            this._ui(
                'notification',
                '',
                `You have reached the notification limit (${maximumNotification}). Notification logged to console.`,
                'warning'
            );
            return true;
        }

        if (this.isLargeMode()) {
            this._ui(feature, title, message, type, true);
            return true;
        }

        this._log(feature, title, message, type, false);
        this._ui(feature, title, message, type, false);

        return true;
    },

    _ui(feature, title, message, type, large) {
        const container = document.getElementById(ToastContainerElementID);
        if (!container) return;
        const item = buildToastItem(feature, title, message, type, large);
        container.appendChild(item);
        const toastID = item.id;
        existingToast[toastID] = { msg: message, id: this._show(toastID) };
    },

    _log(feature, title, message, type, antispam = true) {
        const itemID = `log-${Date.now()}`;
        if (antispam) existingToast[itemID] = message;
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
                console.log(`(${feature})\n${title}\n${message}`);
                break;
            default:
                console.log(`[${type}] (${feature})\n${title}\n${message}`);
        }
        if (antispam) {
            setTimeout(() => {
                delete existingToast[itemID];
            }, toastDelayMillis * 1000);
        }
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
