export function isNumeric(value) {
    return Boolean(value?.match(/^\d+$/));
}

export function sanitizeURL(url) {
    return sanitizedHrefToUrl(url);
}

function sanitizedHrefToUrl(hrefArg) {
    const href = typeof hrefArg === 'object' ? hrefArg.href : hrefArg;
    const url = new URL(href.replace(/#/g, href.includes('?') ? '&' : '?'));
    return url;
}

export function ValueIsNaN(value) {
    return isNaN(value) || Number.isNaN(value);
}

export async function sleep(timeMS) {
    return await new Promise((r) => setTimeout(r, timeMS));
}

export function yyyymmdd_hhmmssToDate(datetimeStr) {
    const [dateStr, timeStr] = datetimeStr.split(' ');
    return new Date(`${dateStr}T${timeStr}Z`).toISOString();
}
