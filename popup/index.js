import { getFeaturesAndCurrentSettings, importFeaturePopupFile } from '../configuration.js';
import { isRegexOrigin } from '../options/src/origins.js';
import { UI_EVENTS } from '../options/src/ui/events.js';
import { bindFeatureCards, CATEGORY_ORDER, featureCardHTML, hostStatus } from '../options/src/ui/feature_card.js';
import { openModeMenu } from '../options/src/ui/mode_menu.js';
import {
    FEATURE_STATE,
    getFeatureState,
    isActiveOnHost,
    listHosts,
    readStateSettings,
    setFeatureActive,
    setHostFeature,
    setHostFeatures,
} from '../options/src/ui/state.js';
import { notifyOptionPages } from '../src/generic/popup.js';
import { escapeHTML } from '../src/html_generator.js';
import { originMatches } from '../src/utils/authorize.js';
import { Console, Runtime, Tabs } from '../src/utils/browser.js';
import { applyI18n, categoryName, featureName, initI18n, t } from '../src/utils/i18n.js';
import { iconHTML } from '../src/utils/icons.js';

/**
 * Toolbar popup: the features of the tab's host, as options Home shows one host. Every write goes through
 * options/src/ui/state.js and the popup re-renders on its STATE_CHANGE event.
 */

// Per browser convenience, not a setting: which settings blocks are open
const EXPANDED_KEY = 'joorney_popup_expanded';

window.onload = async () => {
    const [tab] = await Tabs.query({ active: true, currentWindow: true });
    const isWebsite = Boolean(tab?.url?.startsWith('http'));
    const origin = isWebsite ? new URL(tab.url).origin : undefined;
    await initI18n({ origin });
    applyI18n();
    document.getElementById('joorney-popup-options').onclick = () => openOptions();

    if (!isWebsite) {
        renderNotWebsite();
        return;
    }
    const { features, currentSettings } = await getFeaturesAndCurrentSettings();
    await loadPopup(tab, origin, features, currentSettings);
};

// Options links of the kit are relative to the options page ('?page=...')
function openOptions(params = '') {
    if (params) Tabs.create({ url: Runtime.getURL(`options/index.html${params}`) });
    else Runtime.openOptionsPage();
    window.close();
}

function renderNotWebsite() {
    document.getElementById('joorney-popup-hostinfo').textContent = t('popup_invalidWebsite');
    const root = document.getElementById('joorney-popup');
    root.innerHTML = `
        <div class="joorney-empty joorney-popup-empty">
            <p>${escapeHTML(t('popup_invalidHelp'))}</p>
            <button type="button" class="joorney-btn is-secondary" data-action="options">${iconHTML('settings')}${escapeHTML(t('popup_openOptions'))}</button>
        </div>
    `;
    root.querySelector('[data-action="options"]').onclick = () => openOptions();
}

function readExpanded() {
    try {
        return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? '[]'));
    } catch {
        return new Set();
    }
}

function saveExpanded(expanded) {
    try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
    } catch {
        // Storage blocked: the blocks just open closed next time
    }
}

