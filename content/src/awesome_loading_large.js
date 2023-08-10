const largeLoadingID = 'odoo-qol-awesome-loading-large';

async function appendLargeLoadingToDOM(image) {
    const authorizedFeature = await authorizeFeature('awesomeLoadingLarge', window.location.origin);
    if (!authorizedFeature) return;

    const styleTemplate = document.createElement('template');
    styleTemplate.innerHTML = `
		<style name="${largeLoadingID}" type="text/css">

			.o_spinner > img[src^="/web/static/img/spin."]:first-child,
			.oe_blockui_spin > img[src="/web/static/src/img/spin.png"]:first-child {

				content: url(${image});

				/* Resize the image automatically */
				max-height: 46px;

				/* Remove the spinning animation */
				if spin {
					animation: fa-spin 1s infinite linear !important;
				} else {
					animation: none !important;
				}
			}

			/* Use same backdrop effect as Odoo 16 (slightly less blurred) */
			.o_blockUI, .blockUI.blockOverlay {
				backdrop-filter: blur(1px);
				background-color: rgba(0, 0, 0, 0.5) !important;
				opacity: 1;
			}
			
		</style>
	`.trim();

    document.documentElement.appendChild(styleTemplate.content.firstChild);
}

async function appendLargeLoading(url) {
    const exist = document.getElementsByName(largeLoadingID);
    if (exist.length > 0) return;
    if (!isOdooTab(url)) return;
    const { awesomeLoadingLargeEnabled, awesomeLoadingLargeImage } = await chrome.storage.sync.get({
        awesomeLoadingLargeEnabled: false,
        awesomeLoadingLargeImage: false,
    });

    if (awesomeLoadingLargeEnabled && awesomeLoadingLargeImage) {
        appendLargeLoadingToDOM(awesomeLoadingLargeImage);
    }
}

chrome.runtime.onMessage.addListener((msg) => {
    const img = msg.awesomeLoadingLargeImage;
    if (typeof img === 'string' || img === false) {
        const exist = Array.from(document.getElementsByName(largeLoadingID));
        if (exist) exist.forEach((e) => e.remove());
        if (img && isOdooTab(msg.url)) appendLargeLoadingToDOM(img);
    }
});
