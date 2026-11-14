import path from 'node:path';
import { fileURLToPath } from 'node:url';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import { SUPPORTED_VERSION } from '../../src/utils/constant.js';
import featureRegistry from './feature_registry.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const isProd = () => process.env.NODE_ENV === 'production';

export function getDefaultPlugins() {
    return [featureRegistry({ rootDir: ROOT_DIR }), resolve(), json()];
}

export function getESMOutput(file) {
    return { file: file, format: 'esm', inlineDynamicImports: true };
}

export function getOptionPages(bundleOutput, pages, plugins) {
    return pages.map((page) => {
        return {
            input: `options/pages/${page}/index.js`,
            output: getESMOutput(`${bundleOutput}/options/pages/${page}/index.js`),
            plugins: [
                ...plugins,
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

export function placeholder(strArg) {
    const placeholders = {
        BUILD: () => getBuildDate(),
        MINIMAL_ODOO_VERSION: () => getMinimalOdooVersionSupported(),
        EXT_NAME: () => (isProd() ? 'Joorney' : 'Joorney (development)'),
        ENV_SUFFIX: () => (isProd() ? '' : '-dev'),
    };
    let result = strArg;
    for (const [placeholder, getDataFct] of Object.entries(placeholders)) {
        result = result.replaceAll(`%${placeholder}%`, getDataFct());
    }
    return result;
}

/**
 * Content script bundle.
 * @param {string} output bundle folder
 * @param {object[]} plugins
 */
export function getContentConfig(output, plugins) {
    return {
        input: 'content/index.js',
        output: {
            file: `${output}/content.js`,
            format: 'iife',
            inlineDynamicImports: true,
            name: 'joorney_content',
        },
        plugins: [...plugins],
    };
}

/**
 * Popup bundle and assets.
 * @param {string} output bundle folder
 * @param {object[]} plugins
 */
export function getPopupConfig(output, plugins) {
    const targets = [
        { src: ['popup/index.html', 'popup/index.css'], dest: `${output}/popup` },
        { src: 'popup/css/*', dest: `${output}/popup/css` },
    ];
    return {
        input: 'popup/index.js',
        output: getESMOutput(`${output}/popup/index.js`),
        plugins: [...plugins, copy({ targets: targets })],
    };
}
