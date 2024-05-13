import { getDataset } from '../api/odoo.js';
import { ValueIsNaN } from './util.js';

export async function getCurrentUserID() {
    // TODO[IMP] IMPROVE, settings page field ? web request ?
    const avatarEl = document.getElementsByClassName('o_avatar o_user_avatar rounded')[0];
    if (!avatarEl) return undefined;
    const avatarURL = new URL(avatarEl.src);

    // pre 17.2
    const search = avatarURL.searchParams;
    if (search.has('id')) {
        const userID = Number.parseInt(search.get('id'));
        if (ValueIsNaN(userID)) return undefined;
        return userID;
    }
    // 17.2
    const partnerIDRegex = /res.partner\/(\d+)\//g;
    const partnerID = partnerIDRegex.exec(avatarURL)[1];

    const response = await getDataset('res.partner', [['id', '=', partnerID]], ['id', 'user_id', 'user_ids'], 1, 60);
    const partner = response;

    return partner.user_id ? partner.user_id[0] : partner.user_ids.length > 0 ? partner.user_ids[0] : undefined;
}
