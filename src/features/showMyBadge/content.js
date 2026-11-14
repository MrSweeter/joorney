import { getDataset, getDatasetWithIDs } from '../../api/odoo.js';
import ContentFeature from '../../generic/content.js';
import { escapeHTML } from '../../html_generator.js';
import { createRecordFormURL } from '../../utils/url_manager.js';
import { waitForElement } from '../../utils/util.js';
import configuration from './configuration.js';

const MAX_BADGES = 8;

function badgeLabel(badge) {
    return badge.badge_name || badge.display_name || '';
}

export default class ShowMyBadgeContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        this.handleMutation = this.handleMutation.bind(this);
        this.overlayShowMyBadgeObserver = new MutationObserver(this.handleMutation);
        // card -> { email, section } already handled: every overlay mutation rescans the cards
        this.handledCards = new WeakMap();
    }

    async loadFeature(_) {
        await this.observe();
    }

    async observe() {
        // [ODOO] 18.0 the overlay container can be mounted after the page load
        const overlayTarget = await waitForElement('.o-overlay-container', 10000);
        if (!overlayTarget || this._unloaded) return;

        this.overlayTarget = overlayTarget;
        const observerOptions = { childList: true, subtree: true };
        this.overlayShowMyBadgeObserver.disconnect();
        this.overlayShowMyBadgeObserver.observe(this.overlayTarget, observerOptions);
    }

    unload() {
        super.unload();
        this.overlayShowMyBadgeObserver?.disconnect();
    }

    handleMutation(_mutations) {
        if (this.unloadIfOrphaned()) return;
        // Scan instead of matching the mutation shape: it differs by version (card added directly < 19,
        // infos filled after the store fetch in 19, card mounted already filled inside the popover in 20)
        for (const card of this.overlayTarget?.querySelectorAll('.o_avatar_card') ?? []) {
            const email = this.getCardEmail(card);
            if (!email) continue;
            const handled = this.handledCards.get(card);
            if (handled?.email === email) {
                // Odoo re-renders can drop foreign nodes: put the section back
                if (handled.section && !card.contains(handled.section)) this.placeSection(card, handled.section);
                continue;
            }

            // biome-ignore lint/performance/useDomNodeTextContent: the displayed name, without the hidden text of Odoo's DOM
            const name = card.querySelector('div.o_card_user_infos span')?.innerText;
            if (!name) continue;
            this.appendBadges(card, email, name);
        }
    }

    getCardEmail(card) {
        const emailNode = card.querySelector('div.o_card_user_infos a[href^="mailto:"]');
        return emailNode?.href.replace('mailto:', '');
    }

    async appendBadges(card, email, name) {
        const handled = { email, section: undefined };
        this.handledCards.set(card, handled);
        this.removeSection(card);

        const badges = await this.tryCatch(() => this.loadBadgesForUser(email, name), undefined);
        // The card may have switched to another user while loading
        if (this.handledCards.get(card) !== handled) return;
        if (!badges || badges.length === 0) return;

        handled.section = this.getBadgesNode(badges);
        this.placeSection(card, handled.section);
    }

    // Own footer appended to the card, never inside Odoo's (only rendered when a module fills it)
    placeSection(card, section) {
        card.append(section);
        // [ODOO] 18.0 Bootstrap 5.3 takes the footer padding from variables only defined on .card,
        // and the 18.0 avatar card is not a .card
        if (Number.parseFloat(getComputedStyle(section).paddingLeft) === 0) section.classList.add('px-3', 'py-2');
    }

    removeSection(card) {
        for (const el of card.querySelectorAll('.joorney-badge-container')) el.remove();
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
        let badgeIDs = user?.badge_ids;
        if (!badgeIDs) {
            const employee = await getDataset(
                'hr.employee.public',
                [
                    ['email', '=', email],
                    ['name', '=', name],
                ],
                ['id', 'badge_ids'],
                1,
                60
            );
            badgeIDs = employee?.badge_ids;
        }
        if (!badgeIDs || badgeIDs.length === 0) return undefined;

        return await this.getBadges(badgeIDs);
    }

    async getBadges(ids) {
        const badges = await getDatasetWithIDs('gamification.badge.user', ids, [
            'id',
            'level',
            'comment',
            'display_name',
            'badge_name',
            'badge_id',
        ]);
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
        const shownBadges = badges.slice(0, MAX_BADGES);
        const hiddenBadges = badges.slice(MAX_BADGES);

        const badgesHTML = shownBadges.map((b) => {
            const src = `/web/image?model=gamification.badge&id=${b.badge_id[0]}&field=image_128`;
            const title = escapeHTML(`${badgeLabel(b)}\n${b.comment || ''}`);
            const url = createRecordFormURL(window.location, 'gamification.badge', b.badge_id[0]);
            return `<a href="${url}"><img class="rounded" title="${title}" style="height: 30px" src="${src}"></a>`;
        });

        if (hiddenBadges.length > 0) {
            const title = escapeHTML(hiddenBadges.map(badgeLabel).join('\n'));
            badgesHTML.push(
                `<span title="${title}" class="badge rounded-pill bg-300 text-body fw-bold">+${hiddenBadges.length}</span>`
            );
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <div class="card-footer d-flex flex-column gap-3 rounded-bottom bg-100 joorney-badge-container">
                <div>
                    <span class="fw-bold">Badges</span>
                    <div class="d-flex flex-wrap align-items-center gap-2 mt-1">
                        ${badgesHTML.join('\n')}
                    </div>
                </div>
            </div>
        `.trim();

        return template.content.firstChild;
    }
}
