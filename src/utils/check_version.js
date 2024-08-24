import { getAnnounceData } from '../api/github.js';
import { getAnnounceCloseStatus } from '../api/local.js';
import { Action, Management, Runtime } from './browser.js';

const fetchVersion = 'https://raw.githubusercontent.com/MrSweeter/joorney/master/manifest.json';

async function getInstallType() {
    const extension = await Management.getSelf();
    return extension.installType;
}

export async function isDevMode() {
    const installType = await getInstallType();
    return installType === 'development';
}

export async function checkVersion() {
    const installType = await getInstallType();
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
export function openOption(force = false) {
    const currentVersion = removeBuildFromVersion(Runtime.getManifest().version);
    if (force || openOption4Version.includes(currentVersion)) {
        Runtime.openOptionsPage();
    }
}

export async function getAnnounce() {
    const currentVersion = removeBuildFromVersion(Runtime.getManifest().version);
    const announces = await getAnnounceData();
    const announce = announces[currentVersion];
    if (!announce || !announce.hash) return undefined;
    if (announce.closeable !== false) {
        const status = await getAnnounceCloseStatus(currentVersion);
        if (status) return undefined;
    }
    return { ...announce, version: currentVersion, closeable: announce.closeable === true };
}
