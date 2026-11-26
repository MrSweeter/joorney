import { baseSettings, getFeaturesAndCurrentSettings } from '../configuration.js';
import { escapeHTML } from '../src/html_generator.js';
import { Runtime, StorageSync } from '../src/utils/browser.js';
import { t } from '../src/utils/i18n.js';

/**
 * Settings file helpers (More > Import, export and migrate, options/pages/importexport and migration).
 */

// Ids here, not in the pages: they link to each other and a page module must not import another one
export const IMPORT_EXPORT_PAGE_ID = 'page-importexport';
export const MIGRATION_PAGE_ID = 'page-migration';

// i18n keys of the errors (the *Key names let scripts/i18n_check.js see them)
const FILE_ERRORS = {
    readKey: 'optionsImportExport_error_read',
    jsonKey: 'optionsImportExport_error_json',
    notSettingsKey: 'optionsImportExport_error_notSettings',
    versionKey: 'optionsImportExport_error_version',
    shapeKey: 'optionsImportExport_error_shape',
};

// Settings read as { key: { ... } } by the extension (src/utils/authorize.js, technical page): any other value
// there would throw on every Odoo page once imported
const NESTED_OBJECT_KEYS = ['originsFilterOrigins', 'windowActionFallbacks'];

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export class SettingsFileError extends Error {
    constructor(messageKey, cause = undefined) {
        super(messageKey, { cause });
        this.name = 'SettingsFileError';
        this.messageKey = messageKey;
    }
}

export function getExportFileName(date = new Date()) {
    const version = Runtime.getManifest().version.replaceAll('.', '-');
    return `joorney_storage_sync_${version}_${date.toLocaleDateString()}.json`;
}

export async function exportOptions() {
    const { currentSettings } = await getFeaturesAndCurrentSettings();
    downloadSettings(currentSettings);
}

export function downloadSettings(settings) {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(settings))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', getExportFileName());
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export async function readSettingsFile(file) {
    let content;
    try {
        content = await file.text();
    } catch (ex) {
        throw new SettingsFileError(FILE_ERRORS.readKey, ex);
    }
    let settings;
    try {
        settings = JSON.parse(content);
    } catch (ex) {
        throw new SettingsFileError(FILE_ERRORS.jsonKey, ex);
    }
    if (!isPlainObject(settings) || Object.keys(settings).length === 0)
        throw new SettingsFileError(FILE_ERRORS.notSettingsKey);
    // Missing means version 0, but anything else than a whole number would be read as up to date or newer
    const version = settings.configurationVersion;
    if (version !== undefined && !(Number.isInteger(version) && version >= 0))
        throw new SettingsFileError(FILE_ERRORS.versionKey);
    // Same shape in every configuration version (options/migration/migrator)
    for (const key of NESTED_OBJECT_KEYS) {
        const value = settings[key];
        if (value === undefined) continue;
        if (!isPlainObject(value) || !Object.values(value).every(isPlainObject))
            throw new SettingsFileError(FILE_ERRORS.shapeKey);
    }
    return settings;
}

export function summarizeSettings(settings) {
    // Files exported before configurationVersion existed are version 0 (see options/migration)
    const configurationVersion = settings.configurationVersion ?? 0;
    return {
        configurationVersion,
        features: Object.keys(settings).filter((k) => k.endsWith('Enabled')).length,
        hosts: Object.keys(settings.originsFilterOrigins ?? {}).length,
        outdated: configurationVersion < baseSettings.configurationVersion,
        newer: configurationVersion > baseSettings.configurationVersion,
    };
}

// A file chosen on Import, handed to the migration page once (in memory: a reload starts empty)
let pendingMigrationFile;

export function setPendingMigrationFile(file) {
    pendingMigrationFile = file;
}

export function takePendingMigrationFile() {
    const file = pendingMigrationFile;
    pendingMigrationFile = undefined;
    return file;
}

export function summaryChipsHTML(summary) {
    return [
        t('optionsImportExport_summaryVersion', summary.configurationVersion),
        t('optionsImportExport_summaryFeatures', summary.features),
        t('optionsImportExport_summaryHosts', summary.hosts),
    ]
        .map((text) => `<span class="joorney-chip">${escapeHTML(text)}</span>`)
        .join('');
}

export async function importOptions(settings) {
    await StorageSync.set(settings);
}

export async function checkConfigurationVersion() {
    const { configurationVersion } = await StorageSync.get({
        configurationVersion: baseSettings.configurationVersion,
    });
    const expected = baseSettings.configurationVersion;
    return { stored: configurationVersion, expected, outdated: configurationVersion < expected };
}
