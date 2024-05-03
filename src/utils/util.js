export function isNumeric(value) {
    return Boolean(value?.match(/^\d+$/));
}

export function sanitizeURL(url) {
    return sanitizedHrefToUrl(url);
}

function sanitizedHrefToUrl(href) {
    href = typeof href === 'object' ? href.href : href;
    const url = new URL(href.replace(/#/g, href.includes('?') ? '&' : '?'));
    return url;
}
