import { v4 as uuidv4 } from 'uuid';
import { baseSettings } from '../../../configuration';
import { extensionFeatureState } from '../../../configuration.js';
import { handleExpanderClick } from '../../../lib/json-formatter/collapse.js';
import { buildDom } from '../../../lib/json-formatter/html.js';
import { stringToHTML } from '../../../src/html_generator';
import { StorageSync } from '../../../src/utils/browser.js';

export async function loadPage(features, currentSettings) {
    loadFeaturesPreview(features);
    loadConfigurationPreview(currentSettings);
    handleExpanderClick();
    handleWindowActionFallback(currentSettings.windowActionFallbacks);
}

async function loadFeaturesPreview(features) {
    let preview = document.getElementById('joorney-extension-state');
    preview.innerHTML = '';
    preview.appendChild(buildDom(extensionFeatureState));
    //preview.innerHTML = JSON.stringify(extensionFeatureState, null, 4);
    preview = document.getElementById('joorney-extension-features');
    preview.innerHTML = '';
    preview.appendChild(buildDom(features, false, true));
    //preview.innerHTML = JSON.stringify(features, null, 4);
}

async function loadConfigurationPreview(currentSettings) {
    const preview = document.getElementById('joorney-storage-configuration');
    preview.innerHTML = '';
    preview.appendChild(buildDom(currentSettings, false, true));
    //debug.innerHTML = JSON.stringify(currentSettings, null, 4);
}

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
