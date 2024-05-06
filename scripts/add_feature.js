import fs from 'node:fs';
import { exit, process } from 'node:process';
import { featureIDToDisplayName, featureIDToPascalCase } from '../src/utils/features.js';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('No name provided');
    exit(-1);
}

const featureID = args[0];
const featureName = featureIDToDisplayName(featureID);
const featurePascalCase = featureIDToPascalCase(featureID);

const featureSrc = `${__dirname}/../src/features/${featureID}`;
if (fs.existsSync(featureSrc)) {
    console.error('Feature already exist');
    exit(-1);
}
fs.mkdirSync(featureSrc);

createFeature();

function createFeature() {
    const content = {
        id: featureID,
        display_name: featureName,
        icon: ["<i class='fa-regular fa-circle-question'></i>"],
        trigger: {
            content: {
                load: args.includes('cload'),
                navigate: args.includes('cnav'),
            },
            options: args.includes('option'),
            popup: args.includes('popup'),
            background: args.includes('bg'),
        },
        defaultSettings: {
            [`${featureID}Enabled`]: false,
            [`${featureID}WhitelistMode`]: false,
        },
    };

    fs.writeFileSync(`${featureSrc}/configuration.js`, JSON.stringify(content, null, 4));

    if (content.trigger.background) createTemplate('background');
    if (content.trigger.content.load || content.trigger.content.navigate) createTemplate('content');
    if (content.trigger.options) createTemplate('option');
    if (content.trigger.popup) createTemplate('popup');
}

function createTemplate(template) {
    const templatePascalCase = template.charAt(0).toUpperCase() + template.slice(1);
    const templateContent = fs
        .readFileSync(`${__dirname}/template/${template}.js`, 'utf8')
        .replace('FEATURE_CLASS_NAME', `${featurePascalCase}${templatePascalCase}Feature`);
    fs.writeFileSync(`${featureSrc}/${template}.js`, templateContent);
}
