import { Console } from '../../../src/utils/browser.js';
import { t } from '../../../src/utils/i18n.js';
import {
    checkConfigurationVersion,
    exportOptions,
    getExportFileName,
    IMPORT_EXPORT_PAGE_ID,
    importOptions,
    MIGRATION_PAGE_ID,
    readSettingsFile,
    SettingsFileError,
    setPendingMigrationFile,
    summarizeSettings,
    summaryChipsHTML,
} from '../../import_export.js';
import { routeURL } from '../../src/layout.js';
import { setupDropzone } from '../../src/ui/dropzone.js';

const PAGE_ID = IMPORT_EXPORT_PAGE_ID;
let pendingSettings;
let pendingFileName = '';

export async function loadPage(_features, _currentSettings, params = {}) {
    pendingSettings = undefined;
    for (const link of document.querySelectorAll('[data-migration-link]')) link.href = routeURL(MIGRATION_PAGE_ID);
    loadExport();
    loadImport(params.imported === '1');
    await loadMigrate();
}

//#region Export
function loadExport() {
    document.getElementById('joorney-export-file-name').textContent = getExportFileName();
    const status = document.getElementById('joorney-export-status');
    document.getElementById('joorney_export_storage_sync').onclick = async () => {
        await exportOptions();
        status.textContent = t('optionsImportExport_exported');
    };
}
//#endregion

//#region Import
function loadImport(imported) {
    const input = document.getElementById('joorney_import_storage_sync_file');
    setupDropzone(document.getElementById('joorney-import-drop'), input, chooseFile);

    document.getElementById('joorney-import-clear').onclick = () => {
        clearFile();
        // A label can't take focus: the input is only visually hidden
        input.focus();
    };
    document.getElementById('joorney-import-migrate-link').onclick = () => {
        // Hand the chosen file over: the migration page starts with it selected
        if (pendingSettings) setPendingMigrationFile({ name: pendingFileName, settings: pendingSettings });
    };
    document.getElementById('joorney_import_storage_sync').onclick = () => askConfirmation(true);
    document.getElementById('joorney-import-confirm-no').onclick = () => askConfirmation(false);
    document.getElementById('joorney-import-confirm-yes').onclick = confirmImport;

    if (imported) {
        document.getElementById('joorney-import-done').hidden = false;
        // The flag is for this load only: a reload must not announce the import again
        window.history.replaceState(window.history.state, '', routeURL(PAGE_ID));
    }
}

async function chooseFile(file) {
    clearFile();
    document.getElementById('joorney-import-done').hidden = true;
    try {
        const settings = await readSettingsFile(file);
        pendingSettings = settings;
        pendingFileName = file.name;
        renderFile(file.name, summarizeSettings(settings));
    } catch (ex) {
        if (!(ex instanceof SettingsFileError)) throw ex;
        if (ex.cause) Console.warn(ex.cause);
        showImportError(t(ex.messageKey));
    }
}

function renderFile(fileName, summary) {
    document.getElementById('joorney-import-file-name').textContent = fileName;
    document.getElementById('joorney-import-summary').innerHTML = summaryChipsHTML(summary);
    document.getElementById('joorney-import-outdated').hidden = !summary.outdated;
    document.getElementById('joorney-import-newer').hidden = !summary.newer;
    document.getElementById('joorney-import-file').hidden = false;
}

function clearFile() {
    pendingSettings = undefined;
    document.getElementById('joorney_import_storage_sync_file').value = '';
    document.getElementById('joorney-import-file').hidden = true;
    showImportError('');
    askConfirmation(false, false);
}

function showImportError(message) {
    document.getElementById('joorney-import-error-text').textContent = message;
    document.getElementById('joorney-import-error').hidden = !message;
}

function askConfirmation(ask, moveFocus = true) {
    const importButton = document.getElementById('joorney_import_storage_sync');
    document.getElementById('joorney-import-confirm').hidden = !ask;
    importButton.hidden = ask;
    if (!moveFocus) return;
    if (ask) document.getElementById('joorney-import-confirm-no').focus();
    else importButton.focus();
}

async function confirmImport() {
    if (!pendingSettings) return;
    const confirmButton = document.getElementById('joorney-import-confirm-yes');
    confirmButton.disabled = true;
    try {
        await importOptions(pendingSettings);
    } catch (ex) {
        // e.g. sync storage quota (item or total size): stay on the page so the user can pick another file
        Console.error(ex);
        confirmButton.disabled = false;
        showImportError(t('optionsImportExport_error_write'));
        askConfirmation(false);
        return;
    }
    // Reload: every page, the menus and the language follow the imported settings
    window.location.assign(routeURL(PAGE_ID, { imported: '1' }));
}
//#endregion

//#region Migrate
async function loadMigrate() {
    const { stored, expected, outdated } = await checkConfigurationVersion();
    document.getElementById('joorney-migrate-outdated-text').textContent = t(
        'optionsImportExport_migrateOutdated',
        stored,
        expected
    );
    document.getElementById('joorney-migrate-uptodate-text').textContent = t(
        'optionsImportExport_migrateUpToDate',
        expected
    );
    document.getElementById('joorney-migrate-outdated').hidden = !outdated;
    document.getElementById('joorney-migrate-open').hidden = !outdated;
    document.getElementById('joorney-migrate-file').hidden = outdated;
    document.getElementById('joorney-migrate-uptodate').hidden = outdated;
    document.getElementById('joorney-migrate-panel').classList.toggle('is-highlighted', outdated);
}
//#endregion

// Options menu entry, see options/menu.js
export const PAGE = {
    id: PAGE_ID,
    tour: undefined,
    labelKey: 'options_menu_importExport',
    path: './pages/importexport/index.html',
    loader: loadPage,
};
