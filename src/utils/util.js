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

export function toLocaleDateStringFormatted(date) {
    return date.toLocaleDateString([], { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export function toLocaleTimeStringFormatted(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function toLocaleDateTimeStringFormatted(date) {
    return `${toLocaleDateStringFormatted(date)} ${toLocaleTimeStringFormatted(date)}`;
}

export function toOdooBackendDateGMT0(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function hasUnknownKey(sourceObj, targetObj) {
    for (const key in sourceObj) {
        if (!(key in targetObj)) {
            return true;
        }
    }
    return false;
}
