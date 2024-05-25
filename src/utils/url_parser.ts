// https://github.com/odoo/odoo/blob/master/addons/web/static/src/core/browser/router.js#L173

import { getActionWindowWithState } from '../api/odoo.js';
import { isNumeric, sanitizeURL } from './util.ts';

const defaultState: URLState = {
    resId: undefined,
    view_type: undefined,
    action: undefined,
    active_id: undefined,
    model: undefined,
    actionWindow: undefined,
};

export async function parseURL(
    urlArg: UnsafeURL,
    actionWindowFields = ['res_model'],
    requireID = false
): Promise<URLState> {
    const sanitizedURL = sanitizeURL(urlArg);

    const { pathname, searchParams } = sanitizedURL;

    let state: URLState = JSON.parse(JSON.stringify(defaultState));

    if (pathname === '/web') {
        state = parseURL_V1(searchParams);
        return state;
    }

    state = parseURL_V2(pathname);

    if (state.action === 'studio') return defaultState;
    if (requireID && !state.resId) return state;

    if (state.action && !state.model) {
        const actionWindow = await getActionWindowWithState(state.action, actionWindowFields);
        if (actionWindow) {
            state.model = actionWindow.res_model;
            state.actionWindow = actionWindow;
        }
    }
    return state;
}

function parseURL_V1(searchParams: URLSearchParams): URLState {
    const state = { ...defaultState };

    if (searchParams.has('id')) {
        const id = searchParams.get('id');
        if (isNumeric(id)) state.resId = Number.parseInt(id as string);
        state.view_type = searchParams.get('view_type');
    } else if (searchParams.get('view_type') === 'form') {
        state.resId = 'new';
        state.view_type = 'form';
    }

    if (searchParams.has('action')) {
        const action = searchParams.get('action');
        if (isNumeric(action)) state.action = Number.parseInt(action as string);
    }

    if (searchParams.has('active_id')) {
        const active_id = searchParams.get('active_id');
        if (isNumeric(active_id)) state.active_id = Number.parseInt(active_id as string);
    }

    if (searchParams.has('model')) {
        state.model = searchParams.get('model');
    }

    return state;
}

function parseURL_V2(pathname: string): URLState {
    const [prefix, ...splitPath] = pathname.split('/').filter(Boolean);
    if (prefix !== 'odoo') return defaultState;

    const actionParts = [...splitPath.entries()].filter(([_, part]) => !isNumeric(part) && part !== 'new');
    let lastAction = defaultState;

    for (const [i, part] of actionParts) {
        const action = JSON.parse(JSON.stringify(defaultState));
        const [left, right] = [splitPath[i - 1], splitPath[i + 1]];

        if (isNumeric(left)) {
            action.active_id = Number.parseInt(left);
        }

        if (right === 'new') {
            action.resId = 'new';
            action.view_type = 'form';
        } else if (isNumeric(right)) {
            action.resId = Number.parseInt(right);
        }

        if (part.startsWith('action-')) {
            // Ignore xml_id, Odoo override it with ID
            const actionId = part.slice(7);
            if (isNumeric(actionId)) action.action = Number.parseInt(actionId);
        } else if (part.startsWith('m-')) {
            action.model = part.slice(2);
        } else if (part.includes('.')) {
            action.model = part;
        } else {
            action.action = part;
        }

        if (action.resId && action.action) {
            const act = { ...action };
            act.resId = undefined;
            lastAction = act;
        }

        if (action.action || action.resId || i === splitPath.length - 1) {
            lastAction = action;
        }
    }

    return lastAction;
}
