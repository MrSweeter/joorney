import { baseSettings } from '../../configuration.js';
import { ToastMode, ToastType } from '../../lib/joorney/enum';
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

export async function loadToast(versionInfo: GuessVersion) {
    const { isOdoo, version } = versionInfo;
    if (!isOdoo) return;
    if (!version) return;

    const odooSupported = await isSupportedOdoo(version);
    if (!odooSupported) return;
    await ToastManager.load();
}

const existingToast: Toast.Collection = {};
const maximumNotification = 3;

export const ToastManager: Toast.Manager = {
    toastMode: ToastMode.UI,

    async load() {
        const container = buildContainer();
        document.documentElement.appendChild(container);
        this.toastMode = (await StorageSync.get(baseSettings))?.toastMode ?? ToastMode.UI;
    },

    isUI(): boolean {
        return this.toastMode === 'ui';
    },

    info(feature, title, message) {
        this._notify(feature, title, message, ToastType.INFO);
    },

    warn(feature, title, message) {
        this._notify(feature, title, message, ToastType.WARN);
    },

    error(feature, title, message) {
        this._notify(feature, title, message, ToastType.ERROR);
    },

    success(feature, title, message) {
        this._notify(feature, title, message, ToastType.SUCCESS);
    },

    async _notify(feature, title, message, type) {
        const existing = Object.entries(existingToast).find((entry) => entry[1].msg === message);
        if (existing) {
            if (existing[1].id) clearTimeout(existing[1].id);
            const toast = document.getElementById(existing[0]) as HTMLDivElement;
            const features = toast.getElementsByClassName('toast-feature')[0] as HTMLDivElement;
            const featureBadge = stringToHTML(`
                <span class="badge rounded-pill">${feature}</span>
            `);
            features.appendChild(featureBadge);

            const progress = toast.getElementsByClassName('toast-progress')[0] as HTMLDivElement;
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
        existingToast[itemID].msg = message;
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
        setTimeout(() => {
            delete existingToast[itemID];
        }, 10000);
    },

    _show(toastID): NodeJS.Timeout {
        const toast = document.getElementById(toastID) as HTMLDivElement;

        toast.style.display = 'flex';
        toast.style.transform = 'translateX(200%)';
        toast.style.transition = `transform ${toastFadeInOutDurationMillis}ms ease-in-out, opacity ${toastFadeInOutDurationMillis}ms ease-in-out`;
        setTimeout(() => {
            toast.style.transform = 'translateX(0%)';
            toast.style.opacity = '1';
        }, toastDelayMillis);

        (document.getElementById(`close-${toastID}`) as HTMLButtonElement).onclick = () => this._hide(toastID);
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
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            delete existingToast[toastID];
        }, toastDelayMillis + toastFadeInOutDurationMillis);
    },
};
