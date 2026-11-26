// Check _locales/<lang>/messages.json against the code:
// - every key used (t(), translate(), data-i18n*, __MSG_*__, *Key: '...', feature names) exists in every language
// - every language defines the same keys
// - every $name$ in a message has its placeholder
// - Chrome message format: names [A-Za-z0-9_@], not starting with '@@', case-insensitive (no duplicates),
//   manifest name <= 75 and description <= 132 characters
// Warnings only: unused keys, default locale messages without description, placeholders without example,
//   French plain space around ! ? : ; « » (French typography uses a narrow no-break space, U+202F).
// https://developer.chrome.com/docs/extensions/mv3/i18n-messages
// Exit code 1 on error.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_FOLDERS = ['node_modules', 'bundle', 'docs', 'lib', 'gh-page', '_locales'];
const MANIFEST_LIMITS = { ext_name: 75, ext_description: 132 };
// Plain space before ! ? : ; » (group 1) or after « (group 2)
const FRENCH_PLAIN_SPACE = / ([!?:;»])|(«) /g;
const KEY_PATTERNS = [
    /\bt\(\s*'([\w@]+)'/g,
    /translate\([^',]+,\s*'([\w@]+)'/g,
    /data-i18n(?:-[\w-]+)?="([\w@]+)"/g,
    /__MSG_([\w@]+)__/g,
    // Keys stored in objects and translated later (labelKey, errorKey, descriptionKey...)
    /\w+Key:\s*'([\w@]+)'/g,
];

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

function walk(folder) {
    return fs.readdirSync(path.join(root, folder), { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(folder, entry.name);
        if (entry.isDirectory())
            return entry.name.startsWith('.') || SKIP_FOLDERS.includes(entry.name) ? [] : walk(file);
        return /\.(js|html|json)$/.test(entry.name) ? [file] : [];
    });
}

function main() {
    const languages = fs.readdirSync(path.join(root, '_locales'));
    const catalogs = Object.fromEntries(
        languages.map((lang) => [lang, JSON.parse(read(path.join('_locales', lang, 'messages.json')))])
    );

    const used = new Map();
    for (const file of walk('.')) {
        const content = read(file);
        for (const pattern of KEY_PATTERNS) {
            for (const match of content.matchAll(pattern)) used.set(match[1], file);
        }
    }
    // src/utils/i18n.js featureName()
    for (const featureID of fs.readdirSync(path.join(root, 'src', 'features'))) {
        used.set(`feature_${featureID}_name`, `src/features/${featureID}`);
    }

    const errors = [];
    const warnings = [];
    const defaultLanguage = JSON.parse(read('manifest.json')).default_locale;
    for (const lang of languages) {
        const names = new Map();
        for (const [key, entry] of Object.entries(catalogs[lang])) {
            if (!/^[A-Za-z0-9_@]+$/.test(key) || key.startsWith('@@')) errors.push(`Invalid name '${key}' in ${lang}`);
            const lower = key.toLowerCase();
            if (names.has(lower))
                errors.push(`Duplicate name '${key}' / '${names.get(lower)}' in ${lang} (case-insensitive)`);
            names.set(lower, key);
            if (key in MANIFEST_LIMITS && entry.message.length > MANIFEST_LIMITS[key]) {
                errors.push(`'${key}' in ${lang} is longer than ${MANIFEST_LIMITS[key]} characters`);
            }
            if (lang === defaultLanguage && !entry.description) warnings.push(`No description for '${key}' (${lang})`);
            for (const [name, placeholder] of Object.entries(entry.placeholders ?? {})) {
                if (!placeholder.example) warnings.push(`No example for placeholder '${name}' of '${key}' (${lang})`);
            }
            if (lang.toLowerCase().startsWith('fr')) {
                for (const match of entry.message.matchAll(FRENCH_PLAIN_SPACE)) {
                    const sign = match[1] ?? match[2];
                    warnings.push(
                        `Plain space ${match[1] ? 'before' : 'after'} '${sign}' in ${lang}: ${key} (use U+202F)`
                    );
                }
            }
        }
    }

    for (const [key, file] of used) {
        for (const lang of languages) {
            if (!catalogs[lang][key]) errors.push(`Missing '${key}' in ${lang} (used in ${file})`);
        }
    }

    const defined = new Set(languages.flatMap((lang) => Object.keys(catalogs[lang])));
    for (const key of defined) {
        for (const lang of languages) {
            if (!catalogs[lang][key]) errors.push(`Missing '${key}' in ${lang} (defined in another language)`);
        }
        if (!used.has(key)) warnings.push(`Unused key: ${key}`);
    }

    for (const lang of languages) {
        for (const [key, entry] of Object.entries(catalogs[lang])) {
            const placeholders = Object.keys(entry.placeholders ?? {}).map((name) => name.toLowerCase());
            for (const match of entry.message.matchAll(/\$(\w+)\$/g)) {
                if (!placeholders.includes(match[1].toLowerCase())) {
                    errors.push(`Undefined placeholder '$${match[1]}$' in ${lang}: ${key}`);
                }
            }
        }
    }

    for (const warning of warnings) console.warn(warning);
    for (const error of errors) console.error(error);
    console.info(
        `${languages.length} languages, ${defined.size} keys defined, ${used.size} used, ${errors.length} error(s), ${warnings.length} warning(s)`
    );
    process.exit(errors.length ? 1 : 0);
}

main();
