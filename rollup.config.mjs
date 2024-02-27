import resolve from '@rollup/plugin-node-resolve';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';

const defaultPlugins = [resolve(), json(), dynamicImportVars({ exclude: 'features_state.json' })];
function getESMOutput(file) {
    return { file: file, format: 'esm', inlineDynamicImports: true };
}

export default () => {
    const dist = `dist`;

    return defineConfig([
        {
            input: 'background/index.js',
            output: getESMOutput(`${dist}/background.js`),
            plugins: [
                ...defaultPlugins,
                copy({ targets: [{ src: 'manifest.json', dest: dist }] }),
                copy({ targets: [{ src: 'images', dest: dist }] }),
            ],
        },
        {
            input: 'content/index.js',
            output: { file: `${dist}/content.js`, format: 'iife', inlineDynamicImports: true },
            plugins: [...defaultPlugins],
        },
        {
            input: 'popup/index.js',
            output: getESMOutput(`${dist}/popup/index.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: ['popup/index.html', 'popup/index.css'],
                            dest: `${dist}/popup`,
                        },
                    ],
                }),
                copy({ targets: [{ src: 'popup/css/*', dest: `${dist}/popup/css` }] }),
            ],
        },
        {
            input: 'options/index.js',
            output: getESMOutput(`${dist}/options/index.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: ['options/index.html', 'options/index.css'],
                            dest: `${dist}/options`,
                        },
                    ],
                }),

                copy({ targets: [{ src: 'options/css/*', dest: `${dist}/options/css` }] }),
            ],
        },
        {
            input: 'options/configuration.js',
            output: getESMOutput(`${dist}/options/configuration.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: ['options/configuration.html', 'options/configuration.css'],
                            dest: `${dist}/options`,
                        },
                    ],
                }),
            ],
        },
        {
            input: 'options/migration/index.js',
            output: getESMOutput(`${dist}/options/migration/index.js`),
            plugins: [
                ...defaultPlugins,
                copy({
                    targets: [
                        {
                            src: ['options/migration/index.html', 'options/migration/index.css'],
                            dest: `${dist}/options/migration`,
                        },
                    ],
                }),
            ],
        },
    ]);
};
