async function appendTooltipMetadata(href) {
    const url = hrefFragmentToURLParameters(href);
    await new Promise((r) => setTimeout(r, 1000));

    metadataContainer = document.getElementById('odoo-qol-tooltip-metadata');
    if (metadataContainer) metadataContainer.remove();

    const debugManager = document.querySelector('.o_debug_manager');
    if (!debugManager) return;

    const currentURL = hrefFragmentToURLParameters(window.location.href);
    if (currentURL.href !== url.href) return;

    const { tooltipMetadataEnabled } = await chrome.storage.sync.get({
        tooltipMetadataEnabled: false,
    });
    if (!tooltipMetadataEnabled) return;

    const authorizedFeature = await authorizeFeature('tooltipMetadata', url.origin);
    if (!authorizedFeature) return undefined;

    const model_id = await getModelAndID_fromURL(url);
    if (!model_id) {
        const actionWindow = await getActionWindow_fromURL(url);
        if (!actionWindow) return;
        appendActionWindowTooltip(actionWindow);
        return;
    }
    loadRecordMetadata(model_id);
}

async function loadRecordMetadata(model_id) {
    const { id, model } = model_id;
    const metadata = await getMetadata(model, id);
    appendRecordMetadataTooltip(metadata);
}

async function getMetadata(model, ids) {
    ids = Array.isArray(ids) ? ids : [ids];
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

    return ids.length === 1 && metadataData.result?.length === 1
        ? metadataData.result[0]
        : metadataData.result;
}

function appendActionWindowTooltip(actionWindow) {
    appendTooltip([
        { label: 'ID', value: actionWindow.id },
        { label: 'XML ID', value: actionWindow.xmlid },
        { label: 'Name', value: actionWindow.name },
        { label: 'Model', value: actionWindow.res_model },
        { label: '[Filters] Domain', value: actionWindow.domain.trim() },
        { label: '[Filters] Context', value: actionWindow.context.trim() },
        { label: '[Filters] Limit', value: actionWindow.limit },
        { label: '[Filters] Filter', value: actionWindow.filter },
    ]);
}

function appendRecordMetadataTooltip(metadata) {
    appendTooltip([
        { label: 'ID', value: metadata.id },
        { label: 'XML ID', value: metadata.xmlid },
        { label: 'No Update', value: metadata.noupdate },
        { label: 'Creation User', value: metadata.create_uid },
        { label: 'Creation Date', value: metadata.create_date },
        { label: 'Latest Modification by', value: metadata.write_uid },
        { label: 'Latest Modification Date', value: metadata.write_date },
    ]);
}

function appendTooltip(datas) {
    if (!datas || datas.length === 0) return;

    const metadataContainer = document.getElementById('odoo-qol-tooltip-metadata');
    if (metadataContainer) metadataContainer.remove();

    const debugManager = document.querySelector('.o_debug_manager');
    if (!debugManager) return;

    const rows = datas.map((d) => `<tr><th>${d.label}:</th><td>${d.value}</td></tr>`.trim());

    const template = document.createElement('template');
    template.innerHTML = `
		<div id="odoo-qol-tooltip-metadata">
            <style>
                #odoo-qol-tooltip-metadata {
                    display: none;
                    position: absolute;
                    top: 100%;
                    z-index: 10;
                    background-color: #f9f9f9;
                    color: #374151;
                    width: max-content;
                    padding: 8px;
                    border: 1px solid rgba(252, 163, 17, 0.2);
                    border-radius: 0.5rem;
                    box-shadow: 0 0.125rem 0.25rem rgba(252, 163, 17, 0.075);
                    transform: translateX(-10%);
                }
                #odoo-qol-tooltip-metadata th, #odoo-qol-tooltip-metadata td {
                    padding-right: 50px;
                }
                #odoo-qol-tooltip-metadata th:first-child {
                    width: 1%;
                    white-space: nowrap;
                }

                #odoo-qol-tooltip-metadata td:last-child {
                    width: 100%;
                }
                .o_debug_manager:hover #odoo-qol-tooltip-metadata {
                    display: flex;
                }
                .o_debug_manager:hover button {
                    border-color: rgba(252, 163, 17, 1) !important
                }
            </style>
            <table class="table table-sm table-striped" style="max-width: 600px; width: 100%">
                ${rows.join('\n')}
            </table>
		</div>
	`.trim();
    debugManager.appendChild(template.content.firstChild);
    debugManager.style.position = 'relative';
}
