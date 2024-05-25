export function isNumeric(value: string | NullUndefined): boolean {
    return Boolean(value?.match(/^\d+$/));
}

export function sanitizeURL(url: UnsafeURL): URL {
    return sanitizedHrefToUrl(url);
}

function sanitizedHrefToUrl(hrefArg: UnsafeURL): URL {
    const href = hrefArg instanceof URL ? hrefArg.href : hrefArg;
    const url = new URL(href.replace(/#/g, href.includes('?') ? '&' : '?'));
    return url;
}

export function ValueIsNaN(valueArg: string | number): boolean {
    const value = Number.parseInt(`${valueArg}`);
    return isNaN(value) || Number.isNaN(value);
}
