import { getMetadata } from '../../api/odoo.js';
import { isDebugSession } from '../../api/session.js';
import ContentFeature from '../../generic/content.js';
import { stringToHTML } from '../../html_generator.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { isDarkCookie } from '../../utils/cookies.js';
import { getActionWindow_fromURL, getModelAndID_fromURL } from '../../utils/url_manager.js';
import configuration from './configuration.js';

export default class TooltipMetadataContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(url) {
        if (!(await isStillSamePage(1000, url))) return;

        this.appendTooltipMetadata(url);
    }

    async appendTooltipMetadata(url) {
        const metadataContainer = document.getElementById('joorney-tooltip-metadata');
        if (metadataContainer) metadataContainer.remove();

        if (!isDebugSession()) return;

        await this.tryCatch(async () => {
            const model_id = await getModelAndID_fromURL(url);
            if (!model_id) {
                const actionWindow = await getActionWindow_fromURL(url);
                if (!actionWindow) return;
                this.appendModelToBreadcrumb(actionWindow.res_model);
                this.appendActionWindowTooltip(actionWindow);
                return;
            }

            this.appendModelToBreadcrumb(model_id.model);
            this.loadRecordMetadata(model_id);
        });
    }

    appendModelToBreadcrumb(model) {
        const spanID = 'joorney-technical-model';
        document.getElementById(spanID)?.remove();
        if (!model) return;

        const breadcrumbList = document.querySelector('ol.breadcrumb');
        const lastItem = document.querySelector('.o_last_breadcrumb_item');
        const container =
            (breadcrumbList ? lastItem?.parentElement ?? breadcrumbList : breadcrumbList) ??
            document.querySelector('.o_breadcrumb'); // ?? document.querySelector('.o_control_panel_navigation') no breadcrumb?
        if (!container) return;

        const element = stringToHTML(
            `<span id="${spanID}" style="align-content: center; margin-left: 4px; line-height: initial; font-style: italic; color: darkgoldenrod; cursor: copy" title="[Joorney] Copy technical name to clipboard" >(${model})</span>`
        );
        element.onclick = () => navigator.clipboard.writeText(model);
        container.appendChild(element);
    }

    async loadRecordMetadata(model_id) {
        const { resId, model } = model_id;
        if (!model || !resId) return;
        const metadata = await getMetadata(model, resId);
        this.appendRecordMetadataTooltip(metadata);
    }

    appendActionWindowTooltip(actionWindow) {
        this.appendTooltip([
            { label: 'Window Action ID', value: actionWindow.id },
            { label: 'XML ID', value: actionWindow.xmlid },
            { label: 'Name', value: actionWindow.name },
            { label: 'Model', value: actionWindow.res_model },
            {
                label: '[Filters] Domain',
                value: actionWindow.domain ? `${actionWindow.domain}`.trim() : false,
            },
            { label: '[Filters] Context', value: actionWindow.context?.trim() },
            { label: '[Filters] Limit', value: actionWindow.limit },
            { label: '[Filters] Filter', value: actionWindow.filter },
        ]);
    }

    appendRecordMetadataTooltip(metadata) {
        this.appendTooltip([
            { label: 'ID', value: metadata.id },
            { label: 'XML ID', value: metadata.xmlid },
            { label: 'No Update', value: metadata.noupdate },
            { label: 'Creation User', value: metadata.create_uid },
            { label: 'Creation Date', value: metadata.create_date },
            { label: 'Latest Modification by', value: metadata.write_uid },
            { label: 'Latest Modification Date', value: metadata.write_date },
        ]);
    }

    async appendTooltip(datas) {
        if (!datas || datas.length === 0) return;

        const metadataContainer = document.getElementById('joorney-tooltip-metadata');
        if (metadataContainer) metadataContainer.remove();

        const debugManager = document.querySelector('.o_debug_manager');
        if (!debugManager) return;

        const rows = datas.map((d) => `<tr><th>${d.label}:</th><td>${d.value}</td></tr>`.trim());
        const isDark = await isDarkCookie(window.location.origin);

        const template = document.createElement('template');
        template.innerHTML = `
            <div id="joorney-tooltip-metadata">
                <style>
                    #joorney-tooltip-metadata {
                        display: none;
                        position: absolute;
                        top: 100%;
                        z-index: 1050;
                        background-color: ${isDark ? '#262A36' : '#f9f9f9'};
                        color: ${isDark ? '#e4e4e4' : '#374151'};
                        width: max-content;
                        padding: 8px;
                        border: 1px solid rgba(252, 163, 17, 0.2);
                        border-radius: 0.5rem;
                        box-shadow: 0 0.125rem 0.25rem rgba(252, 163, 17, 0.075);
                        transform: translateX(-90%);
                    }
                    #joorney-tooltip-metadata th, #joorney-tooltip-metadata td {
                        padding-right: 50px;
                    }
                    #joorney-tooltip-metadata th:first-child {
                        width: 1%;
                        white-space: nowrap;
                    }

                    #joorney-tooltip-metadata td:last-child {
                        width: 100%;
                    }
                    .o_debug_manager:hover:not(:has(.dropdown.show)) #joorney-tooltip-metadata {
                        display: flex;
                    }
                    .o_debug_manager:hover:not(:has(.dropdown.show)) button {
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
}
