import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import watchAssets from 'rollup-plugin-watch-assets';

const defaultPlugins = [resolve(), json(), dynamicImportVars({ exclude: 'features_state.json' })];
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

export default () => {
    const bundleOutput = 'bundle/ext';
    const publicOutput = 'bundle/public';

    return defineConfig([
        {
            input: 'background/index.js',
            output: getESMOutput(`${bundleOutput}/background.js`),
            plugins: [
                ...defaultPlugins,
                copy({ targets: [{ src: 'manifest.json', dest: bundleOutput }] }),
                copy({ targets: [{ src: 'images', dest: bundleOutput }] }),
            ],
        },
        {
            input: 'content/index.js',
            output: {
                file: `${bundleOutput}/content.js`,
                format: 'iife',
                inlineDynamicImports: true,
                name: 'qol_content',
            },
            plugins: [...defaultPlugins, copy({ targets: [{ src: 'content/inject.js', dest: bundleOutput }] })],
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
                            src: ['options/index.html', 'options/index.css'],
                            dest: `${bundleOutput}/options`,
                        },
                    ],
                }),

                copy({ targets: [{ src: 'options/css/*', dest: `${bundleOutput}/options/css` }] }),
            ],
        },
        ...getOptionPages(bundleOutput, ['website', 'configuration', 'version']),
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
        // {
        //     input: 'docs/index.js',
        //     output: getESMOutput(`${publicOutput}/index.js`),
        //     plugins: [
        //         ...defaultPlugins,
        //         copy({
        //             targets: [
        //                 {
        //                     src: ['docs/public/*'],
        //                     dest: `${publicOutput}`,
        //                 },
        //             ],
        //         }),
        //     ],
        // },
        // {
        //     input: 'docs/feature.js',
        //     output: getESMOutput(`${publicOutput}/feature.js`),
        //     plugins: [...defaultPlugins],
        // },
    ]);
};
