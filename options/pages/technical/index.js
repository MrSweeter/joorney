import { v4 as uuidv4 } from 'uuid';
import { baseSettings } from '../../../configuration';
import { extensionFeatureState } from '../../../configuration.js';
import { handleExpanderClick } from '../../../lib/json-formatter/collapse.js';
import { buildDom } from '../../../lib/json-formatter/html.js';
import { getOdooData } from '../../../src/api/github.js';
import { getLocal, getStorageUsage } from '../../../src/api/local.js';
import { getOnboardingProgressData } from '../../../src/checklist/index.js';
import { tours } from '../../../src/checklist/tour.js';
import { stringToHTML } from '../../../src/html_generator';
import { StorageLocal, StorageSync, isDevMode } from '../../../src/utils/browser.js';
import { sleep } from '../../../src/utils/util.js';
import { updateSupportedDevelopmentVersion } from '../../../src/utils/version.js';
import DoubleProgressBar from './doubleprogress.js';

export async function loadPage(features, currentSettings) {
    loadExperimental(currentSettings);

    handleWindowActionFallback(currentSettings.windowActionFallbacks);

    loadStorage(features, currentSettings);

    await loadChaos();
}

function loadExperimental(currentSettings) {
    const { developerMode, useSimulatedUI, omniboxFocusCurrentTab, cacheEncodingBase64 } = currentSettings;

    const developerModeUIElement = document.getElementById('joorney_experimentalDeveloperModeUI');
    developerModeUIElement.checked = developerMode;
    developerModeUIElement.onchange = async (e) => {
        await StorageSync.set({ developerMode: e.target.checked });
        await updateSupportedDevelopmentVersion(e.target.checked ? (await getOdooData())?.developmentOdooVersions : []);
    };

    const useSimulatedUIElement = document.getElementById('joorney_experimentalSimulatedUI');
    useSimulatedUIElement.checked = useSimulatedUI;
    useSimulatedUIElement.onchange = (e) => {
        StorageSync.set({ useSimulatedUI: e.target.checked });
    };

    const omniboxElement = document.getElementById('joorney_experimentalOmniboxFocusCurrentTab');
    omniboxElement.checked = omniboxFocusCurrentTab;
    omniboxElement.onchange = (e) => {
        StorageSync.set({ omniboxFocusCurrentTab: e.target.checked });
    };

    const base64Element = document.getElementById('joorney_experimentalBase64CacheEncoding');
    base64Element.checked = cacheEncodingBase64;
    base64Element.onchange = (e) => {
        StorageSync.set({ cacheEncodingBase64: e.target.checked });
    };
}

//#region Storage
async function loadStorage(features, currentSettings) {
    loadFeaturesPreview(features);
    loadConfigurationPreview(currentSettings);
    await loadLocalDataPreview();
    await loadOnboardingProgression();
    handleExpanderClick();

    let sections = [];
    for (const feature of features) {
        sections.push({
            label: feature.display_name,
            usage: await StorageSync.getBytesInUse(Object.keys(feature.defaultSettings)),
        });
    }
    sections.push({
        label: 'Base',
        usage: await StorageSync.getBytesInUse(Object.keys(baseSettings)),
    });

    new DoubleProgressBar(
        'Sync Storage',
        'joorney-sync-storage-progress-label',
        'joorney-sync-storage-progress-switch',
        'joorney-sync-storage-byteUsageTotal',
        'joorney-sync-storage-byteUsageFeature',
        StorageSync.QUOTA_BYTES,
        await StorageSync.getBytesInUse(undefined),
        sections
    );

    sections = [];
    for (const tour of Object.values(tours)) {
        sections.push({
            label: `[Onboard] ${tour.title}`,
            usage: await getStorageUsage(...Object.keys(tour.store)),
        });
    }
    sections.push({
        label: 'Cache',
        usage: await getStorageUsage('joorneyLocalCacheCall'),
    });
    sections.push({
        label: 'Extension Off',
        usage: await getStorageUsage('offs'),
    });
    sections.push({
        label: 'Extension Announcement',
        usage: await getStorageUsage('journey_announces'),
    });
    sections.push({
        label: 'Ambient computed events',
        usage: await getStorageUsage('ambient_dates'),
    });
    sections.push({
        label: 'Sunrise / Sunset ',
        usage: await getStorageUsage('joorney_sunrise', 'joorney_sunset', 'joorney_date'),
    });

    new DoubleProgressBar(
        'Local Storage',
        'joorney-local-storage-progress-label',
        'joorney-local-storage-progress-switch',
        'joorney-local-storage-byteUsageTotal',
        'joorney-local-storage-byteUsageFeature',
        StorageLocal.QUOTA_BYTES,
        await getStorageUsage(),
        sections
    );
}

