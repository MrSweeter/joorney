async function checkNewServerActionPage(currentUrl) {
    const url = new URL(currentUrl);
    if (url.searchParams.has('id')) return;

    const hash = url.hash;
    const idRegex = /([#&])(id=\d+)/;
    if (idRegex.test(hash)) return;
    if (!hash.includes('model=ir.actions.server')) return;
    if (!hash.includes('view_type=form')) return;

    const { newServerActionCodeEnabled } = await chrome.storage.sync.get({
        newServerActionCodeEnabled: false,
    });
    if (!newServerActionCodeEnabled) return;

    const authorizedFeature = await authorizeFeature('newServerActionCode', url.origin);
    if (!authorizedFeature) return undefined;

    selectExecuteCode();
}

function selectExecuteCode() {
    const badge = document.querySelector(`span.o_selection_badge[value='"code"']`);
    if (badge) {
        // Odoo 16.4+
        badge.click();
        return;
    }
    // Odoo < 16.4
    const codeOption = document.querySelector(`option[value='"code"']`);
    if (!codeOption) return;
    const selector = codeOption.parentElement;
    selector.value = codeOption.value;
    selector.dispatchEvent(new Event('change'));
}
