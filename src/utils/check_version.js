import { getAnnounceData, getOdooData } from '../api/github.js';
import { getAnnounceCloseStatus } from '../api/local.js';
import { Action, Runtime, getInstallType } from './browser.js';
import { updateSupportedDevelopmentVersion, updateSupportedVersion } from './version.js';

const fetchVersion = 'https://raw.githubusercontent.com/MrSweeter/joorney/master/manifest.json';

export async function checkVersion() {
    const installType = await getInstallType();

    const odooData = await getOdooData();
    updateSupportedVersion(odooData?.availableOdooVersions);
    await updateSupportedDevelopmentVersion(odooData?.developmentOdooVersions);

    if (!['development', 'other'].includes(installType)) return;
    const res = await fetch(fetchVersion);
    const manifest = await res.json();
    const remoteVersion = removeBuildFromVersion(manifest.version);
    const currentVersion = removeBuildFromVersion(Runtime.getManifest().version);

    let badgeText = { text: '' };

    if (
        remoteVersion.localeCompare(currentVersion, undefined, {
            numeric: true,
            sensitivity: 'base',
        }) > 0
    ) {
        badgeText = { text: remoteVersion };
    }

    await Action.setBadgeText(badgeText);
    await Action.setBadgeBackgroundColor({
        color: '#FF0000',
    });
}

function removeBuildFromVersion(version) {
    return version.split('.').slice(0, 3).join('.');
}

/*
- 2.1.0: Initial/Public release
- 2.2.0: [Feature] Pin Message
- 2.3.0: [Feature] Ambient
*/
const openOption4Version = ['2.1.0', '2.2.0', '2.3.0'];
export async function openOption(force = false, previousVersionFull = false) {
    const previousVersion = previousVersionFull ? removeBuildFromVersion(previousVersionFull) : null;
    const currentVersion = removeBuildFromVersion(Runtime.getManifest().version);
    const announce = await getAnnounce();
    if (force || announce || (currentVersion !== previousVersion && openOption4Version.includes(currentVersion))) {
        Runtime.openOptionsPage();
    }
}

export async function getAnnounce() {
    const currentVersion = Runtime.getManifest().version_name;
    const announces = await getAnnounceData();
    const announce = announces[currentVersion];
    if (!announce || !announce.hash) return undefined;
    if (announce.closeable !== false) {
        const status = await getAnnounceCloseStatus(announce.hash);
        if (status) return undefined;
    }
    return { ...announce, version: removeBuildFromVersion(currentVersion), closeable: announce.closeable === true };
}
