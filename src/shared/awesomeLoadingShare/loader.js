import { Runtime } from '../../utils/browser.js';

// Sentinel stored in settings instead of an extension URL: the URL embeds the extension id, which differs per browser.
export const JOORNEY_LOADER = 'joorney://loader';
export const JOORNEY_LOADER_LABEL = 'Joorney';

export function resolveLoaderImage(image) {
    return image === JOORNEY_LOADER ? Runtime.getURL('images/loading/joorney.svg') : image;
}

// Built-in and always first, even for profiles whose stored list predates it.
export function withBuiltInLoader(images) {
    return [JOORNEY_LOADER, ...(images || []).filter((img) => img !== JOORNEY_LOADER)];
}
