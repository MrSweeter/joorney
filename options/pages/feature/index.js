import { importFeatureCustomizationFile } from '../../../configuration.js';
import { escapeHTML } from '../../../src/html_generator.js';
import { Runtime } from '../../../src/utils/browser.js';
import { applyI18n, featureDescription, featureDetails, featureName, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { MESSAGE_ACTION } from '../../../src/utils/messaging.js';
import {
    anchorRegexOrigin,
    isRegexOrigin,
    isUnanchoredRegexOrigin,
    OriginError,
    regexAnchorHintHTML,
} from '../../src/origins.js';
import { UI_EVENTS } from '../../src/ui/events.js';
import {
    FEATURE_PAGE_ID,
    featureChipsHTML,
    hasFeatureSettings,
    stateHelp,
    stateLabel,
    switchHTML,
} from '../../src/ui/feature_card.js';
import { openModeMenu } from '../../src/ui/mode_menu.js';
import {
    FEATURE_MODE,
    FEATURE_STATE,
    getFeatureMode,
    getFeatureState,
    isListed,
    listHosts,
    readStateSettings,
    renameHost,
    setFeatureActive,
    setFeatureMode,
    setHostFeature,
} from '../../src/ui/state.js';
import { ambientSettingsHTML, loadAmbientSettings, unloadAmbientSettings } from './ambient.js';
import { settingsBlockHTML } from './settings.js';

/**
 * Feature page: one feature with its state, the hosts that list it and its settings.
 * Route: '?page=page-feature&feature=<id>', not in the menu (Features stays active). The header and the "Where it runs" card re-render
 * on every STATE_CHANGE; the Settings card is rendered once, so typing there is never lost.
 */

const FEATURES_PAGE_ID = 'page-features';
const VIDEO_FILE = /\.(mp4|webm|ogg)$/i;

function videoURL(feature) {
    if (!feature.video) return undefined;
    try {
        const url = new URL(feature.video);
        return url.protocol === 'https:' ? url : undefined;
    } catch {
        return undefined;
    }
}

function videoHTML(feature, name) {
    const url = videoURL(feature);
    const label = escapeHTML(t('optionsUi_infoVideo', name));
    if (url && VIDEO_FILE.test(url.pathname))
        return `<video controls preload="metadata" src="${escapeHTML(url.href)}" aria-label="${label}"></video>`;
    if (url)
        return `<iframe src="${escapeHTML(url.href)}" title="${label}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    return `${iconHTML('play_circle')}<span>${escapeHTML(t('optionsUi_videoSoon'))}</span>`;
}

function notFoundHTML() {
    return `
        <h1 class="joorney-page-title">${escapeHTML(t('optionsFeature_notFound'))}</h1>
        <p class="joorney-page-subtitle">${escapeHTML(t('optionsFeature_notFoundText'))}</p>
        <a class="joorney-btn" href="?page=${FEATURES_PAGE_ID}">${iconHTML('arrow_back')}${escapeHTML(t('optionsFeature_back'))}</a>
    `;
}

export async function loadPage(features, currentSettings, params = {}) {
    const root = document.getElementById('joorney-feature');
    const feature = features.find((f) => f.id === params.feature);
    if (!feature) {
        root.innerHTML = notFoundHTML();
        return;
    }

    const name = featureName(feature);
    const hasSettings = hasFeatureSettings(feature);
    const settingsHelp =
        {
            themeSwitch: t('optionsFeature_settingsHelpThemeSwitch'),
            ambient: t('optionsFeature_settingsHelpAmbient'),
            awesomeLoadingSmall: t('optionsFeature_settingsHelpAwesomeLoading'),
            awesomeLoadingLarge: t('optionsFeature_settingsHelpAwesomeLoading'),
            unfocusApp: t('optionsFeature_settingsHelpUnfocusApp'),
            pinMessage: t('optionsFeature_settingsHelpPinMessage'),
            contextOdooMenus: t('optionsFeature_settingsHelpContextOdooMenus'),
        }[feature.id] ?? t('optionsFeature_settingsHelp');
    let settings = await readStateSettings(features, currentSettings);
    // Another page was loaded meanwhile
    if (!root.isConnected) return;
    let newHost = '';
    let error = '';

    //#region Markup
    root.innerHTML = `
        <nav class="joorney-feature-crumbs" aria-label="${escapeHTML(t('optionsFeature_breadcrumb'))}">
            <a href="?page=${FEATURES_PAGE_ID}">${escapeHTML(t('options_menu_features'))}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">${escapeHTML(name)}</span>
        </nav>
        <div data-role="head"></div>
        ${
            hasSettings
                ? `<section class="joorney-panel" data-role="settings-panel" aria-labelledby="joorney-feature-settings-title">
                    <h2 class="joorney-panel-title" id="joorney-feature-settings-title">${escapeHTML(t('optionsFeature_settings'))}</h2>
                    <p class="joorney-help">${escapeHTML(settingsHelp)}</p>
                    <div data-role="settings"></div>
                </section>`
                : ''
        }
        <div data-role="where"></div>
        <div class="joorney-feature-foot">
            <span>${escapeHTML(t('optionsFeature_sync'))}</span>
            <a href="?page=${FEATURES_PAGE_ID}">${escapeHTML(t('optionsFeature_back'))}</a>
        </div>
    `;
    const headEl = root.querySelector('[data-role="head"]');
    const whereEl = root.querySelector('[data-role="where"]');
    const settingsPanelEl = root.querySelector('[data-role="settings-panel"]');
    const dynamicEls = [headEl, whereEl];
    //#endregion

    //#region Render
    function headerHTML(active) {
        // Activating asks where it runs, see ACTIONS.active
        const asksMode = !active && !feature.limited;
        const description = featureDescription(feature);
        const details = featureDetails(feature);
        const chips = [featureChipsHTML(feature)];
        if (feature.customization.popup) {
            chips.push(
                `<span class="joorney-chip is-warning" title="${escapeHTML(t('optionsFeature_alsoPopupTitle'))}">${iconHTML('web_asset')}${escapeHTML(t('optionsFeature_alsoPopup'))}</span>`
            );
        }
        return `
            <section class="joorney-panel joorney-feature-head" aria-labelledby="joorney-feature-name">
                <div class="joorney-feature-top">
                    <span class="joorney-feature-icon">${iconHTML(feature.icon, { filled: true })}</span>
                    <div class="joorney-feature-title">
                        <h1 id="joorney-feature-name">${escapeHTML(name)}</h1>
                        <p class="joorney-help">${escapeHTML(description)}</p>
                        <div class="joorney-chips">${chips.join('')}</div>
                    </div>
                    <div class="joorney-feature-active">
                        <span id="joorney-feature-active-label">${escapeHTML(active ? t('optionsFeature_active') : t('optionsUi_state_deactivated'))}</span>
                        ${switchHTML({ on: active, label: name, attributes: `id="joorney-feature-active" data-action="active" aria-labelledby="joorney-feature-active-label"${asksMode ? ` aria-haspopup="menu" aria-expanded="false" aria-description="${escapeHTML(t('optionsFeature_activateMenu'))}"` : ''}` })}
                    </div>
                </div>
                <div class="joorney-feature-body">
                    <div class="joorney-feature-video">${videoHTML(feature, name)}</div>
                    <div class="joorney-feature-text">
                        <p>${escapeHTML(details || description)}</p>
                    </div>
                </div>
            </section>
        `;
    }

    function modeOptionHTML(mode, current) {
        const selected = mode === current;
        return `
            <button type="button" class="joorney-feature-opt${selected ? ' is-selected' : ''}" data-action="mode" data-mode="${mode}" aria-pressed="${selected}">
                <b>${escapeHTML(stateLabel(mode))}</b>
                <span>${escapeHTML(stateHelp(mode))}</span>
            </button>
        `;
    }

    // Saved regex host without ^...$: a warning chip and a button rewriting it anchored, keeping its features
    function unanchoredHTML(host) {
        if (!isUnanchoredRegexOrigin(host)) return '';
        const label = escapeHTML(t('options_anchorHost', host));
        return `
            <span class="joorney-chip is-warning" title="${escapeHTML(t('options_unanchoredTitle'))}">${iconHTML('warning')}${escapeHTML(t('options_unanchoredChip'))}</span>
            <button type="button" class="joorney-icon-btn" data-action="anchor-host" data-host="${escapeHTML(host)}" aria-label="${label}" title="${label}">${iconHTML('build')}</button>
        `;
    }

    function hostRowHTML(host, listedMode) {
        const label = listedMode ? t('optionsFeature_onHere') : t('optionsFeature_offHere');
        const regexChip = isRegexOrigin(host)
            ? `<span class="joorney-chip is-tag">${escapeHTML(t('optionsFeature_regexChip'))}</span>`
            : '';
        return `
            <li class="joorney-feature-host">
                <span class="joorney-feature-origin">${escapeHTML(host)}</span>
                ${regexChip}
                ${unanchoredHTML(host)}
                <span class="joorney-chip${listedMode ? ' is-version' : ''}">${escapeHTML(label)}</span>
                <button type="button" class="joorney-icon-btn" data-action="remove-host" data-host="${escapeHTML(host)}"
                    aria-label="${escapeHTML(t('optionsHome_removeHost', host))}" title="${escapeHTML(t('optionsHome_removeHost', host))}">${iconHTML('delete')}</button>
            </li>
        `;
    }

    function whereHTML(active) {
        if (feature.limited) {
            return `
                <section class="joorney-panel${active ? '' : ' is-muted'}" aria-labelledby="joorney-feature-where-title">
                    <h2 class="joorney-panel-title" id="joorney-feature-where-title">${escapeHTML(t('optionsFeature_whereTitle'))}</h2>
                    <p class="joorney-help">${escapeHTML(t('optionsFeature_limitedHelp'))}</p>
                    ${active ? '' : `<div class="joorney-note">${iconHTML('block')}<span>${escapeHTML(t('optionsFeature_deactivatedBanner'))}</span></div>`}
                    <ul class="joorney-feature-hosts">
                        ${(feature.limitedOrigins ?? []).map((origin) => `<li class="joorney-feature-host">${iconHTML('lock')}<span class="joorney-feature-origin">${escapeHTML(origin)}</span></li>`).join('')}
                    </ul>
                </section>
            `;
        }
        const mode = getFeatureMode(settings, feature);
        const listedMode = mode === FEATURE_MODE.LISTED;
        const hosts = listHosts(settings).filter((host) => isListed(settings, host, feature.id));
        return `
            <section class="joorney-panel${active ? '' : ' is-muted'}" aria-labelledby="joorney-feature-where-title">
                <h2 class="joorney-panel-title" id="joorney-feature-where-title">${escapeHTML(t('optionsFeature_whereTitle'))}</h2>
                <p class="joorney-help">${escapeHTML(t('optionsFeature_whereHelp'))}</p>
                ${active ? '' : `<div class="joorney-note">${iconHTML('block')}<span>${escapeHTML(t('optionsFeature_deactivatedBanner'))}</span></div>`}
                <div class="joorney-feature-opts" role="group" aria-label="${escapeHTML(t('optionsFeature_modeLabel'))}">
                    ${modeOptionHTML(FEATURE_MODE.EVERYWHERE, mode)}${modeOptionHTML(FEATURE_MODE.LISTED, mode)}
                </div>
                <h3 class="joorney-feature-subtitle">${escapeHTML(t('optionsFeature_hostsTitle'))}</h3>
                <ul class="joorney-feature-hosts">
                    ${hosts.length ? hosts.map((host) => hostRowHTML(host, listedMode)).join('') : `<li class="joorney-feature-host is-empty">${escapeHTML(t('optionsFeature_noHosts'))}</li>`}
                </ul>
                <div class="joorney-feature-add">
                    <div class="joorney-feature-addfield">
                        <label class="joorney-label" for="joorney-feature-new-host">${escapeHTML(t('optionsHome_addHost'))}</label>
                        <input id="joorney-feature-new-host" class="joorney-input" type="text" autocomplete="off"
                            placeholder="${escapeHTML(t('optionsHome_addPlaceholder'))}" value="${escapeHTML(newHost)}">
                    </div>
                    <button type="button" class="joorney-btn" data-action="add-host">${iconHTML('add')}${escapeHTML(t('optionsHome_add'))}</button>
                </div>
                ${regexAnchorHintHTML(newHost, escapeHTML(t('options_warning_regexAnchors')), escapeHTML(t('options_anchorRegex')))}
                ${error ? `<p class="joorney-error is-small joorney-feature-error" role="alert">${escapeHTML(error)}</p>` : ''}
            </section>
        `;
    }

    function render() {
        const active = getFeatureState(settings, feature) !== FEATURE_STATE.DEACTIVATED;
        // The re-render replaces the nodes: keep the typed host and the focus
        const input = whereEl.querySelector('#joorney-feature-new-host');
        if (input) newHost = input.value;
        const container = dynamicEls.find((el) => el.contains(document.activeElement));
        const focused = container ? document.activeElement : undefined;
        const focus =
            focused?.id || (focused?.dataset.action && `${focused.dataset.action}:${focused.dataset.mode ?? ''}`);

        headEl.innerHTML = headerHTML(active);
        whereEl.innerHTML = whereHTML(active);
        // Not re-rendered (typing is kept): its Behaviour group shows a note while deactivated
        settingsPanelEl?.classList.toggle('is-inactive', !active);

        if (focus) {
            const target =
                container.querySelector(`#${CSS.escape(focus)}`) ??
                Array.from(container.querySelectorAll('[data-action]')).find(
                    (e) => `${e.dataset.action}:${e.dataset.mode ?? ''}` === focus
                );
            target?.focus({ preventScroll: true });
        }
    }

    async function refresh() {
        settings = await readStateSettings(features, currentSettings);
        if (headEl.isConnected) render();
    }
    //#endregion

    //#region Actions
    const MENU_OPENED = Symbol('menu opened');
    // A host in the list = "listed" for this feature: On here in listed mode, Off here in everywhere mode
    const listedAsOn = () => getFeatureMode(settings, feature) === FEATURE_MODE.LISTED;

    async function addToList() {
        const input = whereEl.querySelector('#joorney-feature-new-host');
        newHost = input.value;
        try {
            await setHostFeature(newHost, feature, listedAsOn());
            newHost = '';
            error = '';
        } catch (ex) {
            if (!(ex instanceof OriginError)) throw ex;
            error = t(ex.messageKey);
        }
        await refresh();
    }

    const ACTIONS = {
        active: async (el) => {
            const next = el.getAttribute('aria-checked') !== 'true';
            // Activating asks where it runs; a limited feature has no mode
            if (next && !feature.limited) {
                openModeMenu({ trigger: el, feature, settings });
                return MENU_OPENED;
            }
            await setFeatureActive(feature, next);
        },
        mode: async (el) => {
            if (el.dataset.mode !== getFeatureMode(settings, feature)) await setFeatureMode(feature, el.dataset.mode);
        },
        'remove-host': async (el) => {
            await setHostFeature(el.dataset.host, feature, !listedAsOn());
        },
        'add-host': addToList,
        // The field keeps the anchored value: the re-render reads it back (newHost)
        'anchor-regex': () => {
            const input = whereEl.querySelector('#joorney-feature-new-host');
            input.value = anchorRegexOrigin(input.value);
            newHost = input.value;
        },
        'anchor-host': async (el) => {
            try {
                await renameHost(el.dataset.host, anchorRegexOrigin(el.dataset.host));
            } catch (ex) {
                if (!(ex instanceof OriginError)) throw ex;
                error = t(ex.messageKey);
            }
        },
    };

    const onClick = async (event) => {
        const el = event.target.closest('[data-action]');
        if (!el || !dynamicEls.some((container) => container.contains(el))) return;
        error = '';
        // A re-render would replace the menu's trigger: its pick fires STATE_CHANGE anyway
        if ((await ACTIONS[el.dataset.action]?.(el)) === MENU_OPENED) return;
        // Host writes that change nothing (invalid input, same value) fire no STATE_CHANGE
        await refresh();
    };
    const onKeyDown = (event) => {
        if (event.key === 'Enter' && event.target.id === 'joorney-feature-new-host') {
            event.preventDefault();
            addToList();
        }
    };
    const onInput = (event) => {
        if (event.target.id !== 'joorney-feature-new-host') return;
        const hint = whereEl.querySelector('[data-role="regex-hint"]');
        if (hint) hint.hidden = !isUnanchoredRegexOrigin(event.target.value);
    };
    for (const container of dynamicEls) {
        container.addEventListener('click', onClick);
        container.addEventListener('keydown', onKeyDown);
        container.addEventListener('input', onInput);
    }
    //#endregion

    //#region Refresh and cleanup
    let refreshTimer;
    // Coalesce the events of a bulk write into one render
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
        document.removeEventListener(UI_EVENTS.STATE_CHANGE, onStateChange);
        document.removeEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
        Runtime.onMessage.removeListener(onPopupMessage);
        if (feature.id === 'ambient') unloadAmbientSettings();
        customization?.unload();
    };
    document.addEventListener(UI_EVENTS.STATE_CHANGE, onStateChange);
    document.addEventListener(UI_EVENTS.PAGE_CHANGE, onPageChange);
    Runtime.onMessage.addListener(onPopupMessage);
    //#endregion

    // The option_customization of the Settings card, unloaded with the page
    let customization = null;
    render();
    await loadSettings();

    async function loadSettings() {
        const container = root.querySelector('[data-role="settings"]');
        if (!container) return;
        if (feature.id === 'ambient') {
            container.innerHTML = ambientSettingsHTML();
            applyI18n(container);
            await loadAmbientSettings();
            return;
        }
        const html = settingsBlockHTML(feature.id);
        // customization.option without a block in settings.js (BLOCKS): say so rather than show an empty card
        if (!html) {
            container.innerHTML = `<p class="joorney-empty">${escapeHTML(t('optionsFeature_settingsMissing'))}</p>`;
            return;
        }
        container.innerHTML = html;
        applyI18n(container);
        customization = await importFeatureCustomizationFile(feature.id);
        await customization.load();
    }
}

export const PAGE = {
    id: FEATURE_PAGE_ID,
    tour: 'tour_preferences',
    // The tour needs a feature with a Settings card; a feature page opened by a link keeps its own params
    tourParams: { feature: 'themeSwitch' },
    labelKey: 'options_menu_features',
    hidden: true,
    activeMenu: FEATURES_PAGE_ID,
    path: './pages/feature/index.html',
    loader: loadPage,
};
