// https://github.com/odoo/odoo/blob/master/addons/web/static/src/core/browser/router.js#L173

import { getActionWindowWithState } from '../api/odoo.js';
import { isNumeric } from './util.js';

const defaultState = {
    resId: undefined,
    view_type: undefined,
    action: undefined,
    active_id: undefined,
    model: undefined,
};

/**
 *
 * @param {*} url: string|URL
 * @param {*} actionWindowFields: StringArray
 * @returns { resId: string|int, active_id: int, view_type: string, action: int, model: string, actionWindow: OdooActionWindow }
 */
export async function parseURL(url, actionWindowFields = ['res_model']) {
    url = typeof url === 'object' ? url : new URL(url);

    const sanitizedURL = sanitizedHrefToUrl(url.href);

    const { pathname, searchParams } = sanitizedURL;

    let state = {};

    if (pathname === '/web') {
        state = parseURL_V1(searchParams);
        return state;
    }

    state = parseURL_V2(pathname);

    if (state.action === 'studio') return defaultState;

    if (state.action && !state.model) {
        let actionWindow = await getActionWindowWithState(state.action, actionWindowFields);
        if (actionWindow) {
            state.model = actionWindow.res_model;
            state.actionWindow = actionWindow;
        }
    }
    return state;
}

function parseURL_V1(searchParams) {
    const state = { ...defaultState };

    if (searchParams.has('id')) {
        const id = searchParams.get('id');
        if (isNumeric(id)) state.resId = parseInt(id);
        state.view_type = searchParams.get('view_type');
    } else if (searchParams.get('view_type') === 'form') {
        state.resId = 'new';
        state.view_type = 'form';
    }

    if (searchParams.has('action')) {
        state.action = searchParams.get('action');
    }

    if (searchParams.has('active_id')) {
        const active_id = searchParams.get('active_id');
        if (isNumeric(active_id)) state.active_id = parseInt(active_id);
    }

    if (searchParams.has('model')) {
        state.model = searchParams.get('model');
    }

    return state;
}

function parseURL_V2(pathname) {
    const [prefix, ...splitPath] = pathname.split('/').filter(Boolean);
    if (prefix !== 'odoo') return {};

    const actionParts = [...splitPath.entries()].filter(
        ([_, part]) => !isNumeric(part) && part !== 'new'
    );
    let lastAction = defaultState;

    for (const [i, part] of actionParts) {
        const action = {};
        const [left, right] = [splitPath[i - 1], splitPath[i + 1]];

        if (isNumeric(left)) {
            action.active_id = parseInt(left);
        }

        if (right === 'new') {
            action.resId = 'new';
        } else if (isNumeric(right)) {
            action.resId = parseInt(right);
        }

        if (part.startsWith('action-')) {
            // Ignore xml_id, Odoo override it with ID
            const actionId = part.slice(7);
            if (isNumeric(actionId)) action.action = parseInt(actionId);
        } else if (part.startsWith('m-')) {
            action.model = part.slice(2);
        } else if (part.includes('.')) {
            action.model = part;
        } else {
            action.action = part;
        }

        if (action.resId && action.action) {
            const act = { ...action };
            delete act.resId;
            lastAction = act;
        }

        if (action.action || action.resId || i === splitPath.length - 1) {
            lastAction = action;
        }
    }

    return lastAction;
}

//#region Utils
export function sanitizedHrefToUrl(href) {
    href = typeof href === 'object' ? href.href : href;
    const url = new URL(href.replace(/#/g, href.includes('?') ? '&' : '?'));
    return url;
}
//#endregion
