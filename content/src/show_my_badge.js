async function appendBadgesToUserCard(href) {
    const url = hrefFragmentToURLParameters(href);
    await new Promise((r) => setTimeout(r, 1000));

    const currentURL = hrefFragmentToURLParameters(window.location.href);
    if (currentURL.href !== url.href) return;

    const { showMyBadgeEnabled } = await chrome.storage.sync.get({
        showMyBadgeEnabled: false,
    });
    if (!showMyBadgeEnabled) return;

    const authorizedFeature = await authorizeFeature('showMyBadge', url.origin);
    if (!authorizedFeature) return undefined;

    observe();
}

const overlayObserver = new MutationObserver((mutations) => {
    let avatarCardMutationNode = mutations
        .filter((m) => m.type === 'childList' && m.addedNodes?.length > 0)
        .flatMap((m) => Array.from(m.addedNodes))
        .find((n) => n.nodeName === 'DIV' && n.className.includes('o_avatar_card'));
    if (!avatarCardMutationNode) return;

    const emailNode = avatarCardMutationNode.querySelector(
        'div.o_card_user_infos a[href^="mailto:"]'
    );
    const email = emailNode.href.replace('mailto:', '');
    const name = avatarCardMutationNode.querySelector('div.o_card_user_infos span').innerText;
    if (email) appendBadges(avatarCardMutationNode, email, name);
});

async function appendBadges(card, emailArg, nameArg) {
    const badges = await loadBadgesForUser(emailArg, nameArg);
    if (!badges) return;

    const infoNode = card.querySelector('div.o_card_user_infos')?.parentNode;
    if (!infoNode) return;

    const emailNode = card.querySelector('div.o_card_user_infos a[href^="mailto:"]');
    const email = emailNode.href.replace('mailto:', '');
    if (email !== emailArg) return;
    infoNode.after(getBadgesNode(badges));
}

function observe() {
    let overlays = document.getElementsByClassName('o-overlay-container');
    if (overlays.length !== 1) return;

    const overlayTarget = overlays[0];
    const observerOptions = { childList: true, subtree: true };
    overlayObserver.disconnect();
    overlayObserver.observe(overlayTarget, observerOptions);
}

async function loadBadgesForUser(email, name) {
    const userBadgesResponse = await fetch(
        new Request(`/web/dataset/call_kw/res.users/search_read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [],
                    kwargs: {
                        domain: [
                            ['email', '=', email],
                            ['name', '=', name],
                        ],
                        fields: ['id', 'badge_ids'],
                    },
                    model: 'res.users',
                    method: 'search_read',
                },
            }),
        })
    );

    const userBadgesData = await userBadgesResponse.json();

    if (userBadgesData.result === undefined) return undefined;
    if (userBadgesData.result.length !== 1) return undefined;
    const badge_ids = userBadgesData.result[0].badge_ids;

    if (!badge_ids || badge_ids.length === 0) return undefined;

    return await getBadges(badge_ids);
}

// TODO CACHES
async function getBadges(ids) {
    ids = Array.isArray(ids) ? ids : [ids];
    const userBadgesResponse = await fetch(
        new Request(`/web/dataset/call_kw/gamification.badge.user/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [ids],
                    kwargs: {},
                    model: 'gamification.badge.user',
                    method: 'read',
                },
            }),
        })
    );

    const userBadgesData = await userBadgesResponse.json();

    if (userBadgesData.result?.length === 0) return undefined;
    if (userBadgesData.result === undefined) return undefined;

    return userBadgesData.result;
}

function getBadgesNode(badges) {
    if (!badges || badges.length === 0) return;

    const badgesHTML = badges
        .map((b) =>
            `<img class="rounded" title="${b.display_name || b.badge_name}\n${
                b.comment || ''
            }" style="height: 30px" src="https://${
                window.location.host
            }/web/image?model=gamification.badge&id=${b.badge_id[0]}&field=image_128">`.trim()
        )
        .join('\n');

    const template = document.createElement('template');
    template.innerHTML = `
        <div class="d-flex mt-3 mb-3 gap-2 justify-content-end flex-wrap">
            ${badgesHTML}
		</div>
	`.trim();

    return template.content.firstChild;
}
