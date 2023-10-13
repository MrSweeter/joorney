const hashVersionPrefix = '#qol-open-';
function isRunbotPageWithAutoOpenHash(urlStr) {
    const url = new URL(urlStr);
    return url.host === 'runbot.odoo.com' && url.hash.startsWith(hashVersionPrefix);
}

async function getRunbotPath(tabURL) {
    const urlVersion = tabURL.hash.replace(hashVersionPrefix, '');
    let openVersion = parseFloat(urlVersion).toFixed(1);
    if (isNaN(openVersion)) {
        openVersion = urlVersion;
    }

    const rows = document.getElementsByClassName('bundle_row');

    // FOR EACH VERSION ROW
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let version = row.querySelector('div.one_line a b').textContent.replace('saas-', '');
        if (version != openVersion) continue;

        let groups = Array.from(row.querySelectorAll('div.slot_button_group'));

        // FOR EACH SUBGROUP BUILD OF VERSION
        for (let j = 0; j < groups.length; j++) {
            let group = groups[j];
            let type = group.querySelector('a.slot_name span').textContent;
            if (type != 'enterprise') continue;

            let signInButtons = group.getElementsByClassName('fa fa-sign-in btn btn-info');
            let spinGearIcons = group.getElementsByClassName('fa-cog fa-spin');
            //let refreshingIcon = group.querySelector('span i.fa-refresh');

            // SIGN IN exist and runbot not in a refresh state
            if (signInButtons.length > 0 && spinGearIcons.length == 0 /*&& refreshingIcon*/) {
                return signInButtons.item(0).getAttribute('href');
            }
        }
    }
    return undefined;
}

async function autoOpenRunbot(urlStr) {
    const url = new URL(urlStr);

    const authorizedFeature = await authorizeLimitedFeature('autoOpenRunbot', url.origin);
    if (!authorizedFeature) return;

    const path = await getRunbotPath(url);
    await openRunbot('https://runbot.odoo.com/' + (path ?? ''), false);
}
