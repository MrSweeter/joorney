/**
 * DOM events of the options page shell and UI kit, dispatched on `document` as CustomEvent.
 */
export const UI_EVENTS = {
    // detail: { type, ids, host?, changes } after every write of options/src/ui/state.js
    STATE_CHANGE: 'joorney:state-change',
    // detail: { page, params } before the page container is replaced (options/src/layout.js)
    PAGE_CHANGE: 'joorney:page-change',
};

export function dispatchUIEvent(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
}
