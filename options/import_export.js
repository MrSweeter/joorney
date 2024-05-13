import { baseSettings, getFeaturesAndCurrentSettings } from '../configuration.js';
import { StorageSync, Tabs } from '../src/utils/browser.js';

function importOptions(file) {
    const reader = new FileReader();
    reader.onload = async (eventRead) => {
        const resJson = JSON.parse(eventRead.target.result);
        await StorageSync.set(resJson);
        const tabs = await Tabs.query({ active: true, lastFocusedWindow: true });
        Tabs.reload(tabs[0].id);
    };
    reader.readAsText(file);
}

async function exportOptions() {
    const { currentSettings } = await getFeaturesAndCurrentSettings();

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(currentSettings))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    const fileName = `qol_storage_sync_${new Date().toLocaleDateString()}.json`;
    downloadAnchorNode.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function confirmImport(file) {
    if (file && confirm('Do you confirm file upload?')) {
        importOptions(file);
    }
}

function setupImportExport() {
    const importInput = document.getElementById('qol_import_storage_sync_file');
    importInput.onchange = (e) => confirmImport(e.target.files[0]);

    const importButton = document.getElementById('qol_import_storage_sync');
    importButton.onclick = () => {
        if (!importInput.value.length) {
            importInput.click();
            return;
        }

        confirmImport(importInput.files[0]);
    };

    const exportButton = document.getElementById('qol_export_storage_sync');
    exportButton.onclick = () => exportOptions();
}

async function checkConfigurationVersion() {
    const { configurationVersion } = await StorageSync.get({
        configurationVersion: baseSettings.configurationVersion,
    });
    if (configurationVersion < baseSettings.configurationVersion) {
        document.getElementById('qol_migrate_configuration').classList.remove('d-none');
        document.getElementById('qol_import_storage_sync_file').disabled = true;
        document.getElementById('qol_import_storage_sync').disabled = true;
    }
}

export function initImportExport() {
    setupImportExport();
    checkConfigurationVersion();
}
