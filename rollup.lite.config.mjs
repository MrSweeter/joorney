/**
 * Lite feature build: a minimal extension with only the selected feature(s).
 *
 * Usage: FEATURE=assignMeTask npm run build:lite (comma-separated ids for several features)
 * Output: bundle-lite/<features>/
 *
 * The background (lite/background.js) and options (lite/options) are trimmed versions of the full ones,
 * content script and popup are shared with the full build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import watchAssets from 'rollup-plugin-watch-assets';
import {
    getContentConfig,
    getDefaultPlugins,
    getESMOutput,
    getPopupConfig,
    isProd,
    placeholder,
    ROOT_DIR,
} from './scripts/rollup/common.mjs';
import { readFeatureState } from './scripts/rollup/feature_registry.js';
import { getLiteDocumentTargets } from './scripts/rollup/lite_assets.js';
import { getLiteBuildName, LITE_BUILD_OUTPUT, parseFeatureIDs } from './scripts/rollup/lite_build.js';

// Features relying on the full background (context menu, background trigger, runbot, ambient scheduling)
const UNSUPPORTED_FEATURES = {
    ambient: 'ambient events are computed by the full background',
};
// Permissions of manifest.json a lite build never needs (no context menu, chrome.cookies only used by themeSwitch)
const DROPPED_PERMISSIONS = ['contextMenus', 'cookies'];

// Same pages as lite/options/index.js, Preferences only shows the option customizations of the build features
function getOptionPages(configurations) {
    const pages = ['website', 'version', 'toast'];
    if (configurations.some((c) => c.customization.option)) pages.push('configuration');
    return pages;
}

function getUnsupportedReason(configuration, featureState) {
    if (featureState[configuration.id] === false) return 'disabled in features_state.json';
    if (UNSUPPORTED_FEATURES[configuration.id]) return UNSUPPORTED_FEATURES[configuration.id];
    if (configuration.limited) return 'limited (runbot) features need the full background';
    if (configuration.trigger.background) return 'background trigger is not supported yet';
    if (configuration.trigger.context) return 'context menu trigger is not supported yet';
    return undefined;
}

async function loadFeatureConfigurations(featureIDs) {
    const featuresDir = path.join(ROOT_DIR, 'src', 'features');
    const availableIDs = fs
        .readdirSync(featuresDir)
        .filter((f) => fs.existsSync(path.join(featuresDir, f, 'configuration.js')));
    const configurations = await Promise.all(
        availableIDs.map((f) =>
            import(pathToFileURL(path.join(featuresDir, f, 'configuration.js'))).then((m) => m.default)
        )
    );
    const featureState = readFeatureState(ROOT_DIR);

    const supported = configurations.filter((c) => !getUnsupportedReason(c, featureState)).map((c) => c.id);
    const usage = `Usage: FEATURE=<id>[,<id>...] npm run build:lite\nSupported features: ${supported.join(', ')}`;

    if (featureIDs.length === 0) throw new Error(`No feature selected.\n${usage}`);
    const errors = featureIDs.map((featureID) => {
        const configuration = configurations.find((c) => c.id === featureID);
        if (!configuration) return `'${featureID}': unknown feature`;
        const reason = getUnsupportedReason(configuration, featureState);
        return reason ? `'${featureID}': ${reason}` : undefined;
    });
    if (errors.some(Boolean)) throw new Error(`${errors.filter(Boolean).join('\n')}\n${usage}`);

    return featureIDs.map((featureID) => configurations.find((c) => c.id === featureID));
}

function buildManifest(contents, configurations, buildName) {
    const manifest = JSON.parse(placeholder(contents.toString()));
    const displayNames = configurations.map((c) => c.display_name).join(', ');

    manifest.name = `Joorney · ${displayNames}${isProd() ? '' : ' (development)'}`;
    manifest.action.default_title = manifest.name;
    manifest.version_name = `${manifest.version_name}-${buildName}`;
    manifest.description = `Lite Joorney build with only: ${displayNames}.`;

    // No keyboard shortcut nor omnibox, JSON.stringify drops undefined keys
    manifest.commands = undefined;
    manifest.omnibox = undefined;
    const needWebRequest = configurations.some((c) => c.trigger.onrequest?.length > 0);
    manifest.permissions = manifest.permissions.filter(
        (p) => !DROPPED_PERMISSIONS.includes(p) && (p !== 'webRequest' || needWebRequest)
    );

    return JSON.stringify(manifest, null, 4);
}

export default async () => {
    const featureIDs = parseFeatureIDs(process.env.FEATURE);
    const configurations = await loadFeatureConfigurations(featureIDs);
    const buildName = getLiteBuildName(featureIDs);
    const output = `${LITE_BUILD_OUTPUT}/${buildName}`;

    const plugins = getDefaultPlugins(featureIDs);

    return defineConfig([
        {
            input: 'lite/background.js',
            output: getESMOutput(`${output}/background.js`),
            plugins: [
                ...plugins,
                copy({
                    targets: [
                        {
                            src: 'manifest.json',
                            dest: output,
                            transform: (contents, _) => buildManifest(contents, configurations, buildName),
                        },
                        { src: 'images', dest: output },
                    ],
                }),
            ],
        },
        getContentConfig(output, plugins),
        // Only the popup markup and stylesheets of the build features
        getPopupConfig(
            output,
            plugins,
            getLiteDocumentTargets(ROOT_DIR, output, featureIDs, [
                { src: 'popup/index.html', dest: 'popup', base: 'popup' },
            ])
        ),
        {
            input: 'lite/options/index.js',
            output: getESMOutput(`${output}/options/index.js`),
            plugins: [
                ...plugins,
                watchAssets({ assets: ['lite/options/*.html', 'options/**/*.css', 'options/pages/**/*.html'] }),
                copy({
                    targets: getLiteDocumentTargets(ROOT_DIR, output, featureIDs, [
                        { src: 'lite/options/index.html', dest: 'options', base: 'options' },
                        // Pages are injected in options/index.html, their links are relative to it
                        ...getOptionPages(configurations).map((page) => ({
                            src: `options/pages/${page}/index.html`,
                            dest: `options/pages/${page}`,
                            base: 'options',
                        })),
                    ]),
                }),
            ],
        },
    ]);
};
