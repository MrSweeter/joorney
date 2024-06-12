import { baseSettings } from '../../configuration.js';
import { StorageSync } from '../utils/browser.js';
import { OdooAPIException } from '../utils/error.js';
import { isNumeric, sanitizeURL } from '../utils/util.js';
import { sanitizeVersion } from '../utils/version.js';
import { readCacheCall, saveCacheCall } from './cache.js';

//#region Window Action
export async function getActionWindowModelFallback(actionPath) {
    const { windowActionFallbacks } = await StorageSync.get(baseSettings);
    return windowActionFallbacks[window.location.origin]?.[actionPath];
}
export async function getActionWindowWithState(action, fields) {
    if (isNumeric(`${action}`)) {
        return await getActionWindowWithID(action, fields);
    }

    try {
        return await getActionWindowWithPath(action, fields);
    } catch (e) {
        if (e.type === 'OdooAPIException' && e.error.data.name === 'odoo.exceptions.AccessError') {
            // if a fallback exist, ignore the error
            const model = await getActionWindowModelFallback(action);
            if (model) return undefined;
        }
        throw e;
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
    const response = await getDataset('ir.actions.act_window', domain, fields, 1, 60);
    return response;
}
//#endregion

export async function getVersionInfo(urlArg) {
    const url = sanitizeURL(urlArg);
    if (url.protocol !== 'https:') return undefined;

    function parseInfo(info) {
        const version = info.server_version_info.slice(0, 2).join('.');
        return sanitizeVersion(version);
    }

    const cacheResult = await readCacheCall('getVersionInfo', url.origin);
    if (cacheResult) return parseInfo(cacheResult);

    const response = await fetch(`${url.origin}/web/webclient/version_info`, {
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        method: 'POST',
    });

    if (response.status !== 200) return undefined;

    const { result } = await response.json();
    saveCacheCall(15, 'getVersionInfo', result, url.origin);
    return parseInfo(result);
}

export async function getDataset(model, domain, fields, limit, cachingTime = 1) {
    let data = undefined;
    let fromCache = true;
    if (cachingTime > 0) {
        data = await readCacheCall('getDataset', model, domain, fields, limit);
    }
    if (!data) {
        data = await _getDataset(model, domain, fields, limit);
        fromCache = false;

        if (cachingTime > 0) saveCacheCall(cachingTime, 'getDataset', data, model, domain, fields, limit);
    }

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
