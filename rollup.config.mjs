import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import watchAssets from 'rollup-plugin-watch-assets';
import { SUPPORTED_VERSION } from './src/utils/constant.js';

const defaultPlugins = [
    resolve(),
    json(),
    dynamicImportVars({ exclude: ['features_state.json', '**/*.scss'] }),
    watchAssets({ assets: ['options/**/*.css', 'options/**/*.html'] }),
];
function getESMOutput(file) {
    return { file: file, format: 'esm', inlineDynamicImports: true };
}

function getOptionPages(bundleOutput, pages) {
    return pages.map((page) => {
        return {
            input: `options/pages/${page}/index.js`,
            output: getESMOutput(`${bundleOutput}/options/pages/${page}/index.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: [`options/pages/${page}/index.html`],
                            dest: `${bundleOutput}/options/pages/${page}`,
                        },
                    ],
                }),
            ],
        };
    });
}

function getBuildDate() {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 0);
    const currentYear = now.getFullYear().toString().slice(-2);
    const currentDayOfYear = Math.floor((now - yearStart) / (24 * 60 * 60 * 1000))
        .toString()
        .padStart(3, '0');

    return currentYear + currentDayOfYear;
}

function getMinimalOdooVersionSupported() {
    return Number.parseInt(SUPPORTED_VERSION[0]);
}

function placeholder(strArg) {
    const isProd = process.env.NODE_ENV === 'production';
    const placeholders = {
        BUILD: () => getBuildDate(),
        MINIMAL_ODOO_VERSION: () => getMinimalOdooVersionSupported(),
        EXT_NAME: () => (isProd ? 'Joorney' : 'Joorney (development)'),
        ENV_SUFFIX: () => (isProd ? '' : '-dev'),
    };
    let result = strArg;
    for (const [placeholder, getDataFct] of Object.entries(placeholders)) {
        result = result.replaceAll(`%${placeholder}%`, getDataFct());
    }
    return result;
}

export default () => {
    const bundleOutput = 'bundle';
    const publicOutput = 'docs';

    return defineConfig([
        {
            input: 'background/index.js',
            output: getESMOutput(`${bundleOutput}/background.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: 'manifest.json',
                            dest: bundleOutput,
                            transform: (contents, _) => placeholder(contents.toString()),
                        },
                    ],
                }),
                copy({ targets: [{ src: 'images', dest: bundleOutput }] }),
            ],
        },
        {
            input: 'content/index.js',
            output: {
                file: `${bundleOutput}/content.js`,
                format: 'iife',
                inlineDynamicImports: true,
                name: 'joorney_content',
            },
            plugins: [...defaultPlugins],
        },
        {
            input: 'popup/index.js',
            output: getESMOutput(`${bundleOutput}/popup/index.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: ['popup/index.html', 'popup/index.css'],
                            dest: `${bundleOutput}/popup`,
                        },
                    ],
                }),
                copy({ targets: [{ src: 'popup/css/*', dest: `${bundleOutput}/popup/css` }] }),
            ],
        },
        {
            input: 'options/index.js',
            output: getESMOutput(`${bundleOutput}/options/index.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: ['options/index.html', 'options/index.css', 'options/checklist.css'],
                            dest: `${bundleOutput}/options`,
                        },
                    ],
                }),

                copy({ targets: [{ src: 'options/css/*', dest: `${bundleOutput}/options/css` }] }),
            ],
        },
        ...getOptionPages(bundleOutput, ['website', 'configuration', 'version', 'toast', 'ambient', 'technical']),
        {
            input: 'options/migration/index.js',
            output: getESMOutput(`${bundleOutput}/options/migration/index.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: ['options/migration/index.html', 'options/migration/index.css'],
                            dest: `${bundleOutput}/options/migration`,
                        },
                    ],
                }),
            ],
        },
        {
            input: 'gh-page/index.js',
            output: getESMOutput(`${publicOutput}/index.js`),
            plugins: [
                ...defaultPlugins,
                terser(),
                copy({
                    targets: [
                        {
                            src: ['gh-page/public/*'],
                            dest: `${publicOutput}`,
                        },
                    ],
                }),
                watchAssets({ assets: ['gh-page/**/*.css', 'gh-page/**/*.html'] }),
            ],
        },
        {
            input: 'gh-page/feature.js',
            output: getESMOutput(`${publicOutput}/feature.js`),
            plugins: [...defaultPlugins, terser()],
        },
    ]);
};
