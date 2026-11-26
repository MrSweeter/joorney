import { baseSettings, importMigratorFile } from '../../../configuration.js';
import { escapeHTML } from '../../../src/html_generator.js';
import { Console, StorageSync } from '../../../src/utils/browser.js';
import { t } from '../../../src/utils/i18n.js';
import {
    checkConfigurationVersion,
    downloadSettings,
    IMPORT_EXPORT_PAGE_ID,
    MIGRATION_PAGE_ID,
    readSettingsFile,
    SettingsFileError,
    summarizeSettings,
    summaryChipsHTML,
    takePendingMigrationFile,
} from '../../import_export.js';
import { routeURL, setMenuBadge } from '../../src/layout.js';
import { setupDropzone } from '../../src/ui/dropzone.js';

/**
 * Migration page: brings the stored settings, or an exported file, up to baseSettings.configurationVersion.
 * Route: '?page=page-migration', opened from Import / export (which stays the active menu entry).
 */

// One line per migrator, keyed by the version it migrates from: add an entry here (and its i18n keys) when a
// migrator is added to MIGRATORS in configuration.js
const STEP_DESCRIPTIONS = {
    0: { textKey: 'migration_step_0' },
    1: { textKey: 'migration_step_1' },
};

const SOURCE = { CURRENT: 'current', FILE: 'file' };

let selection; // { source, settings, fileName, summary }
let migrated; // the settings once migrated, for the download
let running = false;
let confirming = false;

const root = () => document.getElementById('joorney-migration-page');

export async function loadPage(_features, currentSettings) {
    selection = undefined;
    migrated = undefined;
    running = false;
    confirming = false;
    const page = root();

    // Handlers first: nothing below may wait for an await
    const backHref = routeURL(IMPORT_EXPORT_PAGE_ID);
    document.getElementById('joorney-migration-back').href = backHref;
    const doneBack = document.getElementById('joorney-migration-done-back');
    doneBack.href = backHref;
    // Full reload, like Import: the menus and the language follow the migrated settings
    doneBack.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.assign(backHref);
    };
    document.getElementById('joorney-migration-current').onclick = () => choose(SOURCE.CURRENT, currentSettings);
    const input = document.getElementById('joorney-migration-file-input');
    setupDropzone(document.getElementById('joorney-migration-drop'), input, chooseFile);
    document.getElementById('joorney-migration-clear').onclick = () => {
        reset();
        // A label can't take focus: the input is only visually hidden
        input.focus();
    };
    document.getElementById('joorney-migration-run').onclick = onRun;
    document.getElementById('joorney-migration-confirm-no').onclick = () => {
        confirming = false;
        render();
        document.getElementById('joorney-migration-run').focus();
    };
    document.getElementById('joorney-migration-confirm-yes').onclick = run;
    document.getElementById('joorney-migration-download').onclick = () => downloadSettings(migrated);

    // Handed over by Import ("migrate it first")
    const handedOver = takePendingMigrationFile();
    if (handedOver) choose(SOURCE.FILE, handedOver.settings, handedOver.name);
    else render();

    try {
        const { stored } = await checkConfigurationVersion();
        // Another page was loaded meanwhile
        if (!page.isConnected) return;
        document.getElementById('joorney-migration-stored').textContent = t('migration_storedVersion', stored);
    } catch (ex) {
        Console.warn(ex);
    }
}

//#region Source
async function chooseFile(file) {
    if (running) return;
    const page = root();
    try {
        const settings = await readSettingsFile(file);
        if (!page.isConnected || running) return;
        choose(SOURCE.FILE, settings, file.name);
    } catch (ex) {
        if (!(ex instanceof SettingsFileError)) throw ex;
        if (ex.cause) Console.warn(ex.cause);
        if (!page.isConnected || running) return;
        reset();
        render({ error: t(ex.messageKey) });
    }
}

function choose(source, settings, fileName = '') {
    if (running) return;
    migrated = undefined;
    confirming = false;
    selection = { source, settings, fileName, summary: summarizeSettings(settings) };
    render();
}

function reset() {
    if (running) return;
    selection = undefined;
    migrated = undefined;
    confirming = false;
    document.getElementById('joorney-migration-file-input').value = '';
    render();
}
//#endregion

//#region Render
function render({ error = '' } = {}) {
    const summary = selection?.summary;
    const isFile = selection?.source === SOURCE.FILE;
    const expected = baseSettings.configurationVersion;
    const hasSteps = summary?.outdated;

    const current = document.getElementById('joorney-migration-current');
    current.setAttribute('aria-pressed', String(selection?.source === SOURCE.CURRENT));
    current.disabled = running;
    document.getElementById('joorney-migration-clear').disabled = running;

    document.getElementById('joorney-migration-file').hidden = !isFile;
    if (isFile) {
        document.getElementById('joorney-migration-file-name').textContent = selection.fileName;
        document.getElementById('joorney-migration-file-chips').innerHTML = summaryChipsHTML(summary);
    }

    const upToDate = document.getElementById('joorney-migration-uptodate');
    upToDate.hidden = !summary || summary.outdated || summary.newer;
    document.getElementById('joorney-migration-uptodate-text').textContent = t('migration_upToDate', expected);

    const newer = summary?.newer ? t('migration_error_newer', summary.configurationVersion) : '';
    document.getElementById('joorney-migration-error-text').textContent = error || newer;
    document.getElementById('joorney-migration-error').hidden = !(error || newer);

    document.getElementById('joorney-migration-steps-panel').hidden = !hasSteps;
    if (hasSteps) renderSteps(summary.configurationVersion, expected);
    renderRunState();
}

