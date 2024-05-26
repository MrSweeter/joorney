import { getActionWindowWithState } from '../api/odoo.js';
import { parseURL } from './url_parser';
import { sanitizeURL } from './util';

//#region URL Creator
export function createRecordFormURL(url: UnsafeURL, model: string, id: number): string {
    const sanitizedURL: URL = sanitizeURL(url);
    const { pathname } = sanitizedURL;

    if (pathname === '/web') {
        return `${sanitizedURL.origin}${sanitizedURL.pathname}#id=${id}&model=${model}&view_type=form`;
    }

    return `${sanitizedURL.origin}${sanitizedURL.pathname}/${model}/${id}`;
}
//#endregion

//#region Check model new form
export async function isModelCreateView_fromURL(url: UnsafeURL, model: string): Promise<boolean> {
    const state = await parseURL(url);
    return state.model === model && state.view_type === 'form' && state.resId === 'new';
}
//#endregion

//#region Get model ID
export async function getModelAndID_fromURL(
    url: UnsafeURL,
    modelArg: string | NullUndefined = undefined,
    requireID = false
): Promise<ModelID | NullUndefined> {
    const state = await parseURL(url, undefined, requireID);

    const { model, resId } = state;
    if (modelArg && model !== modelArg) return undefined;
    if (resId && resId !== 'new') return { model, resId };
    return undefined;
}
//#endregion

const actionWindowFields = ['id', 'name', 'xml_id', 'domain', 'context', 'limit', 'filter', 'res_model'];
export async function getActionWindow_fromURL(url: UnsafeURL): Promise<WindowAction | NullUndefined> {
    const state = await parseURL(url, actionWindowFields);
    if (state.actionWindow) return state.actionWindow;
    if (!state.action) return undefined;

    const actionWindow = await getActionWindowWithState(state.action, actionWindowFields);
    if (actionWindow) return actionWindow;
    return undefined;
}
