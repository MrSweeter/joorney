const smallLoadingID = 'odoo-qol-awesome-loading-small';

async function appendSmallLoadingToDOM(image) {
    const authorizedFeature = await authorizeFeature('awesomeLoadingSmall', window.location.origin);
    if (!authorizedFeature) return;

    const styleTemplate = document.createElement('template');
    styleTemplate.innerHTML = `
		<style name="${smallLoadingID}" type="text/css">
		
			.o_loading_indicator {

				content: url(${image});
				background-color: unset;

				/* Resize the image automatically */
				max-height: 46px;
			}
		</style>
	`.trim();

    document.documentElement.appendChild(styleTemplate.content.firstChild);
}

async function appendSmallLoading(url) {
    const exist = document.getElementsByName(smallLoadingID);
    if (exist.length > 0) return;
    if (!isOdooTab(url)) return;
    const { awesomeLoadingSmallEnabled, awesomeLoadingSmallImage } = await chrome.storage.sync.get({
        awesomeLoadingSmallEnabled: false,
        awesomeLoadingSmallImage: false,
    });

    if (awesomeLoadingSmallEnabled && awesomeLoadingSmallImage) {
        appendSmallLoadingToDOM(awesomeLoadingSmallImage, false);
    }
}

chrome.runtime.onMessage.addListener((msg) => {
    const img = msg.awesomeLoadingSmallImage;
    if (img || img === false) {
        const exist = Array.from(document.getElementsByName(smallLoadingID));
        if (exist) exist.forEach((e) => e.remove());
        if (img && isOdooTab(msg.url)) appendSmallLoadingToDOM(img);
    }
});
