import { Cookies } from './browser.js';

export async function setThemeModeCookie(expectedMode, origin, useConfiguredCookie) {
    if (!origin.startsWith('http')) return;
    await Cookies.set({
        name: 'color_scheme',
        value: expectedMode,
        url: origin,
    });
    if (useConfiguredCookie) {
        await Cookies.set({
            name: 'configured_color_scheme',
            value: expectedMode,
            url: origin,
        });
    }
}

export async function getThemeModeCookie(origin, useConfiguredCookie) {
    if (!origin.startsWith('http')) return 'light';

    if (!Cookies) return getCookiesFromDocument(useConfiguredCookie);

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
    if (useConfiguredCookie) return cookies[0]?.value || cookies[1]?.value || 'light';
    return cookies[1]?.value || 'light';
}

function getCookiesFromDocument(useConfiguredCookie) {
    if (!document) return 'light';

    const decodedCookie = decodeURIComponent(document.cookie);

    const cookieName =
        decodedCookie.includes('configured_color_scheme') && useConfiguredCookie
            ? 'configured_color_scheme'
            : decodedCookie.includes('color_scheme')
              ? 'color_scheme'
              : null;

    if (!cookieName) return 'light';

    const cookies = decodedCookie.split(';');

    const cookie = cookies.find((c) => c.trim().indexOf(cookieName) === 0).substring(cookieName.length + 2);

    return cookie || 'light';
}
