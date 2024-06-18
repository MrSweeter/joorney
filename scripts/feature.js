const doc = `
Usage:
	feature.js create <name> [<supported-version>... -b -l -n -c -o -p --overwrite]
	feature.js update <name> [-b -l -n -o -p --overwrite]
	feature.js delete <name>
|
Options:
    name                                Feature name ([a-zA-Z_\\s]+)
    supported-version                   Supported versions for this feature
    -b --with-trigger-background        Create background file to run the feature as a background script
    -l --with-trigger-load              Create content file to run the feature on page load
    -n --with-trigger-navigate          Create content file to run the feature on page navigation
    -c --with-trigger-context           Setup context menu values
    -o --with-customization-option      Create custom option file to allow customizable option in options page
    -p --with-customization-popup       Create custom popup file to allow customizable option in popup extension
    --overwrite                         Delete feature if already exist
`;

import docoptImport from '@eyalsh/docopt';
const docopt = docoptImport.default;

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateFolder = `${__dirname}/file_template`;

String.prototype.capitalize = function () {
    return `${this.charAt(0).toUpperCase()}${this.slice(1)}`;
};

String.prototype.uncapitalize = function () {
    return `${this.charAt(0).toLowerCase()}${this.slice(1)}`;
};

Object.prototype.cleanStringify = function () {
    return JSON.stringify(this, null, 4).replace(/"([^"]+)":/g, '$1:');
};

try {
    const option = docopt(doc);

    const featureName = sanitizeName(option['<name>']);

    if (option.create) {
        createFeature(featureName, option);
        updateFeatureState(featureName.id, true);
    }
    if (option.update) {
        const hasChange = updateFeature(featureName, option);
        if (hasChange) console.info(`Don't forget to update the configuration file for ${featureName.id}`);
    }
    if (option.delete) {
        deleteFeature(featureName);
        updateFeatureState(featureName.id, false);
    }
} catch (e) {
    console.error(e.message);
}

function updateFeatureState(featureID, add) {
    const stateFile = `${__dirname}/../features_state.json`;
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (featureID in state && add) {
        console.warn(`Feature '${featureID}' already added, current state: ${state[featureID]}`);
        return;
    }
    state[featureID] = add ? true : undefined;
    fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 4)}\n`, 'utf8');
}

//#region CRUD
function createFeature(featureName, option) {
    const overwriteFileSystem = option['--overwrite'];

    const configuration = {
        id: featureName.id,
        display_name: featureName.display,
        icon: ['<i class="fa-regular fa-circle-question"></i>'],
        trigger: {
            background: option['--with-trigger-background'] === 1,
            load: option['--with-trigger-load'] === 1,
            navigate: option['--with-trigger-navigate'] === 1,
            context: option['--with-trigger-context'] === 1,
        },
        customization: {
            option: option['--with-customization-option'] === 1,
            popup: option['--with-customization-popup'] === 1,
        },
        defaultSettings: {
            [`${featureName.id}Enabled`]: false,
            [`${featureName.id}WhitelistMode`]: false,
        },
        supported_version: option['<supported-version>'] ?? [],
    };
    if (configuration.trigger.context) {
        configuration.defaultSettings[`${featureName.id}ContextMenu`] = {};
    }

    const featureFolder = `${__dirname}/../src/features/${configuration.id}`;
    const configurationFile = 'configuration.js';
    const configurationPath = `${featureFolder}/${configurationFile}`;
    const exist = fs.existsSync(configurationPath);
    if (exist && !overwriteFileSystem)
        throw new Error('Feature already exist, use --overwrite to recreate or use update command to add new files');
    if (exist) deleteFeature(featureName);

    createFolder(featureFolder);
    createFileWithTemplate(configuration, configurationFile, configuration.cleanStringify());

    updateFeature(featureName, option);

    createFileWithTemplate(featureName, 'option.js', '');
    if (!configuration.customization.popup) {
        createFileWithTemplate(featureName, 'popup.js', '');
    }

    return configuration;
}

function updateFeature(featureName, option) {
    let fileCreated = false;

    if (option['--with-trigger-background']) {
        fileCreated = createFileWithTemplate(featureName, 'background_trigger.js', '') || fileCreated;
        fileCreated = createFileWithTemplate(featureName, 'background.js', '') || fileCreated;
    }
    if (option['--with-trigger-load'] || option['--with-trigger-navigate']) {
        fileCreated = createFileWithTemplate(featureName, 'content.js', '') || fileCreated;
    }

    if (option['--with-customization-option']) {
        fileCreated = createFileWithTemplate(featureName, 'option_customization.js', '') || fileCreated;
    }

    if (option['--with-customization-popup']) {
        const source = `${templateFolder}/popup_customization.js`;
        const destination = `${getFeatureFolder(featureName.id)}/popup.js`;
        fileCreated = copyFile(featureName, source, destination, '') || fileCreated;
    }

    return fileCreated;
}

function deleteFeature(featureName) {
    const featureFolder = `${__dirname}/../src/features/${featureName.id}`;
    fs.rmSync(featureFolder, { recursive: true });
}
//#endregion

//#region File System
function createFolder(path) {
    if (fs.existsSync(path)) return false;
    fs.mkdirSync(path, { recursive: true });
    return true;
}

function createFileWithTemplate(featureName, fileName, raw) {
    const source = `${templateFolder}/${fileName}`;
    const destination = `${getFeatureFolder(featureName.id)}/${fileName}`;
    return copyFile(featureName, source, destination, raw);
}

function copyFile(featureName, source, destination, raw) {
    const templateContent = fs.readFileSync(source, 'utf8');
    let content = templateContent;
    content = content.replaceAll('FILE_CONTENT', raw);
    content = content.replaceAll('FEATURE_CLASS_NAME', featureName.id.capitalize());

    return createFile(destination, content);
}

function createFile(path, content) {
    if (fs.existsSync(path)) {
        console.warn(`Feature file '${path}' already exist`);
        return false;
    }
    fs.writeFileSync(path, content, 'utf8');
    return true;
}

function getFeatureFolder(featureID) {
    return `${__dirname}/../src/features/${featureID}`;
}
//#endregion

function sanitizeName(name) {
    const regexName = /^[a-zA-Z_\s]+$/;
    if (!regexName.test(name)) throw new Error('Invalid name format, need to respect [a-zA-Z_\\s]+');

    const nameUnder = name
        .replaceAll(/([A-Z])/g, '_$1')
        .replaceAll('_', ' ')
        .replaceAll(/\s+/g, ' ');
    const nameLower = nameUnder.toLowerCase().trim();
    const namePart = nameLower.split(/\s/);

    const nameDisplay = namePart.map((p) => p.capitalize()).join(' ');
    const nameID = nameDisplay.replaceAll(/\s/g, '').uncapitalize();

    return { display: nameDisplay, id: nameID };
}
