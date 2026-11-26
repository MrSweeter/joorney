import { baseSettings, extensionFeatureState } from '../../../configuration.js';
import { handleExpanderClick } from '../../../lib/json-formatter/collapse.js';
import { buildDom } from '../../../lib/json-formatter/html.js';
import { getOdooData } from '../../../src/api/github.js';
import { getLocal, getStorageUsage } from '../../../src/api/local.js';
import { getOnboardingProgressData } from '../../../src/checklist/index.js';
import { tours } from '../../../src/checklist/tour.js';
import { escapeHTML, stringToHTML } from '../../../src/html_generator.js';
import { Console, isDevMode, StorageLocal, StorageSync } from '../../../src/utils/browser.js';
import { featureName, t } from '../../../src/utils/i18n.js';
import { iconHTML } from '../../../src/utils/icons.js';
import { updateSupportedDevelopmentVersion } from '../../../src/utils/version.js';
import { isRegexOrigin, normalizeOrigin } from '../../src/origins.js';
import DoubleProgressBar from './doubleprogress.js';

export async function loadPage(features, currentSettings) {
    loadFlags(currentSettings);

    handleWindowActionFallback(currentSettings.windowActionFallbacks);

    await loadStorage(features, currentSettings);

    await loadChaos();
}

//#region Flags
// The ids of the switches are targeted by the Developers tour
const FLAGS = [
    {
        key: 'developerMode',
        id: 'joorney_experimentalDeveloperModeUI',
        labelKey: 'optionsTechnical_developerMode',
        helpKey: 'optionsTechnical_developerModeHelp',
        onChange: async (value) => {
            await StorageSync.set({ developerMode: value });
            await updateSupportedDevelopmentVersion(value ? (await getOdooData())?.developmentOdooVersions : []);
            // The danger zone (?chaos) unlocks with developer mode: show its buttons without a reload
            await loadChaos();
        },
    },
    {
        key: 'useSimulatedUI',
        id: 'joorney_experimentalSimulatedUI',
        labelKey: 'optionsTechnical_simulatedUi',
        helpKey: 'optionsTechnical_simulatedUiHelp',
    },
    {
        key: 'omniboxFocusCurrentTab',
        id: 'joorney_experimentalOmniboxFocusCurrentTab',
        labelKey: 'optionsTechnical_omniboxCurrentTab',
        helpKey: 'optionsTechnical_omniboxCurrentTabHelp',
    },
    {
        key: 'cacheEncodingBase64',
        id: 'joorney_experimentalBase64CacheEncoding',
        labelKey: 'optionsTechnical_base64Cache',
        helpKey: 'optionsTechnical_base64CacheHelp',
    },
];

function loadFlags(currentSettings) {
    const container = document.getElementById('joorney-tech-flags');
    container.replaceChildren();
    for (const flag of FLAGS) {
        const row = stringToHTML(`
            <div class="joorney-tech-flag">
                <button type="button" role="switch" class="joorney-switch" id="${flag.id}" aria-checked="${!!currentSettings[flag.key]}"></button>
                <div>
                    <label class="joorney-tech-flag-label" for="${flag.id}">${escapeHTML(t(flag.labelKey))}</label>
                    <span class="joorney-mono">${flag.key}</span>
                    <p class="joorney-help">${escapeHTML(t(flag.helpKey))}</p>
                </div>
            </div>
        `);
        const toggle = row.querySelector('button');
        toggle.onclick = async () => {
            const value = toggle.getAttribute('aria-checked') !== 'true';
            toggle.setAttribute('aria-checked', value);
            await (flag.onChange ?? ((v) => StorageSync.set({ [flag.key]: v })))(value);
        };
        container.appendChild(row);
    }
}
//#endregion

//#region Storage
// Selected tab and, for the sync one, the selected view. Only that tree is built, once, then kept for its folds.
const STORAGE_TABS = [
    { id: 'sync', labelKey: 'optionsTechnical_tab_sync' },
    { id: 'local', labelKey: 'optionsTechnical_tab_local' },
    { id: 'onboarding', labelKey: 'optionsTechnical_tab_onboarding' },
];
const SYNC_VIEWS = [
    { id: 'config', domId: 'joorney-storage-configuration', titleKey: 'optionsTechnical_configuration' },
    { id: 'state', domId: 'joorney-extension-state', titleKey: 'optionsTechnical_featuresState' },
    { id: 'features', domId: 'joorney-extension-features', titleKey: 'optionsTechnical_features' },
];
const LOCAL_VIEW = { id: 'local', domId: 'joorney-storage-local', titleKey: 'optionsTechnical_localData' };
const ONBOARDING_VIEW = {
    id: 'onboarding',
    domId: 'joorney-onboarding-progression',
    titleKey: 'optionsTechnical_onboarding',
};

