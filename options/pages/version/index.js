import { baseSettings } from '../../../configuration.js';
import { escapeHTML, stringToHTML } from '../../../src/html_generator.js';
import { includeVersion } from '../../../src/utils/authorize.js';
import { StorageSync } from '../../../src/utils/browser.js';
import { SUPPORTED_DEV_VERSION, SUPPORTED_VERSION } from '../../../src/utils/constant.js';
import { featureName, t } from '../../../src/utils/i18n.js';
import { iconHTML, setIcon } from '../../../src/utils/icons.js';
import { featurePageURL } from '../../src/ui/feature_card.js';
import { enqueue } from '../../src/ui/state.js';

export async function loadPage(features, currentSettings) {
    const matrixFeatures = features.filter((f) => !f.limited);
    const renderMatrix = (versions) => loadSupportedFeature(matrixFeatures, versions);

    const stable = SUPPORTED_VERSION.filter((v) => !isIntermediate(v));
    const intermediate = SUPPORTED_VERSION.filter(isIntermediate);
    const container = document.getElementById('joorney-odoo-versions');
    container.innerHTML = '';
    // Same wrapper as the development group, inside the container the tour targets
    for (const [title, versions] of [
        [t('optionsVersions_groupStable'), stable],
        [t('optionsVersions_groupIntermediate'), intermediate],
    ]) {
        if (!versions.length) continue;
        container.appendChild(
            stringToHTML(`
                <div class="joorney-versions-group">
                    <h3 class="joorney-versions-heading">${escapeHTML(title)}</h3>
                    <div class="joorney-versions-chips"></div>
                </div>
            `)
        );
        loadChips(container.lastElementChild.querySelector('.joorney-versions-chips'), versions, {
            selected: currentSettings.supportedVersions,
            storage: 'supportedVersions',
            onChange: renderMatrix,
        });
    }

    // Development versions only exist in developer mode (the list is empty otherwise)
    const devGroup = document.getElementById('joorney-odoo-dev-group');
    devGroup.hidden = SUPPORTED_DEV_VERSION.length === 0;
    const devContainer = document.getElementById('joorney-odoo-dev-versions');
    devContainer.innerHTML = '';
    loadChips(devContainer, SUPPORTED_DEV_VERSION, {
        selected: currentSettings.supportedDevVersions,
        storage: 'supportedDevVersions',
    });

    renderMatrix(currentSettings.supportedVersions);
}

function loadChips(container, versions, { selected, storage, onChange }) {
    for (const version of versions) {
        const versionID = sanitizeVersionID(version);
        const chip = stringToHTML(`
            <label
                class="joorney-version-chip"
                title="${escapeHTML(t('optionsVersions_versionTitle', versionLabel(version)))}"
                for="joorney_${versionID}_version"
            >
                <input id="joorney_${versionID}_version" type="checkbox" />
                ${iconHTML('radio_button_unchecked')}
                <span>${escapeHTML(versionLabel(version))}</span>
            </label>
        `);
        container.appendChild(chip);

        const input = chip.querySelector('input');
        const icon = chip.querySelector('.joorney-icon');
        const syncIcon = () => setIcon(icon, input.checked ? 'check_circle' : 'radio_button_unchecked');
        input.checked = selected.includes(version);
        syncIcon();
        input.onchange = async (e) => {
            syncIcon();
            const checked = e.target.checked;
            // Queued: two quick chips would both read the same list and the second write would drop the first
            await enqueue(async () => {
                // Read fresh: another tab or page may have changed the list since load
                const settings = await StorageSync.get(baseSettings);
                let list = new Set(settings[storage]);
                checked ? list.add(version) : list.delete(version);
                list = Array.from(list);
                await StorageSync.set({ [storage]: list });
                if (onChange) await onChange(list);
            });
        };
    }
}

async function loadSupportedFeature(features, supportedVersions) {
    const head = document.getElementById('joorney-feature-versions-head');
    head.innerHTML = '';
    head.appendChild(
        stringToHTML(`
            <tr>
                <th class="joorney-versions-feature" scope="col">${escapeHTML(t('optionsVersions_feature'))}</th>
                ${SUPPORTED_VERSION.map(
                    (v) =>
                        `<th scope="col" title="${escapeHTML(t('optionsVersions_versionTitle', versionLabel(v)))}" class="${includeVersion(supportedVersions, v) ? 'is-selected' : 'is-unselected'}"><div class="joorney-versions-label"><span>${escapeHTML(versionLabel(v))}</span></div></th>`
                ).join('')}
            </tr>
        `)
    );

    const body = document.getElementById('joorney-feature-versions-body');
    body.innerHTML = '';
    for (const feature of features) {
        const name = featureName(feature);
        const cells = SUPPORTED_VERSION.map((v) => {
            const selected = includeVersion(supportedVersions, v);
            const supported = includeVersion(feature.supported_version, v, true);
            const text = supported
                ? selected
                    ? t('optionsVersions_supported')
                    : t('optionsVersions_supportedOff')
                : t('optionsVersions_unsupported');
            return `<td class="${supported ? 'is-yes' : 'is-no joorney-versions-unsupported'} ${selected ? '' : 'is-unselected'}">
                ${iconHTML(supported ? 'check' : 'remove')}<span class="joorney-visually-hidden">${escapeHTML(text)}</span>
            </td>`;
        });
        body.appendChild(
            stringToHTML(`
                <tr>
                    <th class="joorney-versions-feature" scope="row">
                        <div class="joorney-versions-fcell">
                            <span class="joorney-versions-ficon">${iconHTML(feature.icon, { filled: true })}</span>
                            <a href="${escapeHTML(featurePageURL(feature.id))}">${escapeHTML(name)}</a>
                        </div>
                    </th>
                    ${cells.join('')}
                </tr>
            `)
        );
    }
}

// Stored versions carry no "saas-" prefix: only x.0 versions are stable, the others are intermediate (saas)
function isIntermediate(version) {
    return !version.endsWith('.0');
}

function versionLabel(version) {
    return isIntermediate(version) ? `saas-${version}` : version;
}

// Used in id/for attributes: the versions come from the remote store/odoo.json, keep only id-safe characters
function sanitizeVersionID(version) {
    return `${version}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Options menu entry, see options/menu.js
export const PAGE = {
    id: 'page-version',
    tour: 'tour_versions',
    labelKey: 'options_menu_versions',
    path: './pages/version/index.html',
    loader: loadPage,
};
