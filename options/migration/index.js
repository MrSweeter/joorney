import { baseSettings, getFeaturesAndCurrentSettings, importMigratorFile } from '../../configuration.js';
import { StorageSync } from '../../src/utils/browser.js';

function setupInput() {
    const importInput = document.getElementById('joorney_import_storage_sync_file');
    importInput.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = async (eventRead) => {
            const resJson = JSON.parse(eventRead.target.result);
            analyzeConfiguration(resJson);
        };
        reader.readAsText(e.target.files[0]);
    };

    const migrateCurrent = document.getElementById('migrate_current');
    migrateCurrent.onclick = async () => {
        const { currentSettings } = await getFeaturesAndCurrentSettings();
        analyzeConfiguration(currentSettings);
    };
}

function analyzeConfiguration(jsonFile) {
    const migrateVersion = jsonFile.configurationVersion ?? 0;
    const currentVersion = baseSettings.configurationVersion;

    const resume = document.getElementById('migration_resume');

    if (migrateVersion > currentVersion) {
        document.getElementById('error_message').innerHTML = 'Configuration cannot be migrate to a lower version';
        if (!resume.classList.contains('d-none')) resume.classList.add('d-none');
        return;
    }
    if (migrateVersion === currentVersion) {
        document.getElementById('error_message').innerHTML = 'Configuration cannot be migrate to the same version';
        if (!resume.classList.contains('d-none')) resume.classList.add('d-none');
        return;
    }
    document.getElementById('error_message').innerHTML = '';

    let migrateListString = `<h3><span class="badge badge-success py-1 px-3">${migrateVersion}</span></h3><i class="fa-solid fa-arrow-right-long mx-3"></i>`;
    for (let i = migrateVersion; i < currentVersion - 1; i++) {
        migrateListString += `<h3><span class="badge badge-info py-1 px-3">${i + 1}</span></h3>
        <i class="fa-solid fa-arrow-right-long mx-3"></i>`;
    }
    migrateListString += `<h3><span class="badge badge-success py-1 px-3">${currentVersion}</span></h3>`;
    document.getElementById('migration_list').innerHTML = migrateListString;

    const runButton = document.getElementById('run_migration');
    runButton.innerHTML = 'Execute migration';
    runButton.onclick = async (e) => {
        e.preventDefault();
        document.getElementById('joorney_import_storage_sync_file').value = null;
        const button = e.currentTarget;
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spin fa-spinner"></i>';
        const finalConfiguration = await runMigration(jsonFile, migrateVersion, currentVersion);

        await StorageSync.set(finalConfiguration);

        button.innerHTML = 'Download new configuration';
        runButton.onclick = () => {
            downloadNewMigration(finalConfiguration);
        };
        button.disabled = false;
    };

    resume.classList.remove('d-none');
}

async function runMigration(configuration, fromVersion, toVersion) {
    let data = configuration;
    for (let i = fromVersion; i < toVersion; i++) {
        data = await runOneMigration(data, i);
    }
    return data;
}

async function runOneMigration(configuration, version) {
    const migrator = await importMigratorFile(version);
    return migrator(configuration);
}

function downloadNewMigration(data) {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    const fileName = `joorney_storage_sync_${new Date().toLocaleDateString()}.json`;
    downloadAnchorNode.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

async function onDOMContentLoaded() {
    setupInput();
}

document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