async function loadStorage(features, currentSettings) {
    const sources = {
        config: () => currentSettings,
        state: () => extensionFeatureState,
        features: () => features,
        local: () => getLocal(),
        onboarding: () => getOnboardingProgressData(),
    };
    const trees = new Map();
    const bars = {};
    let tab = 'sync';
    let view = 'config';

    bars.sync = await syncUsage(features);
    bars.local = await localUsage();

    const tabsElement = document.getElementById('joorney-tech-tabs');
    const panel = document.getElementById('joorney-tech-panel');
    const usageElement = document.getElementById('joorney-tech-usage');
    const viewsElement = document.getElementById('joorney-tech-views');
    const titleElement = document.getElementById('joorney-tech-viewtitle');
    const viewer = document.getElementById('joorney-tech-viewer');
    // A slow source must not overwrite a newer selection
    let renderToken = 0;

    const currentView = () => (tab === 'sync' ? SYNC_VIEWS.find((v) => v.id === view) : null);

    async function render() {
        const token = ++renderToken;
        for (const button of tabsElement.children) {
            const selected = button.dataset.tab === tab;
            button.setAttribute('aria-selected', selected);
            button.tabIndex = selected ? 0 : -1;
        }
        panel.setAttribute('aria-labelledby', `joorney-tech-tab-${tab}`);

        usageElement.replaceChildren();
        if (bars[tab]) usageElement.appendChild(bars[tab].container);

        viewsElement.hidden = tab !== 'sync';
        for (const button of viewsElement.children) button.setAttribute('aria-pressed', button.dataset.view === view);

        const selected = currentView() ?? (tab === 'local' ? LOCAL_VIEW : ONBOARDING_VIEW);
        titleElement.textContent = t(selected.titleKey);
        if (!trees.has(selected.id)) {
            const tree = stringToHTML(`<div id="${selected.domId}"></div>`);
            tree.appendChild(buildDom(await sources[selected.id](), false, true));
            trees.set(selected.id, tree);
        }
        if (token !== renderToken) return;
        viewer.replaceChildren(trees.get(selected.id));
        handleExpanderClick();
    }

    for (const { id, labelKey } of STORAGE_TABS) {
        const button = stringToHTML(
            `<button type="button" role="tab" class="joorney-tech-tab" id="joorney-tech-tab-${id}" data-tab="${id}" aria-controls="joorney-tech-panel">${escapeHTML(t(labelKey))}</button>`
        );
        button.onclick = () => {
            tab = id;
            render();
        };
        tabsElement.appendChild(button);
    }
    tabsElement.onkeydown = (e) => {
        const ids = STORAGE_TABS.map((x) => x.id);
        const index = ids.indexOf(tab);
        const next = {
            ArrowRight: ids[(index + 1) % ids.length],
            ArrowLeft: ids[(index - 1 + ids.length) % ids.length],
            Home: ids[0],
            End: ids[ids.length - 1],
        }[e.key];
        if (!next) return;
        e.preventDefault();
        tab = next;
        render();
        document.getElementById(`joorney-tech-tab-${next}`).focus();
    };

    viewsElement.replaceChildren();
    for (const { id, titleKey } of SYNC_VIEWS) {
        const button = stringToHTML(
            `<button type="button" data-view="${id}" id="joorney-tech-view-${id}">${escapeHTML(t(titleKey))}</button>`
        );
        button.onclick = () => {
            view = id;
            render();
        };
        viewsElement.appendChild(button);
    }

    await render();
}