function loadFeaturesPreview(features) {
    let preview = document.getElementById('joorney-extension-state');
    preview.innerHTML = '';
    preview.appendChild(buildDom(extensionFeatureState, false, true));
    //preview.innerHTML = JSON.stringify(extensionFeatureState, null, 4);
    preview = document.getElementById('joorney-extension-features');
    preview.innerHTML = '';
    preview.appendChild(buildDom(features, false, true));
    //preview.innerHTML = JSON.stringify(features, null, 4);
}

function loadConfigurationPreview(currentSettings) {
    const preview = document.getElementById('joorney-storage-configuration');
    preview.innerHTML = '';
    preview.appendChild(buildDom(currentSettings, false, true));
    //debug.innerHTML = JSON.stringify(currentSettings, null, 4);
}

async function loadLocalDataPreview() {
    const cache = await getLocal();
    const preview = document.getElementById('joorney-storage-local');
    preview.innerHTML = '';
    preview.appendChild(buildDom(cache, false, true));
}

async function loadOnboardingProgression() {
    const progress = await getOnboardingProgressData();
    const preview = document.getElementById('joorney-onboarding-progression');
    preview.innerHTML = '';
    preview.appendChild(buildDom(progress, false, true));
    //debug.innerHTML = JSON.stringify(progress, null, 4);
}
//#endregion

//#region Window Action Fallback
function handleWindowActionFallback(windowActionFallbacks) {
    loadWindowActionFallback(windowActionFallbacks);
    document.getElementById('joorney_window_action_fallback_new_path_save').onclick = createFallback;
}

async function createFallback() {
    const originString = document.getElementById('joorney_window_action_fallback_new_origin')?.value?.trim();
    const path = document.getElementById('joorney_window_action_fallback_new_action_path')?.value?.trim();
    const model = document.getElementById('joorney_window_action_fallback_new_action_model')?.value?.trim();

    if (!originString) {
        renderFallbackError('Missing origin');
        return;
    }

    if (!path) {
        renderFallbackError('Missing path');
        return;
    }

    if (!model) {
        renderFallbackError('Missing model');
        return;
    }

    try {
        const origin = new URL(originString).origin;
        const windowActionFallbacks = await readFallbacks();

        const originsFallbacks = windowActionFallbacks[origin] ?? {};
        originsFallbacks[path] = model;

        windowActionFallbacks[origin] = originsFallbacks;
        await StorageSync.set({ windowActionFallbacks });

        loadWindowActionFallback(windowActionFallbacks);
    } catch (ex) {
        renderFallbackError(ex);
    }
}

function renderFallbackError(errorMessage) {
    const container = document.getElementById('joorney_window_action_fallback_error_footer');
    container.textContent = errorMessage;
    container.style.display = errorMessage ? 'table-cell' : 'none';
}

function loadWindowActionFallback(windowActionFallbacks) {
    const container = document.getElementById('joorney_window_action_fallback_table_body');
    container.innerHTML = '';
    renderFallbackError();

    for (const [k, v] of Object.entries(windowActionFallbacks)) {
        renderOriginFallback(k, v, container);
    }
}

