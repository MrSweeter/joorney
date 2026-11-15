import fs from 'node:fs';
import path from 'node:path';

const FEATURE_REGISTRY_ID = 'virtual:joorney-features';

// Optional files of a feature folder, see configuration.js importFeature*File
const FEATURE_FILES = [
    'configuration',
    'content',
    'background_trigger',
    'background',
    'option',
    'option_customization',
    'popup',
];

function getFeatureStatePath(rootDir) {
    return path.join(rootDir, 'features_state.json');
}

export function readFeatureState(rootDir) {
    return JSON.parse(fs.readFileSync(getFeatureStatePath(rootDir), 'utf-8'));
}

function getActiveFeatureIDs(featureState) {
    return Object.keys(featureState).filter((k) => !k.startsWith('__') && featureState[k]);
}

/**
 * Generate the 'virtual:joorney-features/*' modules:
 * - 'virtual:joorney-features/state': the content of features_state.json, or the given features when featureIDs is set
 * - 'virtual:joorney-features/<file>': a static import per feature having this file (content, popup...)
 * Static imports, not a template-literal import: Rollup cannot resolve `./${featureID}/x.js` by itself, the files
 * would be missing from the bundle, and a glob plugin (dynamic-import-vars) would bundle every feature folder,
 * disabled ones included. Migrators follow the same rule with a static map (MIGRATORS in configuration.js).
 * One module per file type, so an entry not using a type (popup in content.js) tree-shakes it.
 * @param {object} options
 * @param {string} options.rootDir repository root
 * @param {string[]} [options.featureIDs] features to bundle, default to the active ones of features_state.json
 */
export default function featureRegistry({ rootDir, featureIDs = undefined }) {
    const featuresDir = path.join(rootDir, 'src', 'features');

    function getFeatureState(ctx) {
        if (featureIDs) return Object.fromEntries(featureIDs.map((f) => [f, true]));
        ctx.addWatchFile(getFeatureStatePath(rootDir));
        return readFeatureState(rootDir);
    }

    return {
        name: 'joorney-feature-registry',
        resolveId(id) {
            return id.startsWith(`${FEATURE_REGISTRY_ID}/`) ? `\0${id}` : null;
        },
        load(id) {
            if (!id.startsWith(`\0${FEATURE_REGISTRY_ID}/`)) return null;
            const type = id.slice(`\0${FEATURE_REGISTRY_ID}/`.length);
            const featureState = getFeatureState(this);

            if (type === 'state') return `export default ${JSON.stringify(featureState)};`;
            if (!FEATURE_FILES.includes(type)) this.error(`Unknown feature file type '${type}'`);

            const loaders = getActiveFeatureIDs(featureState)
                .map((featureID) => {
                    const filePath = path.join(featuresDir, featureID, `${type}.js`);
                    if (!fs.existsSync(filePath)) return undefined;
                    return `    ${featureID}: () => import(${JSON.stringify(filePath)}),`;
                })
                .filter(Boolean);
            return `export default {\n${loaders.join('\n')}\n};`;
        },
    };
}
