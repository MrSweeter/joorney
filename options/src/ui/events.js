/**
 * DOM events of the options page shell and UI kit, dispatched on `document` as CustomEvent.
 */
export const UI_EVENTS = {
    // detail: { type, ids, host?, changes } after every write of options/src/ui/state.js
    STATE_CHANGE: 'joorney:state-change',
    // detail: { page, params } before the page container is replaced (options/src/layout.js)
    PAGE_CHANGE: 'joorney:page-change',
    // detail: { action } on the element of an action that succeeded, bubbling: a checklist step completes on the
    // result, not on the click (an invalid input or a cancelled confirmation does nothing)
    ACTION_DONE: 'joorney:action-done',
};

export function dispatchUIEvent(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function dispatchActionDone(element, action) {
    element?.dispatchEvent(new CustomEvent(UI_EVENTS.ACTION_DONE, { bubbles: true, detail: { action } }));
}