function renderOriginFallback(origin, values, container) {
    if (Object.keys(values).length === 0) return;

    const idx = uuidv4();
    const originID = `joorney_window_action_fallback_origin_delete_${idx}`;
    const originRow = stringToHTML(`
        <tr>
            <td colspan="3" class="text-center fw-bold joorney-valign-middle">${origin}</td>
            <td class="joorney-valign-middle">
                <button
                    class="${originID} btn btn-outline-danger border-0 btn-floating"
                    title="Delete all fallbacks"
                >
                    <i class="joorney-font-icon-size fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `);
    const deleteButton = originRow.getElementsByClassName(originID)[0];
    deleteButton.onclick = () => deleteOriginsFallback(origin);
    container.appendChild(originRow);

    for (const [k, v] of Object.entries(values)) {
        renderFallback(origin, k, v, container);
    }
}

function renderFallback(origin, actionPath, actionModel, container) {
    const idx = uuidv4();
    const originID = `joorney_window_action_fallback_delete_${idx}`;
    const fallbackRow = stringToHTML(`
        <tr>
            <td class="joorney-valign-middle">${origin}</td>
            <td class="joorney-valign-middle">${actionPath}</td>
            <td class="joorney-valign-middle">${actionModel}</td>
            <td class="joorney-valign-middle">
                <button
                    class="${originID} btn btn-outline-danger border-0 btn-floating"
                    title="Delete fallback"
                >
                    <i class="joorney-font-icon-size fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `);
    const deleteButton = fallbackRow.getElementsByClassName(originID)[0];
    deleteButton.onclick = () => deleteFallbackPath(origin, actionPath);
    container.appendChild(fallbackRow);
}

async function readFallbacks() {
    const { windowActionFallbacks } = await StorageSync.get(baseSettings);
    return windowActionFallbacks;
}

async function deleteOriginsFallback(origin) {
    if (confirm(`Are you sure you want to remove origin: ${origin}?`)) {
        const windowActionFallbacks = await readFallbacks();
        delete windowActionFallbacks[origin];
        StorageSync.set({ windowActionFallbacks });

        loadWindowActionFallback(windowActionFallbacks);
    }
}

async function deleteFallbackPath(origin, actionPath) {
    if (confirm(`Are you sure you want to remove path "${actionPath}" for origin "${origin}"?`)) {
        const windowActionFallbacks = await readFallbacks();
        delete windowActionFallbacks[origin]?.[actionPath];
        if (Object.keys(windowActionFallbacks[origin]).length === 0) {
            delete windowActionFallbacks[origin];
        }
        StorageSync.set({ windowActionFallbacks });

        loadWindowActionFallback(windowActionFallbacks);
    }
}
//#endregion

//#region Developer Mode
async function loadChaos() {
    const isdev = await isDevMode();
    const ischaos = new URL(window.location.href).searchParams.get('chaos');
    if (!isdev || !ischaos) return;
    await sleep(5000);
    const chaos = document.getElementById('joorney_chaos_mode');
    if (!chaos) return;
    const actions = [
        { id: 'joorney_chaos_destroy_local_storage', action: () => StorageLocal.clear() },
        { id: 'joorney_chaos_destroy_sync_storage', action: () => StorageSync.clear() },
    ];
    for (const action of actions) {
        const actionElement = document.getElementById(action.id);
        actionElement.onclick = (e) => {
            confirmChaos(e.target.innerText, action.action);
        };
        actionElement.classList.remove('d-none');
    }
    chaos.classList.remove('d-none');
}

async function confirmChaos(name, action) {
    if (confirm(`Confirm "${name}". This page will be reloaded!!!`)) {
        const isdev = await isDevMode();
        const ischaos = new URL(window.location.href).searchParams.get('chaos');
        if (isdev && ischaos) {
            action();
            window.location.reload();
        } else {
            alert('DEVELOPMENT MODE NOT ACTIVE');
        }
    }
}
//#endregion
