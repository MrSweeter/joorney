import { getActionWindowWithState, parseURL, sanitizedHrefToUrl } from './url_parser.js';

export function sanitizeURL(url) {
    return sanitizedHrefToUrl(url);
}

//#region Check model new form
export async function isServerActionCreateView_fromURL(url) {
    return await isModelCreateView_fromURL(url, 'ir.actions.server');
}

export async function isModelCreateView_fromURL(url, model) {
    const state = await parseURL(url);
    return state.model === model && state.view_type === 'form' && state.resId === 'new';
}
//#endregion

//#region Get model ID
// TODO MOVE IF USED ONCE
export async function getProjectTaskID_fromURL(url) {
    return (await getModelAndID_fromURL(url, 'project.task'))?.resId;
}

// TODO MOVE IF USED ONCE
export async function getKnowledgeArticleID_fromURL(url) {
    return (await getModelAndID_fromURL(url, 'knowledge.article'))?.resId;
}

export async function getModelAndID_fromURL(url, modelArg = undefined) {
    const state = await parseURL(url);

    const { model, resId } = state;
    if (modelArg && model !== modelArg) return undefined;
    if (resId && resId !== 'new') return { model, resId };
    return undefined;
}
//#endregion

const actionWindowFields = [
    'id',
    'name',
    'xml_id',
    'domain',
    'context',
    'limit',
    'filter',
    'res_model',
];
export async function getActionWindow_fromURL(url) {
    const state = await parseURL(url, actionWindowFields);
    if (state.actionWindow) return state.actionWindow;
    if (!state.action) return undefined;

    const actionWindow = getActionWindowWithState(state.action, actionWindowFields);
    if (actionWindow) return actionWindow;
    return undefined;
}