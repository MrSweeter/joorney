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
