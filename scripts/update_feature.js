import fs from 'node:fs';
import { exit } from 'node:process';
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
if (!fs.existsSync(featureSrc)) {
    console.error('Feature not exist');
    exit(-1);
}

updateFeature();

function updateFeature() {
    const configurationPath = `${featureSrc}/configuration.js`;
    const configuration = JSON.parse(fs.readFileSync(configurationPath, 'utf8'));

    configuration.trigger.content.load = args.includes('cload');
    configuration.trigger.content.navigate = args.includes('cnav');
    configuration.trigger.options = args.includes('option');
    configuration.trigger.popup = args.includes('popup');
    configuration.trigger.background = args.includes('bg');

    fs.writeFileSync(configurationPath, JSON.stringify(configuration, null, 4));

    if (configuration.trigger.background) createTemplateIfNotExist('background');
    if (configuration.trigger.content.load || configuration.trigger.content.navigate)
        createTemplateIfNotExist('content');
    if (configuration.trigger.options) createTemplateIfNotExist('option');
    if (configuration.trigger.popup) createTemplateIfNotExist('popup');
}

function createTemplateIfNotExist(template) {
    const dirPath = `${featureSrc}/${template}.js`;
    if (fs.existsSync(dirPath)) {
        console.warn(`Update cannot override: ${template}`);
        return;
    }
    const templatePascalCase = template.charAt(0).toUpperCase() + template.slice(1);
    const templateContent = fs
        .readFileSync(`${__dirname}/template/${template}.js`, 'utf8')
        .replace('FEATURE_CLASS_NAME', `${featurePascalCase}${templatePascalCase}Feature`);
    fs.writeFileSync(`${featureSrc}/${template}.js`, templateContent);
}
