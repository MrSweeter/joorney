import { updateSupportedDevelopmentVersion, updateSupportedVersion } from '../src/utils/version.js';
import odooData from '../store/odoo.json';

/**
 * A lite build doesn't fetch store/odoo.json from GitHub: it uses the copy bundled at build time,
 * new Odoo versions come with a rebuild. Same version integrity check as refreshSupportedVersions.
 */
export async function refreshBundledVersions() {
    await updateSupportedVersion(odooData.availableOdooVersions);
    await updateSupportedDevelopmentVersion(odooData.developmentOdooVersions);
    return odooData;
}