function renderSteps(from, to) {
    const chain = document.getElementById('joorney-migration-chain');
    // An attribute set through the DOM, not markup: no escaping needed
    chain.setAttribute('aria-label', t('migration_chainLabel', from, to));
    const nodes = [];
    for (let v = from; v <= to; v++) {
        const className = v === to ? ' is-target' : v === from ? ' is-from' : '';
        nodes.push(
            `<span class="joorney-migration-version${className}">${escapeHTML(t('migration_version', v))}</span>`
        );
        if (v < to) nodes.push('<i class="joorney-icon" data-icon="arrow_right_alt" aria-hidden="true"></i>');
    }
    chain.innerHTML = nodes.join('');

    const steps = [];
    for (let v = from; v < to; v++) {
        const textKey = STEP_DESCRIPTIONS[v]?.textKey;
        steps.push(
            `<li><span class="joorney-chip is-version">${escapeHTML(t('migration_stepLabel', v, v + 1))}</span>
            <span>${textKey ? escapeHTML(t(textKey)) : ''}</span></li>`
        );
    }
    document.getElementById('joorney-migration-steps').innerHTML = steps.join('');
}

function renderRunState() {
    const done = Boolean(migrated);
    const run = document.getElementById('joorney-migration-run');
    document.getElementById('joorney-migration-actions').hidden = done || confirming;
    document.getElementById('joorney-migration-confirm').hidden = done || !confirming;
    document.getElementById('joorney-migration-backup').hidden = done;
    document.getElementById('joorney-migration-done').hidden = !done;
    run.disabled = running;
    run.setAttribute('aria-busy', String(running));
    run.innerHTML = running
        ? `<i class="joorney-icon joorney-icon-spin" data-icon="progress_activity" aria-hidden="true"></i>
            <span>${escapeHTML(t('migration_running'))}</span>`
        : `<i class="joorney-icon" data-icon="play_arrow" aria-hidden="true"></i>
            <span>${escapeHTML(t('migration_execute'))}</span>`;
    // While running, the confirm stays visible but cannot be answered twice
    document.getElementById('joorney-migration-confirm-yes').disabled = running;
    document.getElementById('joorney-migration-confirm-no').disabled = running;
    if (done) {
        document.getElementById('joorney-migration-done-text').textContent = t(
            'migration_done',
            baseSettings.configurationVersion
        );
    }
}
//#endregion

//#region Run
function onRun() {
    if (running || !selection?.summary.outdated) return;
    // A file replaces the current settings (like Import): ask first. The current settings stay theirs.
    if (selection.source === SOURCE.FILE) {
        confirming = true;
        renderRunState();
        document.getElementById('joorney-migration-confirm-no').focus();
        return;
    }
    run();
}

async function run() {
    if (running || !selection?.summary.outdated) return;
    const page = root();
    const { settings, summary } = selection;
    running = true;
    confirming = false;
    render();

    let failure = '';
    try {
        // A copy: a failed run must not leave a half-migrated object that the next run migrates again
        const finalConfiguration = await runMigration(
            structuredClone(settings),
            summary.configurationVersion,
            baseSettings.configurationVersion
        );
        await StorageSync.set(finalConfiguration);
        // Migrators set obsolete keys to undefined, 'set' ignores them: remove them explicitly
        const obsoleteKeys = Object.keys(finalConfiguration).filter((k) => finalConfiguration[k] === undefined);
        if (obsoleteKeys.length > 0) await StorageSync.remove(obsoleteKeys);
        migrated = finalConfiguration;
    } catch (ex) {
        Console.warn(ex);
        failure = t('migration_error_failed');
    } finally {
        running = false;
    }
    // Another page was loaded meanwhile
    if (!page.isConnected) return;
    if (failure) {
        render({ error: failure });
        return;
    }

    // The settings are saved: a failure from here only concerns what the page shows
    let refreshError = '';
    try {
        // The stored version changed: refresh the menu badge and the chip of the current settings
        const { stored, outdated } = await checkConfigurationVersion();
        setMenuBadge(IMPORT_EXPORT_PAGE_ID, outdated, t('options_migrateNeeded'));
        if (!page.isConnected) return;
        document.getElementById('joorney-migration-stored').textContent = t('migration_storedVersion', stored);
    } catch (ex) {
        Console.warn(ex);
        refreshError = t('migration_error_refresh');
    }
    render({ error: refreshError });
    document.getElementById('joorney-migration-download').focus();
}

async function runMigration(configuration, fromVersion, toVersion) {
    let data = configuration;
    for (let version = fromVersion; version < toVersion; version++) {
        const migrator = await importMigratorFile(version);
        data = await migrator(data);
    }
    return data;
}
//#endregion

// Options page, reached from Import / export (not in the navbar), see options/menu.js
export const PAGE = {
    id: MIGRATION_PAGE_ID,
    tour: undefined,
    labelKey: 'options_menu_importExport',
    hidden: true,
    activeMenu: IMPORT_EXPORT_PAGE_ID,
    path: './pages/migration/index.html',
    loader: loadPage,
};
