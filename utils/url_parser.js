//#region Check model new form
async function isServerActionCreateView_fromURL(url) {
    return await isModelCreateView_fromURL(url, 'ir.actions.server');
}

async function isModelCreateView_fromURL(url, model) {
    url = typeof url === 'object' ? url : new URL(url);

    let pathname = url.pathname;
    if (pathname.startsWith('/odoo')) {
        pathname = pathname.replace(/^\/odoo/, ''); // ^ for start of string
        return await isModelCreateView_V2(pathname, model);
    }

    return isModelCreateView_V1(url, model);
}

async function isModelCreateView_V1(url, model) {
    const search = url.searchParams;
    if (!search.has('model') || search.get('model') !== model) return false;
    if (!search.has('view_type') || search.get('view_type') != 'form') return false;
    return true;
}
async function isModelCreateView_V2(pathname, model) {
    const endWithNewPattern = /\/.+\/new$/; // $ for end of string
    if (!endWithNewPattern.test(pathname)) return false;

    const paths = pathname.split('/');
    const pathAction = paths[paths.length - 2];

    const actionWindow = await getActionWindowFromPath(pathAction);
    if (!actionWindow) return false;
    if (actionWindow.res_model !== model) return false;
    return true;
}
//#endregion

//#region Get model ID
async function getProjectTaskID_fromURL(url) {
    return await getModelID_fromURL(url, 'project.task');
}

async function getKnowledgeArticleID_fromURL(url) {
    return await getModelID_fromURL(url, 'knowledge.article');
}

async function getModelID_fromURL(url, model) {
    url = typeof url === 'object' ? url : new URL(url);

    // 17.2 URL doesn't contains the model anymore, only the path of an action
    // /odoo/act-824/66
    // /odoo/project/10/tasks/66
    let pathname = url.pathname;
    if (pathname.startsWith('/odoo')) {
        // Remove "/odoo" prefix
        pathname = pathname.replace(/^\/odoo/, ''); // ^ for start of string
        return await getModelID_V2(pathname, model);
    }

    return getModelID_V1(url, model);
}

function getModelID_V1(url, model) {
    const search = url.searchParams;
    if (!search.has('model') || search.get('model') !== model) return undefined;
    if (!search.has('view_type') || search.get('view_type') != 'form') return undefined;
    if (!search.has('id')) return undefined;
    const id = parseInt(search.get('id'));
    return isNaN(id) ? undefined : id;
}

async function getModelID_V2(pathname, model) {
    const endWithDigitsPattern = /\/.+\/\d+$/; // $ for end of string
    if (!endWithDigitsPattern.test(pathname)) return undefined;

    const paths = pathname.split('/');
    const pathID = parseInt(paths[paths.length - 1]);
    const pathAction = paths[paths.length - 2];

    const actionWindow = await getActionWindowFromPath(pathAction);
    if (!actionWindow) return undefined;
    if (actionWindow.res_model !== model) return undefined;
    return isNaN(pathID) ? undefined : pathID;
}
//#endregion

//#region Get Action Window
async function getActionWindowFromPath(pathAction) {
    const windowActionPathPattern = /^act-\d+$/; // $ for end of string
    let actionWindow = false;

    if (windowActionPathPattern.test(pathAction)) {
        const pathActionID = parseInt(pathAction.replace(/^act-/, ''));
        actionWindow = await getActionWindowWithID(pathActionID);
    } else {
        actionWindow = await getActionWindowWithPath(pathAction);
    }

    if (!actionWindow) return undefined;
    return actionWindow;
}
async function getActionWindowWithPath(path) {
    return await getActionWindow([['path', '=', path]]);
}
async function getActionWindowWithID(id) {
    return await getActionWindow([['id', '=', id]]);
}
async function getActionWindow(domain) {
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
                        fields: ['res_model'],
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
