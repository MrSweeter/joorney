import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import watchAssets from 'rollup-plugin-watch-assets';
import {
    getContentConfig,
    getDefaultPlugins,
    getESMOutput,
    getOptionPages,
    getPopupConfig,
    placeholder,
} from './scripts/rollup/common.mjs';

const defaultPlugins = getDefaultPlugins();
// Only for configs copying options assets (watch mode)
const optionsWatchAssets = watchAssets({ assets: ['options/**/*.css', 'options/**/*.html'] });

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
        getContentConfig(bundleOutput, defaultPlugins),
        getPopupConfig(bundleOutput, defaultPlugins),
        {
            input: 'options/index.js',
            output: getESMOutput(`${bundleOutput}/options/index.js`),
            plugins: [
                ...defaultPlugins,
                optionsWatchAssets,
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
        ...getOptionPages(
            bundleOutput,
            ['website', 'configuration', 'version', 'toast', 'ambient', 'technical'],
            [...defaultPlugins, optionsWatchAssets]
        ),
        {
            input: 'options/migration/index.js',
            output: getESMOutput(`${bundleOutput}/options/migration/index.js`),
            plugins: [
                ...defaultPlugins,
                optionsWatchAssets,
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
