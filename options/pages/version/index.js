import { baseSettings } from '../../../configuration.js';
import { stringToHTML } from '../../../src/html_generator.js';
import { StorageSync } from '../../../src/utils/browser.js';

const SUPPORTED_VERSION = [
    '14.0',
    '15.0',
    'saas-15.2',
    '16.0',
    'saas-16.1',
    'saas-16.2',
    'saas-16.3',
    'saas-16.4',
    '17.0',
    'saas-17.1',
    'saas-17.2',
    //'saas-17.3',
    //'18.0'
];

export async function loadPage(features, currentSettings) {
    loadSupportedOdoo(currentSettings);
    loadSupportedFeature(features);
}

function loadSupportedOdoo(currentSettings) {
    const versionContainer = document.getElementById('qol-odoo-versions');
    const supported = currentSettings.supportedVersions;

    for (const version of SUPPORTED_VERSION) {
        const versionID = sanitizeVersionID(version);
        const versionElement = stringToHTML(`
			<label
				title="[Odoo Version] ${version}"
				for="qol_${versionID}_version"
				style="width: 200px"
			>
				<input id="qol_${versionID}_version" class="input-hide" type="checkbox" />
				<div class="odoo-version-wrapper d-flex align-items-center justify-content-center">
					<i class="qol-font-icon-size fa-regular me-2"></i>
					<p>${version}</p>
				</div>
			</label>
		`);
        versionContainer.appendChild(versionElement);

        const versionInput = document.getElementById(`qol_${versionID}_version`);
        versionInput.checked = supported.includes(version);
        versionInput.onchange = async (e) => {
            const { supportedVersions } = await StorageSync.get(baseSettings);
            const versions = new Set(supportedVersions);
            e.target.checked ? versions.add(version) : versions.delete(version);
            await StorageSync.set({ supportedVersions: Array.from(versions) });
        };
    }
}

function loadSupportedFeature(features) {
    const versionContainer = document.getElementById('qol-feature-versions');

    for (const feature of features) {
        const versionElement = stringToHTML(`
			<div class="w-100 my-1">
				<span><strong>${feature.display_name ?? feature.id}:</strong></span>
				<span>${feature.supported_version
                    .map((v) => `<span class="badge badge-info">${v}</span>`)
                    .join(' ')}</span>
			</div>
		`);
        versionContainer.appendChild(versionElement);
    }
}

function sanitizeVersionID(version) {
    return version.replace('.', '_');
}

function sanitizeVersion(version) {
    return version.replace('saas-', '');
}
