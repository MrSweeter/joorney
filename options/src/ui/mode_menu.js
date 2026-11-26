import { escapeHTML } from '../../../src/html_generator.js';
import { featureName, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { UI_EVENTS } from './events.js';
import { stateHelp, stateLabel } from './feature_card.js';
import {
    FEATURE_STATE,
    getFeatureMode,
    getFeatureState,
    getListingHosts,
    isActiveOnHost,
    listHosts,
    setFeatureState,
} from './state.js';

/**
 * Default menu of a feature: Everywhere / Listed only / Deactivated, each with the result it would have on the
 * hosts. Used wherever the mode must be chosen: the matrix column header, and when activating a feature (Home
 * Activate, feature page switch). Not for limited (runbot) features: they have no mode.
 * One at a time, fixed under its trigger; Escape, Tab and a click outside close it, focus goes back to the trigger.
 */

const STATES = [FEATURE_STATE.EVERYWHERE, FEATURE_STATE.LISTED, FEATURE_STATE.DEACTIVATED];
const PILL_CLASS = { [FEATURE_STATE.EVERYWHERE]: 'is-ev', [FEATURE_STATE.LISTED]: 'is-li' };
const ITEM = '[role^="menuitem"]';
let current;

// The settings as they would be after picking the state, to count the hosts it would run on
function simulate(settings, feature, state) {
    if (state === FEATURE_STATE.DEACTIVATED) return { ...settings, [`${feature.id}Enabled`]: false };
    const listed = state === FEATURE_STATE.LISTED;
    return { ...settings, [`${feature.id}Enabled`]: true, [`${feature.id}WhitelistMode`]: listed };
}

function optionHTML(state, menu) {
    const { feature, settings } = menu;
    const hosts = listHosts(settings);
    const result = simulate(settings, feature, state);
    const count = hosts.filter((h) => isActiveOnHost(result, feature, h)).length;
    const onLabel = count ? t('optionsHome_modeOnCount', `${count}`, `${hosts.length}`) : t('optionsHome_modeOnNone');
    let pills = `<span class="joorney-mode-menu-pill ${count ? (PILL_CLASS[state] ?? '') : ''}">${escapeHTML(onLabel)}</span>`;
    if (state !== FEATURE_STATE.DEACTIVATED) {
        const newHosts = state === FEATURE_STATE.EVERYWHERE ? t('optionsHome_modeNewOn') : t('optionsHome_modeNewOff');
        pills += `<span class="joorney-mode-menu-pill">${escapeHTML(newHosts)}</span>`;
    }
    return `
        <button type="button" role="menuitemradio" class="joorney-mode-menu-opt" aria-checked="${state === menu.state}" data-state="${state}">
            <span class="joorney-mode-menu-mark" aria-hidden="true"></span>
            <span class="joorney-mode-menu-text">
                <span class="joorney-mode-menu-label">${escapeHTML(stateLabel(state))}</span>
                <span class="joorney-mode-menu-help">${escapeHTML(stateHelp(state))}</span>
                <span class="joorney-mode-menu-pills">${pills}</span>
            </span>
        </button>
    `;
}

function menuBodyHTML(menu) {
    const { feature, settings } = menu;
    const name = featureName(feature);
    // Changing the default keeps the exceptions, so they flip
    const exceptions = listHosts(settings).some((h) => getListingHosts(settings, h, feature.id).length > 0);
    const flip = exceptions
        ? `<p class="joorney-mode-menu-foot">${iconHTML('info')}<span>${escapeHTML(t('optionsHome_modeFlip'))}</span></p>`
        : '';
    return `
        <div class="joorney-mode-menu-title" aria-hidden="true">${escapeHTML(name)}</div>
        ${STATES.map((state) => optionHTML(state, menu)).join('')}
        ${flip}
    `;
}

// Fixed: a scrolling box (the matrix) would clip it. Under the trigger, above when there is no room
function place() {
    if (!current) return;
    const { element, trigger } = current;
    if (!trigger.isConnected) {
        closeModeMenu();
        return;
    }
    const anchor = trigger.getBoundingClientRect();
    const { width, height } = element.getBoundingClientRect();
    const left = Math.min(Math.max(8, anchor.left + anchor.width / 2 - width / 2), window.innerWidth - width - 8);
    const below = anchor.bottom + 6;
    const top = below + height > window.innerHeight - 8 ? Math.max(8, anchor.top - height - 6) : below;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
}

// Only the global state: the default then decides where it runs, the host lists are left as they are
async function pick(state) {
    const { feature, settings } = current;
    closeModeMenu({ focusTrigger: true });
    if (state !== getFeatureState(settings, feature)) await setFeatureState(feature, state);
}

export function closeModeMenu({ focusTrigger = false } = {}) {
    if (!current) return;
    const { element, trigger, cleanup, onClose } = current;
    current = undefined;
    cleanup();
    element.remove();
    trigger.setAttribute('aria-expanded', 'false');
    if (focusTrigger && trigger.isConnected) trigger.focus();
    onClose?.();
}

export function openModeMenu({ trigger, feature, settings, onClose }) {
    if (current?.trigger === trigger) {
        closeModeMenu({ focusTrigger: true });
        return undefined;
    }
    closeModeMenu();

    const state = getFeatureState(settings, feature);
    const element = document.createElement('div');
    element.className = 'joorney-mode-menu';
    element.setAttribute('role', 'menu');
    element.setAttribute('aria-label', featureName(feature));
    current = { element, trigger, feature, settings, state, onClose };
    element.innerHTML = menuBodyHTML(current);

    const onMenuClick = (event) => {
        const item = event.target.closest(ITEM);
        if (item) pick(item.dataset.state);
    };
    const onMenuKeyDown = (event) => {
        if (event.key === 'Escape' || event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();
            closeModeMenu({ focusTrigger: true });
            return;
        }
        const items = Array.from(element.querySelectorAll(ITEM));
        const index = items.indexOf(document.activeElement);
        const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 };
        if (!(event.key in moves)) return;
        event.preventDefault();
        items[(moves[event.key] + items.length) % items.length]?.focus();
    };
    // Capture: closes before the page handles the click, which still does what it targets. The trigger toggles
    const onDocumentClick = (event) => {
        const path = event.composedPath();
        if (!path.includes(element) && !path.includes(trigger)) closeModeMenu();
    };
    const onDocumentKeyDown = (event) => {
        if (event.key === 'Escape' && !element.contains(event.target)) closeModeMenu({ focusTrigger: true });
    };
    // Counts would be stale, and a re-render may have replaced the trigger
    const onStale = () => closeModeMenu();

    element.addEventListener('click', onMenuClick);
    element.addEventListener('keydown', onMenuKeyDown);
    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener(UI_EVENTS.STATE_CHANGE, onStale);
    document.addEventListener(UI_EVENTS.PAGE_CHANGE, onStale);
    current.cleanup = () => {
        document.removeEventListener('click', onDocumentClick, true);
        document.removeEventListener('keydown', onDocumentKeyDown);
        document.removeEventListener('scroll', place, true);
        window.removeEventListener('resize', place);
        document.removeEventListener(UI_EVENTS.STATE_CHANGE, onStale);
        document.removeEventListener(UI_EVENTS.PAGE_CHANGE, onStale);
    };

    document.body.appendChild(element);
    trigger.setAttribute('aria-expanded', 'true');
    place();
    // Activating: the stored mode first, so Enter does what the plain switch used to do
    const focusState = state === FEATURE_STATE.DEACTIVATED ? getFeatureMode(settings, feature) : state;
    element.querySelector(`[data-state="${focusState}"]`)?.focus();

    return { element, close: closeModeMenu };
}
