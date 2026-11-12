import { escapeHTML, stringToHTML } from '../html_generator.js';
import { featureName, t } from '../utils/i18n.js';
import ToastStyle from './toast.css';

const html = String.raw;

export const toastFadeInOutDurationMillis = 500;
export const toastDelayMillis = 100;
export const toastDurationMillis = 3000;

// Keep in sync with toast.css
export const ToastContainerElementID = 'joorney-toast-container';

// Date.now() alone collides when two toasts are created in the same millisecond
let toastCounter = 0;
export function generateToastID(prefix) {
    toastCounter += 1;
    return `${prefix}-${Date.now()}-${toastCounter}`;
}
// Keep in sync with toast.css
const ToastItemElementClass = 'joorney-toasty';

const iconForType = {
    success: 'fa fa-check-circle',
    danger: 'fa fa-exclamation-circle',
    warning: 'fa fa-exclamation-triangle',
    info: 'fa fa-info-circle',
};

const ToastContainer = html`
    <div id="${ToastContainerElementID}">
        <style>${ToastStyle}</style>
    </div>
`.trim();

export function buildContainer() {
    const container = stringToHTML(ToastContainer);
    // Timings stay defined in JS (also used by toast/index.js), toast.css reads them through variables
    container.style.setProperty('--joorney-toast-duration', `${toastDurationMillis}ms`);
    container.style.setProperty(
        '--joorney-toast-progress-delay',
        `${toastDelayMillis + toastFadeInOutDurationMillis}ms`
    );
    return container;
}

// 'notification': Joorney own notifications; other ids without name (options demo) fall back to the id
function getToastBadge(feature) {
    return feature === 'notification' ? t('toast_badgeNotification') : featureName({ id: feature });
}

export function buildToastItem(feature, title, message, type, large) {
    const toastID = generateToastID('toast');
    const textHeight = !large ? 'height: 20px; white-space: nowrap;' : '';
    const item = stringToHTML(html`
        <div id="${toastID}" class="${ToastItemElementClass} ${ToastItemElementClass}-${type} alert alert-${type}">
            <div class="toast-icon"><i class="${iconForType[type]}"></i></div>
            <div class="toast-content">
                <div>
                    <strong>Joorney: </strong>
                    <span class="toast-feature">
                        <span class="badge rounded-pill">${escapeHTML(getToastBadge(feature))}</span>
                    </span>
                </span>
                <div class="toast-title">${escapeHTML(title)}</div>
                <div
                    class="toast-text"
                    style="${textHeight}"
                >${escapeHTML(message)}</div>
            </div>
            <button id="close-${toastID}" class="toast-close"><i class="fa-solid fa-xmark"></i></button>
            <div class="toast-progress"></div>
        </div>
    `);
    return item;
}
