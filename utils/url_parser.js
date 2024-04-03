// https://github.com/odoo/odoo/blob/master/addons/web/static/src/core/browser/router.js#L173

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
async function parseURL(url, actionWindowFields = ['res_model']) {
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
function sanitizedHrefToUrl(href) {
    href = typeof href === 'object' ? href.href : href;
    const url = new URL(href.replace(/#/g, href.includes('?') ? '&' : '?'));
    return url;
}

function isNumeric(value) {
    return Boolean(value?.match(/^\d+$/));
}
//#endregion

//#region Window Action
async function getActionWindowWithState(action, fields) {
    // TODO CACHE SYSTEM TO AVOID SPAMMING REQUEST
    if (isNumeric(`${action}`)) {
        return getActionWindowWithID(action, fields);
    } else {
        return getActionWindowWithPath(action, fields);
    }
}
async function getActionWindowWithPath(path, fields) {
    if (!path) return undefined;
    return await getActionWindow([['path', '=', path]], fields);
}
async function getActionWindowWithID(id, fields) {
    if (!id) return undefined;
    return await getActionWindow([['id', '=', id]], fields);
}

async function getActionWindow(domain, fields) {
    const response = await fetch(
        new Request(`/web/dataset/call_kw/ir.actions.act_window/search_read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [],
                    kwargs: {
                        context: { active_test: false },
                        fields: fields,
                        domain: domain,
                        limit: 1,
                    },
                    model: 'ir.actions.act_window',
                    method: 'search_read',
                },
            }),
        })
    );

    const data = await response.json();

    if (data.result?.length === 0) return undefined;
    if (data.result === undefined) return undefined;

    return data.result[0];
}

//#endregion
