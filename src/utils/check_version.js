import { getAnnounceData, getOdooData } from '../api/github.js';
import { getAnnounceCloseStatus } from '../api/local.js';
import { Action, getInstallType, Runtime } from './browser.js';
import { updateSupportedDevelopmentVersion, updateSupportedVersion } from './version.js';

const fetchVersion = 'https://raw.githubusercontent.com/MrSweeter/joorney/master/manifest.json';

export async function refreshSupportedVersions() {
    const odooData = (await getOdooData()) ?? {};
    await updateSupportedVersion(odooData.availableOdooVersions);
    await updateSupportedDevelopmentVersion(odooData.developmentOdooVersions);
}

export async function checkVersion() {
    const installType = await getInstallType();

    await refreshSupportedVersions();

    if (!['development', 'other'].includes(installType)) return;
    const res = await fetch(fetchVersion);
    if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${fetchVersion}`);
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

const ANNOUNCE_KINDS = ['release', 'info', 'warning'];
const ANNOUNCE_MAX_ITEMS = 8;
const ANNOUNCE_ICON = /^[a-z0-9_]{1,40}$/;

function text(value, max = 600) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function sanitizeItems(items) {
    if (!Array.isArray(items)) return [];
    return items
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
            icon: ANNOUNCE_ICON.test(item.icon) ? item.icon : 'check',
            title: text(item.title, 120),
            description: text(item.description),
        }))
        .filter((item) => item.title)
        .slice(0, ANNOUNCE_MAX_ITEMS);
}

function sanitizeNotes(notes) {
    try {
        const url = new URL(notes);
        return url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}

export async function getAnnounce({ includeClosed = false } = {}) {
    const currentVersion = Runtime.getManifest().version_name.replace(/-dev$/, '');
    const announces = await getAnnounceData();
    const announce = announces?.[currentVersion];
    if (!announce?.hash) return undefined;
    const closeable = announce.closeable !== false;
    const closed = closeable && Boolean(await getAnnounceCloseStatus(announce.hash));
    if (closed && !includeClosed) return undefined;
    return {
        ...announce,
        version: removeBuildFromVersion(currentVersion),
        closeable,
        closed,
        kind: ANNOUNCE_KINDS.includes(announce.kind) ? announce.kind : 'release',
        items: sanitizeItems(announce.items),
        notes: sanitizeNotes(announce.notes),
    };
}
