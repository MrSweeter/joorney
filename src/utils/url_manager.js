import { getActionWindowWithState } from '../api/odoo.js';
import { parseURL } from './url_parser.js';
import { sanitizeURL } from './util.js';

//#region URL Creator
export function createRecordFormURL(url, model, id) {
    const sanitizedURL = sanitizeURL(url);
    const { pathname } = sanitizedURL;

    if (pathname === '/web') {
        return `${url.origin}${url.pathname}#id=${id}&model=${model}&view_type=form`;
    }

    return `${url.origin}${url.pathname}/${model}/${id}`;
}
export function createActionMenuURL(url, actionID) {
    if (url.pathname.startsWith('/web')) {
        return `${url.origin}${url.pathname}#action=${actionID}`;
    }

    return `${url.origin}${url.pathname}/action-${actionID}${url.search}`;
}
//#endregion

//#region Check model new form
export async function isModelCreateView_fromURL(url, model) {
    const state = await parseURL(url);
    return state.model === model && state.view_type === 'form' && state.resId === 'new';
}
//#endregion

//#region Get model ID
export async function getModelAndID_fromURL(url, modelArg = undefined, requireID = false) {
    const state = await parseURL(url, undefined, requireID);

    const { model, resId } = state;
    if (modelArg && model !== modelArg) return undefined;
    if (resId && resId !== 'new') return { model, resId };
    return undefined;
}
//#endregion

const actionWindowFields = ['id', 'name', 'xml_id', 'domain', 'context', 'limit', 'filter', 'res_model'];
export async function getActionWindow_fromURL(url) {
    const state = await parseURL(url, actionWindowFields);
    if (state.actionWindow) return state.actionWindow;
    if (!state.action) return undefined;

    const actionWindow = await getActionWindowWithState(state.action, actionWindowFields);
    if (actionWindow) return actionWindow;
    return undefined;
}
