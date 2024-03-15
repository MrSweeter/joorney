async function appendTooltipMetadata(href) {
    const url = hrefFragmentToURLParameters(href);
    await new Promise((r) => setTimeout(r, 1000));

    metadataContainer = document.getElementById('odoo-qol-tooltip-metadata');
    if (metadataContainer) metadataContainer.remove();

    const debugManager = document.querySelector('.o_debug_manager');
    if (!debugManager) return;

    const currentURL = hrefFragmentToURLParameters(window.location.href);
    if (currentURL.href !== url.href) return;

    const model_id = await getModelAndID_fromURL(url);
    if (!model_id) return;
    const { id, model } = model_id;

    const { tooltipMetadataEnabled } = await chrome.storage.sync.get({
        tooltipMetadataEnabled: false,
    });
    if (!tooltipMetadataEnabled) return;

    const authorizedFeature = await authorizeFeature('tooltipMetadata', url.origin);
    if (!authorizedFeature) return undefined;

    const metadata = await getMetadata(model, id);
    appendTooltip(metadata);
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

function appendTooltip(metadata) {
    const metadataContainer = document.getElementById('odoo-qol-tooltip-metadata');
    if (metadataContainer) metadataContainer.remove();

    const debugManager = document.querySelector('.o_debug_manager');
    if (!debugManager) return;

    if (!metadata) return;

    const template = document.createElement('template');
    template.innerHTML = `
		<div id="odoo-qol-tooltip-metadata">
			<style>
				#odoo-qol-tooltip-metadata {
                    display: none;
                    position: absolute;
                    top: 125%;
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
				.o_debug_manager:hover #odoo-qol-tooltip-metadata {
                    display: flex;
				}
                .o_debug_manager:hover button {
                    border-color: rgba(252, 163, 17, 1) !important
                }
			</style>
            <table class="table table-sm table-striped">
                <tr>
                    <th>ID:</th>
                    <td>${metadata.id}</td>
                </tr>
                <tr>
                    <th>XML ID:</th>
                    <td>${metadata.xmlid}</td>
                </tr>
                <tr>
                    <th>No Update:</th>
                    <td>${metadata.noupdate}</td>
                </tr>
                <tr>
                    <th>Creation User:</th>
                    <td>${metadata.create_uid}</td>
                </tr>
                <tr>
                    <th>Creation Date:</th>
                    <td>${metadata.create_date}</td>
                </tr>
                <tr>
                    <th>Latest Modification by:</th>
                    <td>${metadata.write_uid}</td>
                </tr>
                <tr>
                    <th>Latest Modification Date:</th>
                    <td>${metadata.write_date}</td>
                </tr>
            </table>
		</div>
	`.trim();
    debugManager.appendChild(template.content.firstChild);
    debugManager.style.position = 'relative';
}
