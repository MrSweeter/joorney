#!/usr/bin/env node
// Download a Material Symbols font limited to the icons a project uses, to commit it: Google Fonts is contacted only
// here (dev time), never at runtime.
// Generic: copy this file as is into any project (Node 18+, ES module), the project-specific part is the JSON config.
//
// Usage: node <this script> [config.json] [--check]
//   config.json  default: icons.json next to this script
//   --check      validate the config and the icon names, download nothing (CI, pre-commit)
//
// Config, paths relative to the config file:
//   {
//       "output": "../assets/icons/icons.woff2",                  woff2 file to write (required)
//       "style": "outlined",                                       outlined (default), rounded or sharp
//       "axes": { "opsz": 24, "wght": 400, "FILL": 0, "GRAD": 0 }, these defaults; a "min..max" range keeps the axis
//                                                                  variable, e.g. "FILL": "0..1" for filled icons
//       "icons": ["add", "close"]                                  names from https://fonts.google.com/icons
//   }
//
// When you use a new icon: add its name to "icons", run the script, commit the font.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STYLES = { outlined: 'Outlined', rounded: 'Rounded', sharp: 'Sharp' };
// Supported range and default of each axis of the Material Symbols variable fonts
const AXES = {
    opsz: { min: 20, max: 48, default: 24 },
    wght: { min: 100, max: 700, default: 400 },
    FILL: { min: 0, max: 1, default: 0 },
    GRAD: { min: -25, max: 200, default: 0 },
};
// Google Fonts serves the woff2 format only to a browser user agent
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function fail(message) {
    console.error(`✗ ${message}`);
    process.exit(1);
}

async function fetchOk(url, asText = true) {
    let response;
    try {
        response = await fetch(url, { headers: { 'User-Agent': UA } });
    } catch (error) {
        fail(`${error.cause?.message ?? error.message} while fetching ${url}`);
    }
    if (!response.ok) fail(`HTTP ${response.status} while fetching ${url}`);
    return asText ? response.text() : Buffer.from(await response.arrayBuffer());
}

function parseArgs(argv) {
    const args = { config: resolve(dirname(fileURLToPath(import.meta.url)), 'icons.json'), check: false };
    for (const arg of argv) {
        if (arg === '--check') args.check = true;
        else if (arg.startsWith('--')) fail(`Unknown option ${arg}, usage: fetch-icons [config.json] [--check]`);
        else args.config = resolve(arg);
    }
    return args;
}

// "0..1" → [0, 1], 400 → [400, 400]
function parseAxis(tag, value) {
    const axis = AXES[tag];
    if (!axis) fail(`Unknown axis "${tag}", expected one of ${Object.keys(AXES).join(', ')}`);
    const bounds = typeof value === 'number' ? [value, value] : String(value).split('..').map(Number);
    const valid = bounds.length === 2 && bounds.every((bound) => bound >= axis.min && bound <= axis.max);
    if (!valid || bounds[0] > bounds[1]) {
        fail(
            `Invalid ${tag} value ${JSON.stringify(value)}, expected a number or "min..max" in ${axis.min}..${axis.max}`
        );
    }
    return bounds;
}

async function loadConfig(path) {
    let config;
    try {
        config = JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        fail(`Cannot read the config ${path}: ${error.message}`);
    }
    if (typeof config.output !== 'string' || !config.output.endsWith('.woff2')) {
        fail(`"output" must be the path of a .woff2 file (${path})`);
    }
    const style = STYLES[config.style ?? 'outlined'];
    if (!style) fail(`"style" must be one of ${Object.keys(STYLES).join(', ')} (${path})`);
    const icons = config.icons;
    if (!Array.isArray(icons) || icons.length === 0 || !icons.every((icon) => typeof icon === 'string')) {
        fail(`"icons" must be a non-empty list of icon names (${path})`);
    }
    const duplicates = icons.filter((icon, index) => icons.indexOf(icon) !== index);
    if (duplicates.length > 0) console.warn(`⚠ Duplicate icons ignored: ${[...new Set(duplicates)].join(', ')}`);
    const axes = Object.fromEntries(Object.entries(AXES).map(([tag, axis]) => [tag, [axis.default, axis.default]]));
    for (const [tag, value] of Object.entries(config.axes ?? {})) axes[tag] = parseAxis(tag, value);
    return {
        output: resolve(dirname(path), config.output),
        style,
        axes,
        // Sorted: a stable URL whatever the order in the config
        icons: [...new Set(icons)].sort(),
    };
}

// Google Fonts silently drops unknown names from the subset: check them against the official list of the font
async function checkNames({ style, icons }) {
    const codepointsUrl =
        'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/' +
        `MaterialSymbols${style}%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints`;
    const names = new Set(
        (await fetchOk(codepointsUrl))
            .split('\n')
            .map((line) => line.split(' ')[0])
            .filter(Boolean)
    );
    const unknown = icons.filter((icon) => !names.has(icon));
    if (unknown.length > 0) fail(`Unknown Material Symbols ${style} names: ${unknown.join(', ')}`);
}

function cssUrl({ style, axes, icons }) {
    // Google Fonts expects the lowercase axes first, each group in alphabetical order: opsz,wght,FILL,GRAD
    const tags = Object.keys(axes).sort((a, b) => {
        const aLower = a === a.toLowerCase();
        return aLower === (b === b.toLowerCase()) ? a.localeCompare(b) : aLower ? -1 : 1;
    });
    const values = tags.map((tag) => {
        const [min, max] = axes[tag];
        return min === max ? `${min}` : `${min}..${max}`;
    });
    const family = `Material+Symbols+${style}:${tags.join(',')}@${values.join(',')}`;
    return `https://fonts.googleapis.com/css2?family=${family}&icon_names=${icons.join(',')}&display=block`;
}

async function readExisting(path) {
    try {
        return await readFile(path);
    } catch {
        return undefined;
    }
}

const args = parseArgs(process.argv.slice(2));
const config = await loadConfig(args.config);
await checkNames(config);
const fromCwd = relative(process.cwd(), config.output);
const target = fromCwd.startsWith('..') ? config.output : fromCwd;
if (args.check) {
    console.log(`✓ ${config.icons.length} valid icons for ${target}`);
    process.exit(0);
}

const css = await fetchOk(cssUrl(config));
const fontUrl = /url\((https:[^)]+)\)\s*format\('woff2'\)/.exec(css)?.[1];
if (!fontUrl) fail(`No woff2 URL in the Google Fonts response:\n${css.slice(0, 500)}`);
const font = await fetchOk(fontUrl, false);
const size = `${(font.length / 1024).toFixed(1)} KB`;
if ((await readExisting(config.output))?.equals(font)) {
    console.log(`✓ ${config.icons.length} icons, ${size}, ${target} unchanged`);
} else {
    await mkdir(dirname(config.output), { recursive: true });
    await writeFile(config.output, font);
    console.log(`✓ ${config.icons.length} icons, ${size} → ${target}`);
}
