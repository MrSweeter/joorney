export async function getCurrentUserID() {
    // TODO[IMP] IMPROVE, settings page field ? web request ?
    const avatarEl = document.getElementsByClassName('o_avatar o_user_avatar rounded')[0];
    if (!avatarEl) return undefined;
    const avatarURL = new URL(avatarEl.src);

    // pre 17.2
    const search = avatarURL.searchParams;
    if (search.has('id')) {
        const userID = parseInt(search.get('id'));
        if (isNaN(userID)) return undefined;
        return userID;
    }
    // 17.2
    const partnerIDRegex = /res.partner\/(\d+)\//g;
    const partnerID = partnerIDRegex.exec(avatarURL)[1];
    const partnerResponse = await fetch(
        new Request(`/web/dataset/call_kw/res.partner/search_read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    args: [],
                    kwargs: {
                        context: { lang: 'en_US' },
                        fields: ['id', 'user_id', 'user_ids'],
                        domain: [['id', '=', partnerID]],
                        limit: 1,
                    },
                    model: 'res.partner',
                    method: 'search_read',
                },
            }),
        })
    );

    const partnerData = await partnerResponse.json();

    if (partnerData.result?.length === 0) return undefined;
    if (partnerData.result === undefined) return undefined;

    const partner = partnerData.result[0];

    return partner.user_id
        ? partner.user_id[0]
        : partner.user_ids.length > 0
        ? partner.user_ids[0]
        : undefined;
}
