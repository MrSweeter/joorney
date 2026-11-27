import { escapeHTML } from '../../../src/html_generator.js';
import { Runtime } from '../../../src/utils/browser.js';
import { categoryName, featureDescription, featureName, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { MESSAGE_ACTION } from '../../../src/utils/messaging.js';
import { UI_EVENTS } from '../../src/ui/events.js';
import {
    bindFeatureCards,
    CATEGORY_ORDER,
    featureCardHTML,
    getFeatureCard,
    stateHelp,
    stateLabel,
} from '../../src/ui/feature_card.js';
import { openInfoModal } from '../../src/ui/info_modal.js';
import {
    FEATURE_STATE,
    getFeatureState,
    readStateSettings,
    setFeatureActive,
    setFeatureState,
} from '../../src/ui/state.js';

/**
 * Features: the global state of every feature as three zones (everywhere except listed hosts, only on listed
 * hosts, deactivated). Every write goes through options/src/ui/state.js and the board re-renders on its
 * STATE_CHANGE event, so changes from Home, the popup or another tab show up too.
 */

const ALL = 'all';
const ZONES = [FEATURE_STATE.EVERYWHERE, FEATURE_STATE.LISTED, FEATURE_STATE.DEACTIVATED];

// Outlives loadPage: coming back to Features in the same tab keeps the runbot block as it was left
let runbotOpen = true;
const CARD = '.joorney-fcard[data-feature-id]';
const MOVED_HIGHLIGHT_MS = 1000;
const FLIP_MS = 250;

export async function loadPage(features, currentSettings) {
    const root = document.getElementById('joorney-features');
    const normal = features.filter((f) => !f.limited);
    const limited = features.filter((f) => f.limited);
    const byID = (id) => features.find((f) => f.id === id);
    // A feature without a category must not add an empty pill
    const categories = [...new Set([...CATEGORY_ORDER, ...normal.map((f) => f.category)])].filter(
        (c) => c && normal.some((f) => f.category === c)
    );

    let settings = await readStateSettings(features, currentSettings);
    // Another page was loaded meanwhile
    if (!root.isConnected) return;
    let previousStates;
    const view = { search: '', category: ALL, dragId: undefined };
    const timers = new Set();

    //#region Markup
    const zoneHTML = (state) => `
        <section class="joorney-fb-zone is-${state}" data-zone="${state}" aria-label="${escapeHTML(stateLabel(state))}">
            <div class="joorney-fb-zonehead">
                <div class="joorney-fb-zonetop">
                    <h2 class="joorney-fb-zonetitle">${escapeHTML(stateLabel(state))}</h2>
                    <span class="joorney-fb-zonecount" data-role="count"></span>
                </div>
                <p class="joorney-fb-zonehelp">${escapeHTML(stateHelp(state))}</p>
            </div>
            <div class="joorney-fb-drop" data-role="drop" role="group" aria-label="${escapeHTML(stateLabel(state))}"></div>
        </section>
    `;
    const pillHTML = (value, label) =>
        `<button type="button" class="joorney-pill" data-action="category" data-category="${escapeHTML(value)}" aria-pressed="${view.category === value}">${escapeHTML(label)}</button>`;

    root.innerHTML = `
        <h1 class="joorney-page-title">${escapeHTML(t('optionsFeatures_title'))}</h1>
        <p class="joorney-page-subtitle">${escapeHTML(t('optionsFeatures_subtitle'))}</p>
        ${
            limited.length
                ? `<section class="joorney-fb-runbot" aria-label="${escapeHTML(categoryName('runbot'))}">
                    <h2>
                        <button type="button" class="joorney-disclosure joorney-fb-runbot-toggle" data-action="runbot-toggle" aria-expanded="${runbotOpen}" aria-controls="joorney-fb-runbot-body">
                            ${escapeHTML(categoryName('runbot'))}
                            ${iconHTML('expand_more')}
                        </button>
                    </h2>
                    <div id="joorney-fb-runbot-body" ${runbotOpen ? '' : 'hidden'}>
                        <p>${escapeHTML(t('optionsFeatures_runbotNote'))}</p>
                        <div class="joorney-fcard-grid" data-role="runbot"></div>
                    </div>
                </section>`
                : ''
        }
        <div class="joorney-fb-toolbar">
            <div class="joorney-fb-search">
                <label for="joorney-fb-search">${escapeHTML(t('optionsFeatures_search'))}</label>
                <input id="joorney-fb-search" class="joorney-input" type="search" autocomplete="off" placeholder="${escapeHTML(t('optionsFeatures_searchPlaceholder'))}">
            </div>
            <div class="joorney-pills" role="group" aria-label="${escapeHTML(t('optionsHome_categories'))}">
                ${pillHTML(ALL, t('optionsHome_categoryAll'))}${categories.map((c) => pillHTML(c, categoryName(c))).join('')}
            </div>
        </div>
        <div class="joorney-fb-zones" data-role="zones">${ZONES.map(zoneHTML).join('')}</div>
        <div class="joorney-visually-hidden" role="status" aria-live="polite" data-role="status"></div>
    `;
    const zonesEl = root.querySelector('[data-role="zones"]');
    const runbotEl = root.querySelector('[data-role="runbot"]');
    const searchEl = root.querySelector('#joorney-fb-search');
    const statusEl = root.querySelector('[data-role="status"]');
    const dropOf = (state) => zonesEl.querySelector(`[data-zone="${state}"] [data-role="drop"]`);
    //#endregion

    //#region Render
    const matches = (feature) => {
        if (view.category !== ALL && feature.category !== view.category) return false;
        const query = view.search.trim().toLowerCase();
        return !query || `${featureName(feature)} ${featureDescription(feature)}`.toLowerCase().includes(query);
    };

    const announce = (message) => {
        // Same text twice in a row is not announced again
        statusEl.textContent = statusEl.textContent === message ? `${message} ` : message;
    };

    const timeout = (callback, delay) => {
        const timer = setTimeout(() => {
            timers.delete(timer);
            callback();
        }, delay);
        timers.add(timer);
    };

    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function render({ animate = false } = {}) {
        const active = document.activeElement;
        const focus = root.contains(active)
            ? { card: active.closest(CARD)?.dataset.featureId, key: active.dataset?.focus }
            : {};
        const before = new Map();
        if (animate && !prefersReducedMotion()) {
            for (const card of zonesEl.querySelectorAll(CARD))
                before.set(card.dataset.featureId, card.getBoundingClientRect());
        }

        const states = Object.fromEntries(normal.map((f) => [f.id, getFeatureState(settings, f)]));
        for (const state of ZONES) {
            const shown = normal.filter((f) => states[f.id] === state && matches(f));
            const drop = dropOf(state);
            drop.innerHTML = shown.length
                ? shown
                      .map((feature) =>
                          featureCardHTML(feature, {
                              grip: true,
                              muted: state === FEATURE_STATE.DEACTIVATED,
                              classes:
                                  previousStates && previousStates[feature.id] !== states[feature.id] ? 'is-moved' : '',
                          })
                      )
                      .join('')
                : `<p class="joorney-fb-empty">${escapeHTML(t('optionsFeatures_empty'))}</p>`;
            zonesEl.querySelector(`[data-zone="${state}"] [data-role="count"]`).textContent = `${shown.length}`;
            zonesEl
                .querySelector(`[data-zone="${state}"] [data-role="count"]`)
                .setAttribute('aria-label', t('optionsFeatures_count', `${shown.length}`));
        }
        previousStates = states;
        renderRunbot();

        for (const card of zonesEl.querySelectorAll('.is-moved'))
            timeout(() => card.classList.remove('is-moved'), MOVED_HIGHLIGHT_MS);

        // FLIP: play from the old position to the new one
        for (const card of zonesEl.querySelectorAll(CARD)) {
            const from = before.get(card.dataset.featureId);
            if (!from) continue;
            const to = card.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            if (!dx && !dy) continue;
            card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
                duration: FLIP_MS,
                easing: 'ease-out',
            });
        }

        // The re-render replaced the focused element
        if (focus.card)
            (getFeatureCard(zonesEl, focus.card) ?? getFeatureCard(runbotEl ?? root, focus.card))?.focus({
                preventScroll: true,
            });
        else if (focus.key)
            root.querySelector(`[data-focus="${CSS.escape(focus.key)}"]`)?.focus({ preventScroll: true });
    }

    function renderRunbot() {
        if (!runbotEl) return;
        runbotEl.innerHTML = limited
            .map((feature) => {
                const enabled = Boolean(settings[`${feature.id}Enabled`]);
                return featureCardHTML(feature, {
                    switchOn: enabled,
                    switchLabel: t('optionsHome_runbotGlobal', featureName(feature)),
                    muted: !enabled,
                    category: false,
                });
            })
            .join('');
    }

    async function refresh() {
        settings = await readStateSettings(features, settings);
        render({ animate: true });
    }
    //#endregion

    //#region Moves
    async function move(id, state) {
        const feature = byID(id);
        if (getFeatureState(settings, feature) === state) return;
        await setFeatureState(feature, state);
        announce(t('optionsFeatures_moved', featureName(feature), stateLabel(state)));
    }
    //#endregion

    //#region Events
    const selectCategory = (button) => {
        view.category = button.dataset.category;
        for (const pill of root.querySelectorAll('[data-action="category"]'))
            pill.setAttribute('aria-pressed', `${pill.dataset.category === view.category}`);
        render();
    };

    const toggleRunbot = (button) => {
        runbotOpen = !runbotOpen;
        button.setAttribute('aria-expanded', `${runbotOpen}`);
        root.querySelector('#joorney-fb-runbot-body').hidden = !runbotOpen;
    };

    const clickActions = { category: selectCategory, 'runbot-toggle': toggleRunbot };

    const onClick = (event) => {
        const button = event.target.closest('[data-action]');
        if (!button || !root.contains(button) || button.closest(CARD)) return;
        clickActions[button.dataset.action]?.(button);
    };

    const onInput = (event) => {
        if (event.target !== searchEl) return;
        view.search = searchEl.value;
        render();
    };

    const moveFocus = (card, key) => {
        const cards = [...card.parentElement.querySelectorAll(CARD)];
        const index = cards.indexOf(card);
        const next = {
            ArrowDown: cards[index + 1],
            ArrowRight: cards[index + 1],
            ArrowUp: cards[index - 1],
            ArrowLeft: cards[index - 1],
            Home: cards[0],
            End: cards[cards.length - 1],
        }[key];
        next?.focus();
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            if (event.target === searchEl && searchEl.value) {
                searchEl.value = '';
                view.search = '';
                render();
            }
            return;
        }
        const card = event.target.closest?.(CARD);
        if (card && event.target === card && zonesEl.contains(card)) {
            if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                moveFocus(card, event.key);
            }
        }
    };

    //#region Drag and drop
    const onDragStart = (event) => {
        const card = event.target.closest?.(CARD);
        if (!card || !zonesEl.contains(card)) return;
        const id = card.dataset.featureId;
        view.dragId = id;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
        // After the drag image is taken, else it is dimmed too
        timeout(() => getFeatureCard(zonesEl, id)?.classList.add('is-dragging'), 0);
    };

    const clearDragUI = () => {
        view.dragId = undefined;
        for (const e of zonesEl.querySelectorAll('.is-dragging, .is-over'))
            e.classList.remove('is-dragging', 'is-over');
    };

    const dropTarget = (event) => event.target.closest?.('.joorney-fb-zone');

    const onDragOver = (event) => {
        const zone = dropTarget(event);
        // Not our drag (a file, a link...): leave it to the browser
        if (!zone || !view.dragId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        zone.querySelector('[data-role="drop"]').classList.add('is-over');
    };

    const onDragLeave = (event) => {
        const zone = dropTarget(event);
        if (zone && !zone.contains(event.relatedTarget))
            zone.querySelector('[data-role="drop"]').classList.remove('is-over');
    };

    const onDrop = (event) => {
        const zone = dropTarget(event);
        if (!zone || !view.dragId) return;
        event.preventDefault();
        const id = view.dragId;
        clearDragUI();
        move(id, zone.dataset.zone);
    };
    //#endregion

    const showInfo = (id) => openInfoModal(byID(id), settings);
    //#endregion

    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', onKeyDown);
    zonesEl.addEventListener('dragstart', onDragStart);
    zonesEl.addEventListener('dragend', clearDragUI);
    zonesEl.addEventListener('dragover', onDragOver);
    zonesEl.addEventListener('dragleave', onDragLeave);
    zonesEl.addEventListener('drop', onDrop);
    bindFeatureCards(zonesEl, { onInfo: showInfo });
    if (runbotEl) {
        bindFeatureCards(runbotEl, {
            onInfo: showInfo,
            onSwitch: (id, value) => setFeatureActive(byID(id), value),
        });
    }
    // Coalesce the events of a bulk write into one render
    let refreshTimer;
    const onStateChange = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refresh, 0);
    };
    // The popup toggles a feature from a tab: it tells the options page with this message
    const onPopupMessage = (message) => {
        if (message?.action === MESSAGE_ACTION.TO_CONTENT.POPUP_HAS_CHANGE) onStateChange();
    };
    const onPageChange = () => {
        clearTimeout(refreshTimer);
        for (const timer of timers) clearTimeout(timer);
        document.removeEventListener(UI_EVENTS.STATE_CHANGE, onStateChange);
        document.removeEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
        Runtime.onMessage.removeListener(onPopupMessage);
    };
    document.addEventListener(UI_EVENTS.STATE_CHANGE, onStateChange);
    document.addEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
    Runtime.onMessage.addListener(onPopupMessage);

    render();
}

export const PAGE = {
    id: 'page-features',
    tour: 'tour_features',
    labelKey: 'options_menu_features',
    path: './pages/features/index.html',
    loader: loadPage,
};
