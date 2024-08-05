import { getDataset } from '../../api/odoo.js';
import { SessionKey, getSessionData } from '../../api/session.js';
import ContentFeature from '../../generic/content.js';
import { generateMessage, stringToHTML } from '../../html_generator.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { StorageSync } from '../../utils/browser.js';
import { getModelAndID_fromURL } from '../../utils/url_manager.js';
import configuration from './configuration.js';

let pinMessageChatterObserver = undefined;

export default class PinMessageContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        this.chatter = undefined;
        this.pins = [];
        this.url = null;
        this.handleChatterMutation = this.handleChatterMutation.bind(this);
        this.onPin = this.onPin.bind(this);
        this.selfAuthor = true;
        pinMessageChatterObserver?.disconnect();
        pinMessageChatterObserver = new MutationObserver(this.handleChatterMutation);
    }

    async onRequestCompleted(msg) {
        if (msg.status !== 200) return;
        this.onPin();
    }

    async loadFeature(url) {
        if (!(await isStillSamePage(2000, url))) return;
        this.url = url;
        this.chatter = document.querySelector('.o-mail-Form-chatter');
        if (!this.chatter) return;

        const { pinMessageSelfAuthorEnabled } = await StorageSync.get(this.defaultSettings);
        this.selfAuthor = pinMessageSelfAuthorEnabled;

        const model_id = await this.tryCatch(() => getModelAndID_fromURL(url), undefined);
        if (!model_id) return;

        this.observerChatter();

        this.appendPinButton();
        this.updatePinnedMessages();
    }

    async updatePinnedMessages() {
        if (!this.url) {
            this.pins = [];
        } else {
            this.pins = await this.getPinnedMessages(this.url);
        }
        this.appendPinnedToggle();
    }

    appendPinButton() {
        for (const msg of this.getPinnableMessages()) {
            this.appendPinButtonToMessage(msg);
        }
    }

    appendPinButtonToMessage(messageElement) {
        const starBtnIcon = messageElement.querySelector('i.fa-star, i.fa-star-o');
        if (!starBtnIcon) return;
        starBtnIcon.parentElement.title = 'Odoo: Mark as Todo | Joorney UI override: Pin';
        starBtnIcon.classList.add('fa-thumb-tack');
    }

    async onPin() {
        if (!this.chatter) return;
        this.updatePinnedMessages();
    }

    observerChatter() {
        if (!this.chatter) return;
        const target = this.chatter.querySelector('.o-mail-Thread');
        if (!target) return;
        const observerOptions = { childList: true, subtree: false };

        pinMessageChatterObserver.disconnect();
        pinMessageChatterObserver.observe(target.firstChild, observerOptions);
    }

    handleChatterMutation(mutations) {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') return;

            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.matches('.o-mail-Message')) {
                    if (node.querySelector('.o-mail-Message-bubble.border')) return;
                    this.appendPinButtonToMessage(node);
                }
            }
        }
    }

    getPinnableMessages() {
        const messages = Array.from(
            this.chatter.querySelectorAll(`div.o-mail-Message${this.selfAuthor ? '.o-selfAuthored' : ''}`)
        );
        return messages
            .filter((m) => !m.querySelector('.o-mail-Message-bubble.border'))
            .filter((m) => (m.querySelector('.o-mail-Message-body')?.innerHTML.trim() || '') !== '');
    }

    async getPinnedMessages(url) {
        const model_id = await this.tryCatch(() => getModelAndID_fromURL(url), undefined);
        if (!model_id) return [];

        const domain = [
            ['model', '=', model_id.model],
            ['res_id', '=', model_id.resId],
            ['body', '!=', false],
            ['body', '!=', ''],
            // Cannot be too much restrictive due to UI, hard to identify which message can be pinned
            //['message_type', 'not in', ['notification', 'auto_comment', 'user_notification']],
            //['subtype_id.internal', '=', true],
            ['starred_partner_ids', '!=', false],
        ];
        if (this.selfAuthor) {
            const uid = getSessionData(SessionKey.PARTNER_ID) || -1;
            domain.push(['starred_partner_ids', 'in', uid]);
        }

        const messages = await this.tryCatch(
            () => getDataset('mail.message', domain, ['id', 'body', 'author_id', 'create_date'], 50, 0),
            []
        );
        return messages;
    }

    appendPinnedToggle() {
        this.chatter.querySelector('#joorney-pin-message-toggle')?.remove();
        const threadOpened = this.chatter.querySelector('.joorney-pinned-mail-Thread') != null;
        this.chatter.querySelector('.joorney-pinned-mail-Thread')?.remove();
        if (this.pins.length === 0) return;
        const previous = this.chatter.querySelector('button.text-action');
        const btn = stringToHTML(`
            <button id="joorney-pin-message-toggle" class="btn btn-link text-action px-1 d-flex align-items-center my-2" aria-label="Show pinned message">
                <i class="fa fa-thumb-tack fa-lg me-1"></i>
                <sup>${this.pins.length}</sup>
            </button>
        `);
        btn.onclick = () => {
            const section = this.chatter.querySelector('.joorney-pinned-mail-Thread');
            if (section) section.remove();
            else this.appendPinnedSection();
        };
        previous.after(btn);
        if (threadOpened) this.appendPinnedSection();
    }

    appendPinnedSection() {
        const MAX_PIN = 5;
        const chatterContent = this.chatter.querySelector('div.o-mail-Chatter-content');
        if (!chatterContent) return;
        const pinsContainer = stringToHTML(`
            <div class="joorney-pinned-mail-Thread position-relative flex-grow-1 d-flex flex-column overflow-auto pb-4">
                <div class="d-flex align-items-center">
                    <hr class="flex-grow-1" />
                    <span class="p-3 fw-bold"> Pinned Messages <span class="text-muted opacity-75">[Joorney]</span></span>
                    <hr class="flex-grow-1" />
                </div>
                <div id="joorney-pinned-mail-list" class="px-3 d-flex flex-column position-relative flex-grow-1"></div>
            </div>
        `);
        const messageContainer = pinsContainer.querySelector('#joorney-pinned-mail-list');

        let pins = this.pins;
        let warning = '';
        if (pins.length > MAX_PIN) {
            warning = `...There are more than ${MAX_PIN} pinned messages! Only yours are displayed`;
            pins = this.pins.filter((pin) => pin.author_id[0] === getSessionData(SessionKey.PARTNER_ID));
            if (pins.length > MAX_PIN) {
                warning = `...You have more than ${MAX_PIN} pinned messages!`;
            }
        }

        for (const pin of pins.slice(0, Math.min(MAX_PIN, pins.length))) {
            messageContainer.appendChild(
                generateMessage(
                    pin.author_id[1],
                    this.getAuthorAvatar(pin.author_id[0]),
                    pin.body,
                    new Date(pin.create_date)
                )
            );
        }
        if (warning) {
            messageContainer.appendChild(
                stringToHTML(`
                <span class="position-sticky alert alert-warning d-flex cursor-pointer align-items-center py-2 m-0 px-4 top-0" role="button">
                    <span class="small">${warning}</span>
                </span>
            `)
            );
        }
        chatterContent.insertBefore(pinsContainer, chatterContent.querySelector('.o-mail-Thread'));
    }

    getAuthorAvatar(authorID) {
        return `${document.location.origin}/web/image?field=avatar_128&id=${authorID}&model=res.partner`;
    }
}
