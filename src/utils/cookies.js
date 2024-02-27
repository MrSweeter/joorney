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
