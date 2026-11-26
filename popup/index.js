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
} from '../options/src/ui/state.js';
import { isWebsiteDisabled, setWebsiteDisabled } from '../src/api/local.js';
import { notifyOptionPages } from '../src/generic/popup.js';
import { escapeHTML } from '../src/html_generator.js';
import { includeVersion, isSupportedOdoo, originMatches } from '../src/utils/authorize.js';
import { Console, Runtime, sendTabMessage, Tabs } from '../src/utils/browser.js';
import { applyI18n, categoryName, featureName, initI18n, t } from '../src/utils/i18n.js';
import { iconHTML } from '../src/utils/icons.js';
import { MESSAGE_ACTION } from '../src/utils/messaging.js';

/**
 * Toolbar popup: the features of the tab's host, as options Home shows one host. Every write goes through
 * options/src/ui/state.js and the popup re-renders on its STATE_CHANGE event.
 */

// Per browser convenience, not a setting: which categories are open (all start closed)
const OPEN_CATEGORIES_KEY = 'joorney_popup_open_categories';
// Folds like a category, its open state kept with theirs: no category id starts with "_"
const UNSUPPORTED_SECTION = '_unsupported';

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
    if (await isWebsiteDisabled(origin)) {
        renderDisabled(tab, origin);
        return;
    }
    const power = document.getElementById('joorney-popup-power');
    power.hidden = false;
    power.onclick = () => switchWebsite(tab, origin, true);
    const [{ features, currentSettings }, odoo] = await Promise.all([
        getFeaturesAndCurrentSettings(),
        readOdooInfo(tab),
    ]);
    await loadPopup(tab, origin, features, currentSettings, odoo);
};

// The features run only on pages with an Odoo session (src/utils/version.js getOdooVersion), the content script
// tells. No answer (a tab opened before the extension was installed or updated): unknown, the popup shows everything
async function readOdooInfo(tab) {
    const info = await sendTabMessage(tab.id, MESSAGE_ACTION.TO_CONTENT.REQUEST_ODOO_INFO);
    const odoo = { known: Boolean(info), isOdoo: Boolean(info?.isOdoo), version: info?.version, versionOn: true };
    if (odoo.isOdoo && odoo.version) odoo.versionOn = await isSupportedOdoo(odoo.version);
    return odoo;
}

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

// A site's features start or stop on a page load: reload it at once (a feature switch offers Reload instead).
// The toolbar icon follows the stored list (background/src/toolbar_state.js watchDisabledWebsites)
async function switchWebsite(tab, origin, disabled) {
    await setWebsiteDisabled(origin, disabled);
    Tabs.reload(tab.id);
    window.close();
}

