import fs from 'node:fs';
import path from 'node:path';

/**
 * Lite build assets: remove the markup of the features not in the build and copy only the stylesheets still linked.
 *
 * Feature markup is tagged in the HTML sources (popup/index.html, options/pages/configuration/index.html):
 * - data-feature-customization="<id>": the element belongs to this feature (also used by the feature scripts)
 * - data-features="<id> <id>": the element belongs to several features (build only, takes precedence)
 * An element is kept when one of its features is in the build. Untagged elements are always kept.
 */

const VOID_ELEMENTS = new Set(['link', 'meta', 'img', 'input', 'br', 'hr']);
const FEATURE_ELEMENT = /<([a-zA-Z][\w-]*)\b[^>]*\bdata-feature(?:s|-customization)="[^"]*"[^>]*>/g;

function getElementFeatures(openTag) {
    const match = openTag.match(/\bdata-features="([^"]*)"/) ?? openTag.match(/\bdata-feature-customization="([^"]*)"/);
    return match[1].split(/\s+/).filter(Boolean);
}

// Index after the closing tag matching an element opened just before 'from'
function findElementEnd(html, tag, from) {
    const tagRegex = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    tagRegex.lastIndex = from;
    let depth = 1;
    for (let match = tagRegex.exec(html); match; match = tagRegex.exec(html)) {
        if (match[0].endsWith('/>')) continue;
        depth += match[1] ? -1 : 1;
        if (depth === 0) return tagRegex.lastIndex;
    }
    throw new Error(`Unclosed <${tag}> element at ${from}`);
}

/**
 * @param {string} html
 * @param {string[]} featureIDs features of the build
 * @returns {string} the html without the elements of the other features
 */
export function stripFeatureMarkup(html, featureIDs) {
    const elementRegex = new RegExp(FEATURE_ELEMENT.source, 'g');
    let result = '';
    let cursor = 0;
    for (let match = elementRegex.exec(html); match; match = elementRegex.exec(html)) {
        if (getElementFeatures(match[0]).some((f) => featureIDs.includes(f))) continue;

        const tag = match[1].toLowerCase();
        const isVoid = VOID_ELEMENTS.has(tag) || match[0].endsWith('/>');
        const end = isVoid ? elementRegex.lastIndex : findElementEnd(html, tag, elementRegex.lastIndex);

        // Remove the whole lines when the element is alone on them, no blank line left behind
        const lineStart = html.lastIndexOf('\n', match.index - 1) + 1;
        const start = /^\s*$/.test(html.slice(lineStart, match.index)) ? lineStart : match.index;
        const lineEnd = html.indexOf('\n', end);
        const stop = lineEnd !== -1 && /^\s*$/.test(html.slice(end, lineEnd)) ? lineEnd + 1 : end;

        result += html.slice(cursor, Math.max(start, cursor));
        cursor = stop;
        elementRegex.lastIndex = stop;
    }
    return result + html.slice(cursor);
}

/**
 * @param {string} html
 * @returns {string[]} href of the local stylesheets
 */
export function getLocalStylesheets(html) {
    return [...html.matchAll(/<link\b[^>]*>/g)]
        .map((m) => m[0])
        .filter((tag) => /\brel="stylesheet"/.test(tag))
        .map((tag) => tag.match(/\bhref="([^"]+)"/)?.[1])
        .filter((href) => href && !/^(https?:)?\/\//.test(href));
}

/**
 * rollup-plugin-copy targets of HTML documents for a lite build: stripped HTML and the stylesheets they link.
 * Stylesheets keep their repository path in the bundle (popup/css/x.css -> <output>/popup/css/x.css).
 * @param {string} rootDir repository root
 * @param {string} output bundle folder
 * @param {string[]} featureIDs features of the build
 * @param {{src: string, dest: string, base: string}[]} documents html source, its bundle folder and the folder its
 *  links are relative to (an options page is injected in options/index.html: its links are relative to options)
 */
export function getLiteDocumentTargets(rootDir, output, featureIDs, documents) {
    const targets = [];
    const stylesheets = new Set();
    for (const document of documents) {
        const html = stripFeatureMarkup(fs.readFileSync(path.join(rootDir, document.src), 'utf-8'), featureIDs);
        for (const href of getLocalStylesheets(html)) {
            stylesheets.add(path.posix.normalize(path.posix.join(document.base, href)));
        }
        targets.push({
            src: document.src,
            dest: `${output}/${document.dest}`,
            transform: (contents) => stripFeatureMarkup(contents.toString(), featureIDs),
        });
    }
    for (const stylesheet of stylesheets) {
        targets.push({ src: stylesheet, dest: `${output}/${path.posix.dirname(stylesheet)}` });
    }
    return targets;
}