async function syncUsage(features) {
    const sections = [];
    for (const feature of features) {
        sections.push({
            label: featureName(feature),
            usage: await StorageSync.getBytesInUse(Object.keys(feature.defaultSettings)),
        });
    }
    sections.push({
        label: t('optionsTechnical_storage_base'),
        usage: await StorageSync.getBytesInUse(Object.keys(baseSettings)),
    });
    return new DoubleProgressBar(
        stringToHTML('<div></div>'),
        t('optionsTechnical_storage_sync'),
        StorageSync.QUOTA_BYTES,
        await StorageSync.getBytesInUse(undefined),
        sections
    );
}

async function localUsage() {
    const sections = [];
    for (const tour of Object.values(tours)) {
        sections.push({
            label: t('optionsTechnical_storage_onboard', t(tour.titleKey)),
            usage: await getStorageUsage(...Object.keys(tour.store)),
        });
    }
    for (const { labelKey, keys } of [
        { labelKey: 'optionsTechnical_storage_cache', keys: ['joorneyLocalCacheCall'] },
        { labelKey: 'optionsTechnical_storage_off', keys: ['offs'] },
        { labelKey: 'optionsTechnical_storage_announcement', keys: ['journey_announces'] },
        { labelKey: 'optionsTechnical_storage_ambient', keys: ['ambient_dates'] },
        { labelKey: 'optionsTechnical_storage_sun', keys: ['joorney_sunrise', 'joorney_sunset', 'joorney_date'] },
    ]) {
        sections.push({ label: t(labelKey), usage: await getStorageUsage(...keys) });
    }
    return new DoubleProgressBar(
        stringToHTML('<div></div>'),
        t('optionsTechnical_storage_local'),
        StorageLocal.QUOTA_BYTES,
        await getStorageUsage(),
        sections
    );
}
//#endregion

//#region Window Action Fallback
// Key of the row waiting for its inline confirmation ('origin' or 'origin|path'), one at a time
let pendingRemoval = null;
let currentFallbacks = {};

function handleWindowActionFallback(windowActionFallbacks) {
    pendingRemoval = null;
    loadWindowActionFallback(windowActionFallbacks);
    document.getElementById('joorney_window_action_fallback_new_path_save').onclick = createFallback;
    document.getElementById('joorney_window_action_fallback_form').onkeydown = (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') createFallback();
    };
}

async function createFallback() {
    const originString = document.getElementById('joorney_window_action_fallback_new_origin')?.value?.trim();
    const path = document.getElementById('joorney_window_action_fallback_new_action_path')?.value?.trim();
    const model = document.getElementById('joorney_window_action_fallback_new_action_model')?.value?.trim();

    if (!originString) {
        renderFallbackError(t('options_error_missingOrigin'));
        return;
    }

    if (!path) {
        renderFallbackError(t('optionsTechnical_error_missingPath'));
        return;
    }

    if (!model) {
        renderFallbackError(t('optionsTechnical_error_missingModel'));
        return;
    }

    // Same rules as the hosts (http(s) only: 'localhost:8069' would be saved under "null", 'ftp://x' never matches),
    // except regex: a fallback is looked up by the exact origin of the Odoo tab
    let origin;
    try {
        if (isRegexOrigin(originString)) throw new Error(`Regex origin: ${originString}`);
        origin = normalizeOrigin(originString);
    } catch (ex) {
        Console.warn(ex);
        renderFallbackError(t('options_error_invalidOrigin'));
        return;
    }

    try {
        const windowActionFallbacks = await readFallbacks();

        const originsFallbacks = windowActionFallbacks[origin] ?? {};
        originsFallbacks[path] = model;

        windowActionFallbacks[origin] = originsFallbacks;
        await StorageSync.set({ windowActionFallbacks });

        loadWindowActionFallback(windowActionFallbacks);
    } catch (ex) {
        Console.error(ex);
        renderFallbackError(t('optionsTechnical_error_save', ex?.message ?? String(ex)));
    }
}

function renderFallbackError(errorMessage) {
    const container = document.getElementById('joorney_window_action_fallback_error_footer');
    container.textContent = errorMessage ?? '';
    container.hidden = !errorMessage;
}

function loadWindowActionFallback(windowActionFallbacks) {
    currentFallbacks = windowActionFallbacks;
    const container = document.getElementById('joorney_window_action_fallback_list');
    container.replaceChildren();
    renderFallbackError();

    const origins = Object.entries(windowActionFallbacks).filter(([, values]) => Object.keys(values).length > 0);
    if (!origins.length) {
        container.appendChild(
            stringToHTML(
                `<p class="joorney-empty joorney-tech-empty">${escapeHTML(t('optionsTechnical_noFallbacks'))}</p>`
            )
        );
        return;
    }
    for (const [origin, values] of origins) {
        container.appendChild(renderOriginFallback(origin, values));
    }
}

