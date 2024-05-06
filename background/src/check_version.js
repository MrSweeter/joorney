import { Action, Runtime } from '../../src/utils/browser.js';

const fetchVersion = 'https://raw.githubusercontent.com/MrSweeter/vigilant-potato/master/manifest.json';

export async function checkVersion() {
    const res = await fetch(fetchVersion);
    const manifest = await res.json();
    const remoteVersion = manifest.version;
    const currentVersion = Runtime.getManifest().version;

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
