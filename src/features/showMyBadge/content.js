import { getDataset, getDatasetWithID } from '../../api/odoo.js';
import ContentFeature from '../../generic/content.js';
import { createRecordFormURL } from '../../utils/url_manager.js';
import configuration from './configuration.js';

let overlayShowMyBadgeObserver = undefined;

export default class ShowMyBadgeContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        this.handleMutation = this.handleMutation.bind(this);
        overlayShowMyBadgeObserver?.disconnect();
        overlayShowMyBadgeObserver = new MutationObserver(this.handleMutation);
    }

    async loadFeature(url) {
        this.observe();
    }

    observe() {
        const overlays = document.getElementsByClassName('o-overlay-container');
        if (overlays.length !== 1) return;

        const overlayTarget = overlays[0];
        const observerOptions = { childList: true, subtree: true };
        overlayShowMyBadgeObserver.disconnect();
        overlayShowMyBadgeObserver.observe(overlayTarget, observerOptions);
    }

    handleMutation(mutations) {
        const avatarCardMutationNode = mutations
            .filter((m) => m.type === 'childList' && m.addedNodes?.length > 0)
            .flatMap((m) => Array.from(m.addedNodes))
            .find((n) => n.nodeName === 'DIV' && n.className.includes('o_avatar_card'));
        if (!avatarCardMutationNode) return;

        const emailNode = avatarCardMutationNode.querySelector('div.o_card_user_infos a[href^="mailto:"]');
        const email = emailNode.href.replace('mailto:', '');
        const name = avatarCardMutationNode.querySelector('div.o_card_user_infos span').innerText;
        if (email) this.appendBadges(avatarCardMutationNode, email, name);
    }

    async appendBadges(card, emailArg, nameArg) {
        const badges = await this.loadBadgesForUser(emailArg, nameArg);
        if (!badges) return;

        const infoNode = card.querySelector('div.o_card_user_infos')?.parentNode;
        if (!infoNode) return;

        const emailNode = card.querySelector('div.o_card_user_infos a[href^="mailto:"]');
        const email = emailNode.href.replace('mailto:', '');
        if (email !== emailArg) return;
        infoNode.after(this.getBadgesNode(badges));
    }

    async loadBadgesForUser(email, name) {
        const user = await getDataset(
            'res.users',
            [
                ['email', '=', email],
                ['name', '=', name],
            ],
            ['id', 'badge_ids'],
            1,
            60
        );
        const badgeIDs = user.badge_ids;
        if (!badgeIDs || badgeIDs.length === 0) return undefined;

        return await this.getBadges(badgeIDs);
    }

    async getBadges(ids) {
        const badges = await getDatasetWithID('gamification.badge.user', ids);
        const levelMapping = {
            bronze: 1,
            silver: 2,
            gold: 3,
        };
        for (const b of badges) {
            b.lvl = levelMapping[b.level] ?? 0;
        }
        return badges.sort((a, b) => b.lvl - a.lvl);
    }

    getBadgesNode(badges) {
        if (!badges || badges.length === 0) return;

        let badgesList = badges;
        let moreBadge = false;
        if (badgesList.length >= 8) {
            badgesList = badgesList.slice(0, 8);
            moreBadge = true;
        }

        const badgesHTML = badgesList.map((b) =>
            `<a href="${createRecordFormURL(
                window.location,
                'gamification.badge',
                b.badge_id[0]
            )}"><img class="rounded" title="${b.display_name || b.badge_name}\n${
                b.comment || ''
            }" style="height: 30px" src="https://${window.location.host}/web/image?model=gamification.badge&id=${
                b.badge_id[0]
            }&field=image_128"></a>`.trim()
        );

        if (moreBadge) {
            badgesHTML.push(
                `<i title="More..." style="height: 30px; opacity: 10%" class="d-flex align-items-center fa fa-2x fa-certificate"></i>`.trim()
            );
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <div class="d-flex mt-3 mb-3 gap-2 justify-content-end flex-wrap">
                ${badgesHTML.join('\n')}
            </div>
        `.trim();

        return template.content.firstChild;
    }
}