// The delete button asks inline (Cancel / Remove, no confirm()): the confirmation takes the place of the row
function bindRemoval(row, key, question, remove) {
    const button = row.querySelector('.joorney-tech-delete');
    button.dataset.removal = key;
    button.onclick = () => {
        pendingRemoval = key;
        loadWindowActionFallback(currentFallbacks);
        document.querySelector('.joorney-tech-ask .joorney-tech-no')?.focus();
    };
    if (pendingRemoval !== key) return row;

    button.setAttribute('aria-expanded', 'true');
    const confirmRow = stringToHTML(`
        <div class="joorney-tech-row is-confirm">
            <div class="joorney-ask joorney-tech-ask" role="group" aria-label="${escapeHTML(question)}">
                <span>${escapeHTML(question)}</span>
                <span class="joorney-tech-grow"></span>
                <button type="button" class="joorney-btn is-secondary is-small joorney-tech-no">${escapeHTML(t('optionsTechnical_cancel'))}</button>
                <button type="button" class="joorney-btn is-small joorney-tech-yes">${escapeHTML(t('optionsTechnical_remove'))}</button>
            </div>
        </div>
    `);
    confirmRow.querySelector('.joorney-tech-no').onclick = () => {
        pendingRemoval = null;
        loadWindowActionFallback(currentFallbacks);
        for (const candidate of document.querySelectorAll('.joorney-tech-delete')) {
            if (candidate.dataset.removal === key) candidate.focus();
        }
    };
    confirmRow.querySelector('.joorney-tech-yes').onclick = async () => {
        pendingRemoval = null;
        await remove();
    };
    return confirmRow;
}

function renderOriginFallback(origin, values) {
    const count = Object.keys(values).length;
    const countLabel =
        count === 1 ? t('optionsTechnical_fallbackCountOne') : t('optionsTechnical_fallbackCountMany', String(count));
    const card = stringToHTML(`
        <section class="joorney-tech-host">
            <header class="joorney-tech-host-head">
                <h3>${escapeHTML(origin)}</h3>
                <span class="joorney-chip">${escapeHTML(countLabel)}</span>
                <span class="joorney-tech-grow"></span>
                <button type="button" class="joorney-btn is-text is-small joorney-tech-delete joorney-tech-origin-delete">
                    ${iconHTML('delete')}${escapeHTML(t('optionsTechnical_deleteAllFallbacks'))}
                </button>
            </header>
        </section>
    `);
    const head = card.querySelector('header');
    const question = t('optionsTechnical_confirmRemoveHost', origin);
    const ask = bindRemoval(head, origin, question, () => deleteOriginsFallback(origin));
    // Unlike a row, the header stays: it names the host being cleared
    if (ask !== head) head.after(ask);

    for (const [path, model] of Object.entries(values)) {
        card.appendChild(renderFallback(origin, path, model));
    }
    return card;
}

function renderFallback(origin, actionPath, actionModel) {
    const title = escapeHTML(t('optionsTechnical_deleteFallback', actionPath));
    const row = stringToHTML(`
        <div class="joorney-tech-row" role="group" aria-label="${escapeHTML(t('optionsTechnical_fallbackOpens', actionPath, actionModel))}">
            <span class="joorney-mono">${escapeHTML(actionPath)}</span>
            ${iconHTML('arrow_forward')}
            <span class="joorney-mono">${escapeHTML(actionModel)}</span>
            <span class="joorney-tech-grow"></span>
            <button type="button" class="joorney-icon-btn is-small joorney-tech-delete" title="${title}" aria-label="${title}">
                ${iconHTML('delete')}
            </button>
        </div>
    `);
    return bindRemoval(row, `${origin}|${actionPath}`, t('optionsTechnical_confirmRemoveFallback', actionPath), () =>
        deleteFallbackPath(origin, actionPath)
    );
}

async function readFallbacks() {
    const { windowActionFallbacks } = await StorageSync.get(baseSettings);
    return windowActionFallbacks;
}