// Disabled from the header button: nothing runs on this site, its features are not listed
function renderDisabled(tab, origin) {
    const hostEl = document.getElementById('joorney-popup-host');
    hostEl.textContent = origin.replace(/^https?:\/\//, '');
    hostEl.title = origin;
    document.getElementById('joorney-popup-hostinfo').textContent = t('popup_disabled');
    const root = document.getElementById('joorney-popup');
    root.innerHTML = `
        <div class="joorney-empty joorney-popup-empty joorney-popup-disabled">
            <span class="joorney-popup-disabled-icon">${iconHTML('power_settings_new')}</span>
            <p class="joorney-popup-disabled-title">${escapeHTML(t('popup_disabled'))}</p>
            <p>${escapeHTML(t('popup_disabledHelp'))}</p>
            <button type="button" class="joorney-btn" data-action="enable">${iconHTML('power_settings_new')}${escapeHTML(t('popup_enable'))}</button>
            <p class="joorney-popup-disabled-note">${escapeHTML(t('popup_enableReload'))}</p>
            <button type="button" class="joorney-link-btn" data-action="manage">${escapeHTML(t('popup_manageDisabled'))}</button>
        </div>
    `;
    root.querySelector('[data-action="enable"]').onclick = () => switchWebsite(tab, origin, false);
    root.querySelector('[data-action="manage"]').onclick = () => openOptions('?page=page-configuration');
}

function readSet(key) {
    try {
        return new Set(JSON.parse(localStorage.getItem(key) ?? '[]'));
    } catch {
        return new Set();
    }
}

function saveSet(key, values) {
    try {
        localStorage.setItem(key, JSON.stringify([...values]));
    } catch {
        // Storage blocked: the popup just opens as on first use next time
    }
}

async function loadPopup(tab, origin, features, currentSettings, odoo) {
    const root = document.getElementById('joorney-popup');
    const normal = features.filter((f) => !f.limited);
    // The Runbot features ignore host lists and run on their own hosts: only shown on one of them
    const runbot = features.filter((f) => f.limited && originMatches(f.limitedOrigins ?? [], origin));
    const byID = (id) => features.find((f) => f.id === id);

    const view = {
        settings: await readStateSettings(features, currentSettings),
        host: origin,
        // The settings blocks open on demand only: every popup starts with all of them closed
        expanded: new Set(),
        openCategories: readSet(OPEN_CATEGORIES_KEY),
        // No Odoo session: only the Runbot features can run, the host ones stay behind "Show the features anyway"
        showAll: !odoo.known || odoo.isOdoo,
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
    // The Runbot features skip the version checks (src/shared/limited/runbot_content.js)
    const supported = (feature) =>
        feature.limited || !odoo.version || includeVersion(feature.supported_version ?? [], odoo.version, true);
    // What the counts tell: switched on here, and able to run on this page's Odoo
    const runs = (feature) => on(feature) && supported(feature) && (feature.limited || odoo.versionOn);
    // Not for this page's Odoo: out of the categories, in one folded section at the end. Their switches still set
    // the host, for the other versions it may run (localhost)
    const fitting = normal.filter(supported);
    const unsupported = normal.filter((f) => !supported(f));
    // A feature without a category must not add an empty section
    const categories = [...new Set([...CATEGORY_ORDER, ...fitting.map((f) => f.category)])].filter(
        (c) => c && fitting.some((f) => f.category === c)
    );

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
        const info = document.getElementById('joorney-popup-hostinfo');
        if (!view.showAll && !runbot.length) {
            info.textContent = t('popup_notOdoo');
            return;
        }
        const count = (view.showAll ? shown() : runbot).filter(runs).length;
        const via =
            view.host === origin
                ? ''
                : `<span class="joorney-chip" title="${escapeHTML(t('popup_viaRegex', view.host))}">${escapeHTML(t('optionsHome_regexChip'))}</span>`;
        // The bare version shows ("Odoo" goes without saying here), the full name is read and in the tooltip.
        // Turned off on the Versions page: orange, as the toolbar badge on such a page
        let versionChip = '';
        if (odoo.isOdoo && odoo.version) {
            const full = t('optionsUi_versionChip', odoo.version);
            const title = odoo.versionOn ? full : t('popup_versionOff', odoo.version);
            versionChip = `<span class="joorney-chip ${odoo.versionOn ? 'is-version' : 'is-warning'}" title="${escapeHTML(title)}"><span aria-hidden="true">${escapeHTML(odoo.version)}</span><span class="joorney-visually-hidden">${escapeHTML(full)}</span></span>`;
        }
        info.innerHTML = `${versionChip}<span>${escapeHTML(t('optionsHome_hostsActive', `${count}`))}</span>${via}`;
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
                details: false,
                info: false,
                chips: settings,
            });
        }
        const deactivated = getFeatureState(view.settings, feature) === FEATURE_STATE.DEACTIVATED;
        // Its section heading says it too, the switch's name must say it on its own
        const versionNote = supported(feature) ? '' : t('popup_notForVersion', odoo.version);
        const status = [hostStatus(view.settings, feature, view.host), versionNote].filter(Boolean).join('. ');
        const id = escapeHTML(feature.id);
        return featureCardHTML(feature, {
            switchOn: deactivated ? undefined : on(feature),
            switchLabel: `${featureName(feature)}: ${status}`,
            switchTitle: status,
            // Deactivated: no host to switch it on for, Activate takes the switch's place (as on Home)
            action: deactivated
                ? `<button type="button" class="joorney-link-btn is-strong" data-action="activate" data-feature="${id}" data-focus="activate:${id}" aria-haspopup="menu" aria-expanded="false">${escapeHTML(t('optionsHome_activate'))}</button>`
                : '',
            muted: deactivated || Boolean(versionNote),
            category: false,
            details: false,
            info: false,
            chips: settings,
        });
    }

    function itemHTML(feature) {
        const slot = frames.has(feature.id) ? `<div data-settings-slot="${escapeHTML(feature.id)}"></div>` : '';
        return `<div class="joorney-popup-item">${cardHTML(feature)}${slot}</div>`;
    }

    // A category folds (its count stays in the heading), the Runbot section does not: it is short and only shown
    // where it is wanted
    function sectionHTML(title, list, { extra = '', category = undefined, counted = runs } = {}) {
        const count = `<span class="joorney-popup-seccount">${escapeHTML(t('optionsHome_sectionCount', `${list.filter(counted).length}`, `${list.length}`))}</span>`;
        const items = list.map(itemHTML).join('');
        if (!category) {
            return `
                <section class="joorney-popup-section" aria-label="${escapeHTML(title)}">
                    <div class="joorney-popup-sechead"><h2>${escapeHTML(title)}</h2>${extra}${count}</div>
                    <div class="joorney-popup-list">${items}</div>
                </section>
            `;
        }
        const id = escapeHTML(category);
        const collapsed = !view.openCategories.has(category);
        return `
            <section class="joorney-popup-section" aria-label="${escapeHTML(title)}">
                <h2 class="joorney-popup-sechead is-toggle">
                    <button type="button" class="joorney-popup-secbtn" data-action="section" data-category="${id}" data-focus="section:${id}" aria-expanded="${!collapsed}" aria-controls="joorney-popup-list-${id}">
                        <span class="joorney-popup-sectitle">${escapeHTML(title)}</span>${count}${iconHTML('expand_more', { classes: 'joorney-popup-chevron' })}
                    </button>
                </h2>
                <div id="joorney-popup-list-${id}" class="joorney-popup-list"${collapsed ? ' hidden' : ''}>${items}</div>
            </section>
        `;
    }

    function html() {
        const runbotSection = runbot.length
            ? sectionHTML(t('optionsHome_runbotName'), runbot, {
                  extra: `<span class="joorney-chip">${escapeHTML(t('optionsHome_builtIn'))}</span>`,
              })
            : '';
        const sections = categories
            .map((category) =>
                sectionHTML(
                    categoryName(category),
                    fitting.filter((f) => f.category === category),
                    { category }
                )
            )
            .join('');
        // None of them runs here: the count tells the switches, what the page gets on its other versions
        const unsupportedSection = unsupported.length
            ? sectionHTML(t('popup_notForVersion', odoo.version), unsupported, {
                  category: UNSUPPORTED_SECTION,
                  counted: on,
              })
            : '';
        if (!view.showAll) return `${runbotSection}${notOdooHTML()}`;
        // First: it is about the whole page, Runbot included
        return `${versionOffHTML()}${runbotSection}${sections}${unsupportedSection}`;
    }

    function notOdooHTML() {
        return `
            <div class="joorney-empty joorney-popup-empty">
                <p>${escapeHTML(t('popup_notOdooHelp'))}</p>
                <button type="button" class="joorney-link-btn" data-action="show-all" data-focus="show-all">${escapeHTML(t('popup_showAnyway'))}</button>
            </div>
        `;
    }

    // The Versions page turns whole Odoo versions on or off: then no host feature runs, whatever the switches say.
    // The Runbot features skip the version checks: on a runbot build they still run
    function versionOffHTML() {
        if (!odoo.isOdoo || odoo.versionOn) return '';
        const message = runbot.length ? t('popup_versionOffRunbot', odoo.version) : t('popup_versionOff', odoo.version);
        return `
            <p class="joorney-note is-warning joorney-popup-note">${iconHTML('warning')}<span>${escapeHTML(message)} <a href="?page=page-version">${escapeHTML(t('options_menu_versions'))}</a></span></p>
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
    const ACTIONS = {
        activate: (el) => openModeMenu({ trigger: el, feature: byID(el.dataset.feature), settings: view.settings }),
        settings: (el) => {
            const id = el.dataset.feature;
            const open = !view.expanded.has(id);
            if (open) view.expanded.add(id);
            else view.expanded.delete(id);
            el.setAttribute('aria-expanded', `${open}`);
            frames.get(id).hidden = !open;
        },
        'show-all': () => {
            view.showAll = true;
            render();
        },
        section: (el) => {
            const category = el.dataset.category;
            const fold = view.openCategories.has(category);
            if (fold) view.openCategories.delete(category);
            else view.openCategories.add(category);
            saveSet(OPEN_CATEGORIES_KEY, view.openCategories);
            el.setAttribute('aria-expanded', `${!fold}`);
            document.getElementById(`joorney-popup-list-${category}`).hidden = fold;
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
    // The popup keeps each card on one line: no expanded description
    bindFeatureCards(root, {
        expandable: false,
        onSwitch: (id, value) => {
            const feature = byID(id);
            return feature.limited ? setFeatureActive(feature, value) : setHostFeature(view.host, feature, value);
        },
    });
    document.getElementById('joorney-popup-reload-btn').onclick = () => {
        Tabs.reload(tab.id);
        window.close();
    };

    // Coalesce quick successive writes (fast clicks) into one render
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
