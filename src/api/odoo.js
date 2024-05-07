import { isNumeric, sanitizeURL } from '../utils/util.js';
import { readCacheCall, saveCacheCall } from './cache.js';

//#region Window Action
export async function getActionWindowWithState(action, fields) {
    if (isNumeric(`${action}`)) {
        return getActionWindowWithID(action, fields);
    }
    return getActionWindowWithPath(action, fields);
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
    if (cachingTime > 0) {
        const result = await readCacheCall('getDataset', model, domain, fields, limit);
        if (result) return limit === 1 ? result[0] : result;
    }

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

    if (data.result?.length === 0) return undefined;
    if (data.result === undefined) return undefined;

    if (cachingTime > 0) saveCacheCall(cachingTime, 'getDataset', data.result, model, domain, fields, limit);

    return limit === 1 ? data.result[0] : data.result;
}

export async function getDatasetWithID(model, ids) {
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

    if (data.result?.length === 0) return undefined;
    if (data.result === undefined) return undefined;

    return ids.length === 1 ? data.result[0] : data.result;
}

export async function getMetadata(model, idsArg) {
    const ids = Array.isArray(idsArg) ? idsArg : [idsArg];
    const metadataResponse = await fetch(
        new Request(`/web/dataset/call_kw/${model}/get_metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [ids],
                    kwargs: {},
                    model: model,
                    method: 'get_metadata',
                },
            }),
        })
    );

    const metadataData = await metadataResponse.json();

    if (metadataData.result?.length === 0) return undefined;
    if (metadataData.result === undefined) return undefined;

    return ids.length === 1 ? metadataData.result[0] : metadataData.result;
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

    if (data?.error || !data?.result) {
        throw new Error(data.error?.data?.message);
    }
    if (data?.result === true) {
        return true;
    }
    throw new Error(data?.result);
}

export function sanitizeVersion(version) {
    return `${version}`.replaceAll(/saas[~|-]/g, '');
}
