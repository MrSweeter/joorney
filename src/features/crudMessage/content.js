import ContentFeature from '../../generic/content.js';
import { stringToHTML } from '../../html_generator.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { getModelAndID_fromURL } from '../../utils/url_manager.js';
import configuration from './configuration.js';

let crudMessageChatterObserver = undefined;
const ignore_message_with_selector = ['.o-mail-Message-bubble.o-green', '.o-mail-Message-bubble.o-blue'];

export default class CrudMessageContentFeature extends ContentFeature {
    constructor() {
        console.log(configuration);
        super(configuration);
        this.chatter = undefined;
        this.url = null;
        this.onMessageUpdate = this.onMessageUpdate.bind(this);
        this.getRemovedMessage = this.getRemovedMessage.bind(this);
        this.getEditedMessage = this.getEditedMessage.bind(this);
        this.handleChatterMutation = this.handleChatterMutation.bind(this);
        crudMessageChatterObserver?.disconnect();
        crudMessageChatterObserver = new MutationObserver(this.handleChatterMutation);
    }

    async onRequestCompleted(msg) {
        if (msg.status !== 200) return;
        if (!this.chatter) return;
        this.onMessageUpdate();
    }

    async loadFeature(url) {
        if (!(await isStillSamePage(2000, url))) return;
        this.url = url;

        await this.loadFormChatter();
        // const loaded = await this.loadFormChatter();
        // if (!loaded) this.loadDiscussChatter();
    }

    async loadDiscussChatter() {
        // const discussChatter = document.querySelector('.o-mail-Discuss-content');
        // return this.loadChatter(discussChatter, false);
    }

    async loadFormChatter() {
        const formChatter = document.querySelector('.o-mail-Form-chatter');
        const state = await this.loadChatter(formChatter, true);
        return state;
    }

    async loadChatter(chatter, checkModel) {
        this.chatter = chatter;
        if (!this.chatter) return false;

        if (checkModel) {
            const model_id = await this.tryCatch(() => getModelAndID_fromURL(this.url), undefined);
            if (!model_id) return false;
        }

        this.observerChatter();
        this.onMessageUpdate();
        return true;
    }

    onMessageUpdate() {
        for (const removedMessage of this.getRemovedMessage()) {
            this.appendCleanButtonToMessage(removedMessage, 'deletion');
        }
        for (const editedMessage of this.getEditedMessage()) {
            this.appendCleanButtonToMessage(editedMessage, 'edition');
        }
    }

    observerChatter() {
        if (!this.chatter) return;
        const target = this.chatter.querySelector('.o-mail-Thread');
        if (!target) return;
        const observerOptions = { childList: true, subtree: false };

        crudMessageChatterObserver.disconnect();
        crudMessageChatterObserver.observe(target.firstChild, observerOptions);
    }

    handleChatterMutation(mutations) {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') return;

            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.matches('.o-mail-Message')) {
                    if (ignore_message_with_selector.some((s) => node.querySelector(s))) return;
                    this.appendCleanButtonToMessage(
                        node,
                        node.querySelector('i.text-muted.opacity-75') ? 'deletion' : 'edition'
                    );
                }
            }
        }
    }

    getRemovedMessage() {
        // <i class="text-muted opacity-75">This message has been removed</i>
        const messages = Array.from(this.chatter.querySelectorAll('div.o-mail-Message:has(i.text-muted.opacity-75)'));
        return messages
            .filter((m) => ignore_message_with_selector.every((s) => !m.querySelector(s)))
            .filter((m) => (m.querySelector('.o-mail-Message-body')?.innerHTML.trim() || '') !== '');
    }

    getEditedMessage() {
        // <em class="smaller fw-bold text-500"> (edited)</em>
        const messages = Array.from(
            this.chatter.querySelectorAll('div.o-mail-Message:has(em.smaller.fw-bold.text-500)')
        );
        return messages
            .filter((m) => ignore_message_with_selector.every((s) => !m.querySelector(s)))
            .filter((m) => (m.querySelector('.o-mail-Message-body')?.innerHTML.trim() || '') !== '');
    }

    appendCleanButtonToMessage(messageElement, type) {
        const actions = messageElement.querySelector('.o-mail-Message-actions div');
        messageElement.querySelector('.joorney-crudMessage')?.remove();
        if (!actions) return;

        const icon = type === 'deletion' ? 'bomb' : 'bomb';
        const label = type === 'deletion' ? 'Hard Delete' : 'Clean';
        const color = type === 'deletion' ? 'danger' : 'warning';

        const cleanMenuItem = stringToHTML(
            `<button
                class="joorney-crudMessage btn border-0 px-1 py-0 rounded-0 text-${color}"
                title="${label}"
                aria-label="${label}"
            >
                <i class="fa-lg fa fa-${icon}"></i>
            </button>`
        );
        cleanMenuItem.onclick = () => {
            // TODO Find a way to update content
            console.log('HARD DELETE');
        };
        const previousAction = actions.querySelector('button:last-of-type');
        previousAction.after(cleanMenuItem);
    }
}
