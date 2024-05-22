import { stringToHTML } from '../html_generator.js';

const html = String.raw;
const css = String.raw;

export const toastFadeInOutDurationMillis = 500;
export const toastDelayMillis = 100;
export const toastDurationMillis = 3000;

export const ToastContainerElementID = 'joorney-toast-container';
const ToastItemElementClass = 'joorney-toasty';

const iconForType = {
    success: 'fa fa-check-circle',
    danger: 'fa fa-exclamation-circle',
    warning: 'fa fa-exclamation-triangle',
    info: 'fa fa-info-circle',
};

const ToastStyle = css`
    #${ToastContainerElementID} {
        display: flex;
        flex-direction: column;
        padding: 16px;
        position: fixed;
        top: 10px;
        width: 100%;
        z-index: 9999;
        pointer-events: none;
        font-family: Roboto, sans-serif;
    }

    .${ToastItemElementClass} {
        display: none;
        opacity: 0;
        align-self: end;
        padding: 16px;
        margin-bottom: 10px;
        border-radius: 4px;
        min-width: 300px;
        max-width: 600px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
        pointer-events: auto;
    }

    .${ToastItemElementClass}-success .toast-progress {
        background-color: #4caf50;
    }

    .${ToastItemElementClass}-danger .toast-progress {
        background-color: #f44336;
    }

    .${ToastItemElementClass}-info .toast-progress {
        background-color: #2196f3;
    }

    .${ToastItemElementClass}-warning .toast-progress {
        background-color: #ff9800;
    }

    .toast-icon {
        margin-right: 10px;
        font-size: 24px;
    }

    .toast-content {
        flex-grow: 1;
        align-content: center;
    }

    .toast-title {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .toast-text {}

    .toast-feature span {
        background-color: rgba(128, 128, 128, .25);
    }

    .toast-close {
        cursor: pointer;
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 16px;
        background: transparent;
        border: none;
    }

    .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 5px;
        animation: progressBar ${toastDurationMillis}ms linear forwards;
        animation-delay: ${toastDelayMillis + toastFadeInOutDurationMillis}ms;
    }

    @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
    }
  `.trim();

const ToastContainer = html`
    <div id="${ToastContainerElementID}">
        <style>${ToastStyle}</style>
    </div>
`.trim();

export function buildContainer() {
    const container = stringToHTML(ToastContainer);
    return container;
}

export function buildToastItem(feature, title, message, type) {
    const toastID = `toast-${Date.now()}`;
    const item = stringToHTML(html`
        <div id="${toastID}" class="${ToastItemElementClass} ${ToastItemElementClass}-${type} alert-${type}">
            <div class="toast-icon"><i class="${iconForType[type]}"></i></div>
            <div class="toast-content">
                <div class="toast-feature">
                    <span class="badge rounded-pill">${feature}</span>
                </div>
                <div class="toast-title">${title}</div>
                <div class="toast-text">${message}</div>
            </div>
            <button id="close-${toastID}" class="toast-close"><i class="fa-solid fa-xmark"></i></button>
            <div class="toast-progress"></div>
        </div>
    `);
    return item;
}
