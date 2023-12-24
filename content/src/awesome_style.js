const awesomeStyleID = 'odoo-qol-awesome-style';

async function appendAwesomeStyleToDOM(css) {
    const authorizedFeature = await authorizeFeature('awesomeStyle', window.location.origin);
    if (!authorizedFeature) return;

    const styleTemplate = document.createElement('template');
    styleTemplate.innerHTML = `
		<style name="${awesomeStyleID}" type="text/css">
			${css}
		</style>
	`.trim();

    document.documentElement.appendChild(styleTemplate.content.firstChild);
}

async function appendAwesomeStyle(url) {
    const exist = document.getElementsByName(awesomeStyleID);
    if (exist.length > 0) return;
    if (!isOdooTab(url)) return;
    const { awesomeStyleEnabled, awesomeStyleCSS } = await chrome.storage.sync.get({
        awesomeStyleEnabled: false,
        awesomeStyleCSS: '',
    });

    if (awesomeStyleEnabled && awesomeStyleCSS) {
        appendAwesomeStyleToDOM(awesomeStyleCSS);
    }
}

chrome.runtime.onMessage.addListener((msg) => {
    const css = msg.enableAwesomeStyle;

    if (typeof css === 'boolean') {
        const exist = Array.from(document.getElementsByName(awesomeStyleID));
        if (exist) exist.forEach((e) => e.remove());
        if (css && isOdooTab(msg.url)) appendAwesomeStyle(msg.url);
    }
});
