import { baseSettings } from '../../../configuration.js';
import { stringToHTML } from '../../../src/html_generator.js';
import { includeVersion } from '../../../src/utils/authorize.js';
import { StorageSync } from '../../../src/utils/browser.js';
import { SUPPORTED_VERSION } from '../../../src/utils/version.js';

export async function loadPage(features, currentSettings) {
    loadSupportedOdoo(currentSettings, features);
    loadSupportedFeature(features, currentSettings.supportedVersions);
}

function loadSupportedOdoo(currentSettings, features) {
    const versionContainer = document.getElementById('joorney-odoo-versions');
    const supported = currentSettings.supportedVersions;

    for (const version of SUPPORTED_VERSION) {
        const versionID = sanitizeVersionID(version);
        const versionElement = stringToHTML(`
			<label
				title="[Odoo Version] ${version}"
				for="joorney_${versionID}_version"
				style="width: 200px"
			>
				<input id="joorney_${versionID}_version" class="input-hide" type="checkbox" />
				<div class="odoo-version-wrapper d-flex align-items-center justify-content-center">
					<i class="joorney-font-icon-size fa-regular me-2"></i>
					<p>${version}</p>
				</div>
			</label>
		`);
        versionContainer.appendChild(versionElement);

        const versionInput = document.getElementById(`joorney_${versionID}_version`);
        versionInput.checked = supported.includes(version);
        versionInput.onchange = async (e) => {
            const { supportedVersions } = await StorageSync.get(baseSettings);
            let versions = new Set(supportedVersions);
            e.target.checked ? versions.add(version) : versions.delete(version);
            versions = Array.from(versions);
            await StorageSync.set({ supportedVersions: versions });
            await loadSupportedFeature(features, versions);
        };
    }
}

async function loadSupportedFeature(features, supportedVersions) {
    const versionContainerHead = document.getElementById('joorney-feature-versions-head');
    versionContainerHead.innerHTML = '';

    const header = stringToHTML(`
        <tr>
            <th class="text-end opacity-50">Compatibility</th>
            <th class="text-center" style="width: 32px"><i class="fa-solid fa-icons"></i></th>
            ${SUPPORTED_VERSION.map((v) => `<th class="text-center">${v}</th>`).join('')}
        </tr>
    `);
    versionContainerHead.appendChild(header);

    const versionContainerBody = document.getElementById('joorney-feature-versions-body');
    versionContainerBody.innerHTML = '';

    for (const feature of features.filter((f) => !f.limited)) {
        const versions = SUPPORTED_VERSION.map((v) => {
            return {
                odoo: includeVersion(supportedVersions, v),
                feature: includeVersion(feature.supported_version, v, true),
            };
        });
        const versionRow = stringToHTML(`
            <tr>
                <th class="text-end">
                    <span>${feature.display_name ?? feature.id}</span>
                </th>
                <th>
                    <div class="icon-wrapper">
                        ${feature.icon}
                    </div>
                </th>
                ${versions
                    .map(
                        (v) =>
                            `<td class="text-center table-${v.feature ? (v.odoo ? 'success' : 'warning') : 'danger'}">
                                <span class="opacity-25">${v.feature}</span>
                            </td>`
                    )
                    .join('')}
            </tr>
		`);
        versionContainerBody.appendChild(versionRow);
    }
}

function sanitizeVersionID(version) {
    return version.replace('.', '_');
}
