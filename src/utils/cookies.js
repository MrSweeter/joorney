import { Cookies } from './browser.js';

export async function setThemeModeCookie(expectedMode, origin) {
    if (!origin.startsWith('http')) return;
    await Cookies.set({
        name: 'color_scheme',
        value: expectedMode,
        url: origin,
    });
    await Cookies.set({
        name: 'configured_color_scheme',
        value: expectedMode,
        url: origin,
    });
}

export async function getThemeModeCookie(origin) {
    if (!origin.startsWith('http')) return 'light';

    if (!Cookies) return getCookiesFromDocument();

    const cookies = await Promise.all([
        Cookies.get({
            name: 'configured_color_scheme',
            url: origin,
        }),
        Cookies.get({
            name: 'color_scheme',
            url: origin,
        }),
    ]);
    return cookies[0]?.value || cookies[1]?.value || 'light';
}

function getCookiesFromDocument() {
    if (!document) return 'light';

    let decodedCookie = decodeURIComponent(document.cookie);

    let cookieName = decodedCookie.includes('configured_color_scheme')
        ? 'configured_color_scheme'
        : decodedCookie.includes('color_scheme')
        ? 'color_scheme'
        : null;

    if (!cookieName) return 'light';

    let cookies = decodedCookie.split(';');

    const cookie = cookies
        .find((c) => c.trim().indexOf(cookieName) === 0)
        .substring(cookieName.length + 2);

    return cookie || 'light';
}