async function loadPopup(tab, origin, features, currentSettings) {
    const root = document.getElementById('joorney-popup');
    const normal = features.filter((f) => !f.limited);
    // The Runbot features ignore host lists and run on their own hosts: only shown on one of them
    const runbot = features.filter((f) => f.limited && originMatches(f.limitedOrigins ?? [], origin));
    const byID = (id) => features.find((f) => f.id === id);
    // A feature without a category must not add an empty section
    const categories = [...new Set([...CATEGORY_ORDER, ...normal.map((f) => f.category)])].filter(
        (c) => c && normal.some((f) => f.category === c)
    );

    const view = {
        settings: await readStateSettings(features, currentSettings),
        host: origin,
        expanded: readExpanded(),
    };

    // The entry the switches write to: the host's own, else a saved regex entry matching it (as the previous
    // popup did), else the host itself, stored on its first change
    const resolveHost = () => {
        const hosts = listHosts(view.settings);
        if (hosts.includes(origin)) return origin;
        return hosts.find((h) => isRegexOrigin(h) && originMatches([h], origin)) ?? origin;
    };
    view.host = resolveHost();

    const on = (feature) =>
        feature.limited
            ? Boolean(view.settings[`${feature.id}Enabled`])
            : isActiveOnHost(view.settings, feature, view.host);
    const shown = () => [...runbot, ...normal];

    //#region Settings blocks
    // Built once and moved into each render: the feature modules keep their nodes and listeners
    const customizable = new Map();
    const frames = new Map();
    const markChanged = () => {
        document.getElementById('joorney-popup-reload').hidden = false;
    };
    await Promise.all(
        shown()
            .filter((f) => f.customization?.popup)
            .map(async (feature) => {
                try {
                    const module = await importFeaturePopupFile(feature.id);
                    const frame = document.createElement('div');
                    frame.id = `joorney-popup-settings-${feature.id}`;
                    frame.className = 'joorney-popup-settings';
                    frame.innerHTML = `
                        <p class="joorney-popup-settings-off">${iconHTML('info')}<span>${escapeHTML(t('popup_settingsOff'))}</span></p>
                        <div data-role="block"></div>
                    `;
                    await module.load({
                        container: frame.querySelector('[data-role="block"]'),
                        active: on(feature),
                        tab,
                        onChange: markChanged,
                    });
                    customizable.set(feature.id, module);
                    frames.set(feature.id, frame);
                } catch (ex) {
                    // The card and its switch still work without its settings
                    Console.warn(ex);
                }
            })
    );
    //#endregion

    //#region Rendering
    function headerRender() {
        const name = origin.replace(/^https?:\/\//, '');
        const hostEl = document.getElementById('joorney-popup-host');
        hostEl.textContent = name;
        hostEl.title = origin;
        const count = shown().filter(on).length;
        const via =
            view.host === origin
                ? ''
                : `<span class="joorney-chip" title="${escapeHTML(t('popup_viaRegex', view.host))}">${escapeHTML(t('optionsHome_regexChip'))}</span>`;
        document.getElementById('joorney-popup-hostinfo').innerHTML =
            `<span>${escapeHTML(t('optionsHome_hostsActive', `${count}`))}</span>${via}`;
    }

    function settingsToggleHTML(feature) {
        if (!frames.has(feature.id)) return '';
        const id = escapeHTML(feature.id);
        const expanded = view.expanded.has(feature.id);
        return `<button type="button" class="joorney-popup-settings-btn" data-action="settings" data-feature="${id}" data-focus="settings:${id}" aria-expanded="${expanded}" aria-controls="joorney-popup-settings-${id}">${iconHTML('tune')}<span>${escapeHTML(t('popup_settings'))}</span>${iconHTML('expand_more', { classes: 'joorney-popup-chevron' })}</button>`;
    }

    function cardHTML(feature) {
        const settings = settingsToggleHTML(feature);
        if (feature.limited) {
            const status = on(feature) ? t('optionsHome_status_runbotOn') : t('optionsHome_status_deactivated');
            return featureCardHTML(feature, {
                switchOn: on(feature),
                switchLabel: `${featureName(feature)}: ${status}`,
                switchTitle: status,
                muted: !on(feature),
                category: false,
                info: false,
                chips: settings,
            });
        }
        const deactivated = getFeatureState(view.settings, feature) === FEATURE_STATE.DEACTIVATED;
        const status = hostStatus(view.settings, feature, view.host);
        const id = escapeHTML(feature.id);
        return featureCardHTML(feature, {
            switchOn: deactivated ? undefined : on(feature),
            switchLabel: `${featureName(feature)}: ${status}`,
            switchTitle: status,
            // Deactivated: no host to switch it on for, Activate takes the switch's place (as on Home)
            action: deactivated
                ? `<button type="button" class="joorney-link-btn is-strong" data-action="activate" data-feature="${id}" data-focus="activate:${id}" aria-haspopup="menu" aria-expanded="false">${escapeHTML(t('optionsHome_activate'))}</button>`
                : '',
            muted: deactivated,
            category: false,
            info: false,
            chips: settings,
        });
    }

    function itemHTML(feature) {
        const slot = frames.has(feature.id) ? `<div data-settings-slot="${escapeHTML(feature.id)}"></div>` : '';
        return `<div class="joorney-popup-item">${cardHTML(feature)}${slot}</div>`;
    }

    function sectionHTML(title, list, extra = '') {
        const count = list.filter(on).length;
        return `
            <section class="joorney-popup-section" aria-label="${escapeHTML(title)}">
                <div class="joorney-popup-sechead">
                    <h2>${escapeHTML(title)}</h2>${extra}
                    <span class="joorney-popup-seccount">${escapeHTML(t('optionsHome_sectionCount', `${count}`, `${list.length}`))}</span>
                </div>
                <div class="joorney-popup-list">${list.map(itemHTML).join('')}</div>
            </section>
        `;
    }

    function html() {
        const runbotSection = runbot.length
            ? sectionHTML(
                  t('optionsHome_runbotName'),
                  runbot,
                  `<span class="joorney-chip">${escapeHTML(t('optionsHome_builtIn'))}</span>`
              )
            : '';
        const sections = categories
            .map((category) =>
                sectionHTML(
                    categoryName(category),
                    normal.filter((f) => f.category === category)
                )
            )
            .join('');
        return `
            ${runbotSection}
            <div class="joorney-popup-bulk">
                <button type="button" class="joorney-btn is-secondary" data-action="all-on" data-focus="all-on">${iconHTML('toggle_on')}${escapeHTML(t('optionsHome_allOn'))}</button>
                <button type="button" class="joorney-btn is-secondary" data-action="all-off" data-focus="all-off">${iconHTML('toggle_off')}${escapeHTML(t('optionsHome_allOff'))}</button>
            </div>
            ${sections}
        `;
    }

    function render() {
        // Re-rendering replaces the cards: keep the focus (card controls are found again by card and action)
        const active = document.activeElement;
        const card = active?.closest?.('.joorney-fcard');
        const inFrame = [...frames.values()].some((frame) => frame.contains(active));
        const focus =
            root.contains(active) && !inFrame
                ? (active.dataset.focus ??
                  (card ? `card:${card.dataset.featureId}:${active.dataset.action ?? ''}` : undefined))
                : undefined;
        const scroll = document.scrollingElement?.scrollTop;

        // Out of the tree first: innerHTML would empty them
        for (const frame of frames.values()) frame.remove();
        root.innerHTML = html();
        for (const [id, frame] of frames) {
            root.querySelector(`[data-settings-slot="${CSS.escape(id)}"]`)?.replaceWith(frame);
            frame.hidden = !view.expanded.has(id);
            frame.classList.toggle('is-inactive', !on(byID(id)));
        }
        headerRender();

        if (scroll !== undefined) document.scrollingElement.scrollTop = scroll;
        if (!focus) return;
        let target;
        if (focus.startsWith('card:')) {
            const [, id, action] = focus.split(':');
            const found = root.querySelector(`.joorney-fcard[data-feature-id="${CSS.escape(id)}"]`);
            target = action ? found?.querySelector(`[data-action="${action}"]`) : found;
        } else {
            target = [...root.querySelectorAll('[data-focus]')].find((e) => e.dataset.focus === focus);
            // Activated: the button is gone, its card's switch takes the focus
            if (!target && focus.startsWith('activate:')) {
                target = root.querySelector(
                    `.joorney-fcard[data-feature-id="${CSS.escape(focus.slice(9))}"] [data-action="switch"]`
                );
            }
        }
        target?.focus({ preventScroll: true });
    }

    async function refresh() {
        view.settings = await readStateSettings(features, currentSettings);
        view.host = resolveHost();
        render();
        for (const [id, module] of customizable) {
            const now = on(byID(id));
            if (now !== module.active) module.setActive(now);
        }
    }
    //#endregion

    //#region Actions
    // Bulk actions skip the deactivated features: they have no host to switch on for
    const setAll = (value) =>
        setHostFeatures(
            view.host,
            normal.filter((f) => view.settings[`${f.id}Enabled`]),
            value
        );

    const ACTIONS = {
        'all-on': () => setAll(true),
        'all-off': () => setAll(false),
        activate: (el) => openModeMenu({ trigger: el, feature: byID(el.dataset.feature), settings: view.settings }),
        settings: (el) => {
            const id = el.dataset.feature;
            const open = !view.expanded.has(id);
            if (open) view.expanded.add(id);
            else view.expanded.delete(id);
            saveExpanded(view.expanded);
            el.setAttribute('aria-expanded', `${open}`);
            frames.get(id).hidden = !open;
        },
    };

    root.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="?"]');
        if (link) {
            event.preventDefault();
            openOptions(link.getAttribute('href'));
            return;
        }
        const el = event.target.closest('[data-action]');
        if (el && root.contains(el) && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
    });
    bindFeatureCards(root, {
        onSwitch: (id, value) => {
            const feature = byID(id);
            return feature.limited ? setFeatureActive(feature, value) : setHostFeature(view.host, feature, value);
        },
    });
    document.getElementById('joorney-popup-reload-btn').onclick = () => {
        Tabs.reload(tab.id);
        window.close();
    };

    // Coalesce the events of a bulk write into one render
    let refreshTimer;
    document.addEventListener(UI_EVENTS.STATE_CHANGE, () => {
        markChanged();
        notifyOptionPages();
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refresh, 0);
    });
    //#endregion

    render();
}