async function deleteOriginsFallback(origin) {
    const windowActionFallbacks = await readFallbacks();
    delete windowActionFallbacks[origin];
    await StorageSync.set({ windowActionFallbacks });

    loadWindowActionFallback(windowActionFallbacks);
}

async function deleteFallbackPath(origin, actionPath) {
    const windowActionFallbacks = await readFallbacks();
    delete windowActionFallbacks[origin]?.[actionPath];
    if (Object.keys(windowActionFallbacks[origin] ?? {}).length === 0) {
        delete windowActionFallbacks[origin];
    }
    await StorageSync.set({ windowActionFallbacks });

    loadWindowActionFallback(windowActionFallbacks);
}
//#endregion

//#region Danger zone
const CHAOS_ACTIONS = [
    {
        id: 'joorney_chaos_destroy_local_storage',
        labelKey: 'optionsTechnical_destroyLocal',
        run: () => StorageLocal.clear(),
    },
    {
        id: 'joorney_chaos_destroy_sync_storage',
        labelKey: 'optionsTechnical_destroySync',
        run: () => StorageSync.clear(),
    },
];
const CHAOS_RELOAD_DELAY = 1500;

const hasChaosParam = () => new URL(window.location.href).searchParams.has('chaos');

async function isChaosAllowed() {
    return (await isDevMode()) && hasChaosParam();
}

// The card exists only with ?chaos in the address, its buttons only when developer mode is on too
async function loadChaos() {
    document.getElementById('joorney_chaos_mode').hidden = !hasChaosParam();
    const help = document.getElementById('joorney-tech-danger-help');
    const actions = document.getElementById('joorney-tech-danger-actions');
    actions.replaceChildren();
    if (!(await isChaosAllowed())) {
        help.textContent = t('optionsTechnical_dangerLocked');
        return;
    }
    help.textContent = t('optionsTechnical_chaosTitle');

    for (const action of CHAOS_ACTIONS) {
        const name = t(action.labelKey);
        const row = stringToHTML(`
            <div class="joorney-tech-danger-row">
                <b>${escapeHTML(name)}</b>
                <button type="button" class="joorney-btn is-secondary" id="${action.id}" aria-expanded="false">
                    ${iconHTML('delete')}<span>${escapeHTML(name)}</span>
                </button>
            </div>
        `);
        const button = row.querySelector('button');
        button.onclick = () => askChaos(row, button, name, action.run);
        actions.appendChild(row);
    }
}

function askChaos(row, button, name, run) {
    row.querySelector('.joorney-tech-panel-confirm')?.remove();
    button.setAttribute('aria-expanded', 'true');
    const panel = stringToHTML(`
        <div class="joorney-tech-panel-confirm" role="alertdialog" aria-label="${escapeHTML(name)}">
            <div>${escapeHTML(t('optionsTechnical_confirmChaos', name))}</div>
            <div class="joorney-row">
                <button type="button" class="joorney-btn joorney-tech-yes">${escapeHTML(t('optionsTechnical_confirm'))}</button>
                <button type="button" class="joorney-btn is-secondary joorney-tech-no">${escapeHTML(t('optionsTechnical_cancel'))}</button>
            </div>
        </div>
    `);
    row.appendChild(panel);
    const cancel = panel.querySelector('.joorney-tech-no');
    cancel.onclick = () => {
        panel.remove();
        button.setAttribute('aria-expanded', 'false');
        button.focus();
    };
    panel.querySelector('.joorney-tech-yes').onclick = async () => {
        // Checked again: developer mode may have been turned off since the page was loaded
        if (!(await isChaosAllowed())) {
            panel.replaceChildren(
                stringToHTML(`<div role="status"><b>${escapeHTML(t('optionsTechnical_devModeInactive'))}</b></div>`)
            );
            return;
        }
        panel.replaceChildren(
            stringToHTML(`<div role="status"><b>${escapeHTML(t('optionsTechnical_chaosDone'))}</b></div>`)
        );
        await run();
        setTimeout(() => window.location.reload(), CHAOS_RELOAD_DELAY);
    };
    cancel.focus();
}
//#endregion

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-technical',
    tour: 'tour_technical',
    labelKey: 'options_menu_developers',
    path: './pages/technical/index.html',
    loader: loadPage,
    technical: true,
};
