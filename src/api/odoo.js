import { baseSettings } from '../../configuration.js';
import { StorageSync } from '../utils/browser.js';
import { OdooAPIException } from '../utils/error.js';
import { isNumeric, sanitizeURL, toOdooBackendDateGMT0 } from '../utils/util.js';
import { sanitizeVersion } from '../utils/version.js';
import { cache } from './cache.js';

//#region Window Action
export async function getActionWindowModelFallback(actionPath) {
    const { windowActionFallbacks } = await StorageSync.get(baseSettings);
    return windowActionFallbacks[window.location.origin]?.[actionPath];
}
export async function getActionWindowWithState(action) {
    try {
        if (isNumeric(`${action}`)) {
            return await getActionWindowWithID(action);
        }

        return await getActionWindowWithPath(action);
    } catch (e) {
        // TODO[REMOVE] After more usage/testing, probably useless as /action/load|run is "public" endpoint
        if (e.type === 'OdooAPIException' && e.error.data.name === 'odoo.exceptions.AccessError') {
            // if a fallback exist, ignore the error
            const model = await getActionWindowModelFallback(action);
            if (model) return undefined;
        }
        throw e;
    }
}
async function getActionWindowWithPath(path) {
    if (!path) return undefined;
    return await getActionWindow_fromLoadRun(path);
}
async function getActionWindowWithID(id) {
    if (!id) return undefined;
    return await getActionWindow_fromLoadRun(id);
}

async function getActionWindow_fromLoadRun(idOrPath, cachingTime = 60) {
    let { fromCache, data } = await cache(
        cachingTime,
        async () => {
            const response = await fetch(
                new Request('/web/action/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'call',
                        params: {
                            action_id: idOrPath,
                        },
                    }),
                })
            );
            if (!response.ok) return undefined;
            return await response.json();
        },
        'getActionWindow_fromLoadRun_web-action-load',
        idOrPath
    );

    if (!data || !data.result) data = undefined;

    if (data && data.result.type === 'ir.actions.server') {
        ({ fromCache, data } = await cache(
            cachingTime,
            async () => {
                const response = await fetch(
                    new Request('/web/action/run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'call',
                            params: {
                                action_id: data.result.id,
                            },
                        }),
                    })
                );
                if (!response.ok) return undefined;
                return await response.json();
            },
            'getActionWindow_fromLoadRun_web-action-run',
            idOrPath
        ));
    }

    if (!data) return undefined;

    if (data.error) {
        throw new OdooAPIException(data.error, fromCache);
    }
    if (data.result) {
        if (typeof data.result.context !== 'string') data.result.context = JSON.stringify(data.result.context);
        if (data.result.type !== 'ir.actions.act_window') return undefined;
    }

    return data.result;
}
//#endregion

export async function getVersionInfo(urlArg) {
    const url = sanitizeURL(urlArg);
    if (url.protocol !== 'https:') return undefined;

    function parseInfo(info) {
        const version = info.server_version_info.slice(0, 2).join('.');
        return sanitizeVersion(version);
    }

    const { data } = await cache(
        15,
        async () => {
            const response = await fetch(`${url.origin}/web/webclient/version_info`, {
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
                method: 'POST',
            });

            if (!response.ok) return undefined;
            return await response.json();
        },
        'getVersionInfo',
        url.origin
    );
    if (!data || !data.result) return undefined;
    return parseInfo(data.result);
}

export async function getDataset(model, domain, fields, limit, cachingTime = 1) {
    const { fromCache, data } = await cache(
        cachingTime,
        async () => {
            return await _getDataset(model, domain, fields, limit);
        },
        'getDataset',
        model,
        domain,
        fields,
        limit
    );

    if (data.error) {
        throw new OdooAPIException(data.error, fromCache);
    }

    if (data.result === undefined) return limit === 1 ? undefined : [];
    if (data.result.length === 0) return limit === 1 ? undefined : [];

    return limit === 1 ? data.result[0] : data.result;
}

async function _getDataset(model, domain, fields, limit) {
    const response = await fetch(
        new Request(`/web/dataset/call_kw/${model}/search_read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [],
                    kwargs: {
                        context: { active_test: false, lang: 'en_US' },
                        fields: fields,
                        domain: domain,
                        limit: limit,
                    },
                    model: model,
                    method: 'search_read',
                },
            }),
        })
    );

    const data = await response.json();
    return data;
}

export async function getDatasetWithIDs(model, ids) {
    const recordIDs = Array.isArray(ids) ? ids : [ids];
    const response = await fetch(
        new Request(`/web/dataset/call_kw/${model}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [recordIDs],
                    kwargs: {},
                    model: model,
                    method: 'read',
                },
            }),
        })
    );

    const data = await response.json();

    if (data.result === undefined) return [];
    if (data.result.length === 0) return [];

    return data.result;
}

export async function getMetadata(model, resId) {
    const metadataResponse = await fetch(
        new Request(`/web/dataset/call_kw/${model}/get_metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [[resId]],
                    kwargs: {},
                    model: model,
                    method: 'get_metadata',
                },
            }),
        })
    );

    const metadataData = await metadataResponse.json();

    if (metadataData.result === undefined) return [];
    if (metadataData.result.length === 0) return [];

    return metadataData.result[0];
}

export async function writeRecord(model, recordID, writeData) {
    const response = await fetch(
        new Request(`/web/dataset/call_kw/${model}/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                method: 'call',
                jsonrpc: '2.0',
                params: {
                    args: [[recordID], writeData],
                    kwargs: { context: {} },
                    model: model,
                    method: 'write',
                },
            }),
        })
    );

    const data = await response.json();

    if (data.error) {
        throw new OdooAPIException(data.error, false);
    }
    if (data?.result === true) {
        return true;
    }
    throw new Error(data?.result);
}

export async function getMenu(menupath) {
    const parts = menupath.split('/').reverse();
    let field = 'name';
    const domain = [];
    for (const part of parts) {
        domain.push([field, '=', part.trim()]);
        field = `parent_id.${field}`;
    }

    const response = await getDataset('ir.ui.menu', domain, ['action'], 2, 600);
    return response;
}

//#region External Public Odoo API
export async function getFutureEventWithName(domainName, host) {
    const { data } = await cache(
        30 * 24 * 60,
        async () => {
            const url = `https://${host}/web/dataset/call_kw/event.event/search_read`;
            const today = toOdooBackendDateGMT0(new Date());
            const payload = {
                method: 'call',
                jsonrpc: '2.0',
                params: {
                    args: [],
                    kwargs: {
                        context: { active_test: true, lang: 'en_US' },
                        domain: [domainName, ['date_end', '>=', today]],
                        limit: 1,
                        fields: ['date_begin', 'date_end', 'name', 'display_name'],
                    },
                    model: 'event.event',
                    method: 'search_read',
                },
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            return await response.json();
        },
        'getFutureEventWithName',
        domainName,
        host
    );
    if (!data) return undefined;
    if (data.error) return undefined;
    if (!data.result || data.result.length !== 1) return undefined;
    return data.result[0];
}
//#endregion
