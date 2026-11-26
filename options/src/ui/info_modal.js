import { escapeHTML } from '../../../src/html_generator.js';
import { featureDescription, featureDetails, featureName, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { UI_EVENTS } from './events.js';
import { featureChipsHTML, featurePageURL, stateBadgeHTML } from './feature_card.js';
import { getFeatureState } from './state.js';

/**
 * Feature info modal: video (or the big icon), name, details, category, tags, versions and state.
 * One at a time; Escape, the backdrop, "Done" and the close button close it, focus goes back to the opener.
 */

const MODAL_TITLE_ID = 'joorney-info-modal-title';
const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], iframe, [tabindex]:not([tabindex="-1"])';
const VIDEO_FILE = /\.(mp4|webm|ogg)$/i;
let current;

function videoURL(feature) {
    if (!feature.video) return undefined;
    try {
        const url = new URL(feature.video);
        return url.protocol === 'https:' ? url : undefined;
    } catch {
        return undefined;
    }
}

function mediaHTML(feature, name) {
    const url = videoURL(feature);
    if (url && VIDEO_FILE.test(url.pathname)) {
        return `<div class="joorney-modal-media"><video controls preload="metadata" src="${escapeHTML(url.href)}" aria-label="${escapeHTML(t('optionsUi_infoVideo', name))}"></video></div>`;
    }
    if (url) {
        return `<div class="joorney-modal-media"><iframe src="${escapeHTML(url.href)}" title="${escapeHTML(t('optionsUi_infoVideo', name))}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    return `
        <div class="joorney-modal-media">
            ${iconHTML(feature.icon, { filled: true })}
            <span class="joorney-modal-media-caption">${escapeHTML(t('optionsUi_videoSoon'))}</span>
        </div>
    `;
}

function modalHTML(feature, settings, openPage) {
    const name = featureName(feature);
    const description = featureDescription(feature);
    const details = featureDetails(feature);
    const state = settings ? getFeatureState(settings, feature) : undefined;
    return `
        <div class="joorney-modal-backdrop">
            <div class="joorney-modal" role="dialog" aria-modal="true" aria-labelledby="${MODAL_TITLE_ID}">
                <div class="joorney-modal-header">
                    <span class="joorney-icon-box joorney-fcard-icon">${iconHTML(feature.icon, { filled: true })}</span>
                    <h2 id="${MODAL_TITLE_ID}" class="joorney-modal-title">${escapeHTML(name)}</h2>
                    <button type="button" class="joorney-icon-btn" data-modal-close aria-label="${escapeHTML(t('options_close'))}" title="${escapeHTML(t('options_close'))}">
                        ${iconHTML('close')}
                    </button>
                </div>
                ${mediaHTML(feature, name)}
                <div class="joorney-modal-body">
                    <div class="joorney-chips">
                        ${featureChipsHTML(feature)}
                        ${state ? stateBadgeHTML(state, { short: false, limited: feature.limited }) : ''}
                    </div>
                    ${description ? `<p class="joorney-modal-lead">${escapeHTML(description)}</p>` : ''}
                    ${details ? `<p>${escapeHTML(details)}</p>` : ''}
                </div>
                <div class="joorney-modal-footer">
                    ${openPage ? `<a class="joorney-btn is-secondary" href="${escapeHTML(featurePageURL(feature.id))}" data-modal-close>${escapeHTML(t('optionsUi_action_openPage'))}</a>` : ''}
                    <button type="button" class="joorney-btn" data-modal-close data-modal-focus>${escapeHTML(t('optionsUi_done'))}</button>
                </div>
            </div>
        </div>
    `;
}

export function closeInfoModal() {
    if (!current) return;
    const { backdrop, returnFocus, cleanup, onClose } = current;
    current = undefined;
    cleanup();
    backdrop.remove();
    document.body.classList.remove('joorney-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
    onClose?.();
}

export function openInfoModal(feature, settings = undefined, { openPage = true, returnFocus, onClose } = {}) {
    const opener = returnFocus ?? document.activeElement;
    closeInfoModal();

    const template = document.createElement('template');
    template.innerHTML = modalHTML(feature, settings, openPage).trim();
    const backdrop = template.content.firstElementChild;
    const dialog = backdrop.querySelector('[role="dialog"]');

    const onClick = (event) => {
        // Backdrop click, or any [data-modal-close]: links keep their default action (routing)
        if (event.target === backdrop || event.target.closest('[data-modal-close]')) closeInfoModal();
    };
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeInfoModal();
            return;
        }
        if (event.key !== 'Tab') return;
        // Light focus trap: wrap around inside the dialog
        const focusables = Array.from(dialog.querySelectorAll(FOCUSABLE));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables.at(-1);
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    backdrop.addEventListener('click', onClick);
    backdrop.addEventListener('keydown', onKeyDown);
    document.addEventListener(UI_EVENTS.PAGE_CHANGE, closeInfoModal);

    document.body.appendChild(backdrop);
    document.body.classList.add('joorney-modal-open');
    current = {
        backdrop,
        returnFocus: opener,
        onClose,
        cleanup: () => document.removeEventListener(UI_EVENTS.PAGE_CHANGE, closeInfoModal),
    };
    backdrop.querySelector('[data-modal-focus]')?.focus();

    return { element: dialog, close: closeInfoModal };
}
