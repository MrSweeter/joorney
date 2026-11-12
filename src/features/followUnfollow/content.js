import ContentFeature from '../../generic/content.js';
import { escapeHTML, stringToHTML } from '../../html_generator.js';
import { t } from '../../utils/i18n.js';
import { sleep } from '../../utils/util.js';
import configuration from './configuration.js';

const buttonClass = "joorney_follow_unfollow_button"
const buttonLabelClass = "joorney_follow_unfollow_btn_label"
const mailFollowersButtonClass = "o-mail-Followers-button"

const followedIconClass = "fa-user"
const unfollowedIconClass = "fa-user-o"

const followLabel = () => t('followUnfollow_follow')
const unfollowLabel = () => t('followUnfollow_unfollow')
const followingLabel = () => t('followUnfollow_following')

export default class FollowUnfollowContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        this.handleButtonMutation = this.handleButtonMutation.bind(this);
        this.followButtonObserver = new MutationObserver(this.handleButtonMutation);
    }

    async loadFeature(url) { /* Nothing to load, document observer manage the logic */ }

    async onDocumentDOMChange(mutations) {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length && mutation.addedNodes[0].classList?.contains(mailFollowersButtonClass)) this.appendFollowButton();
        }
    }

    onMouseEnter(e) {
        const label = e.target.querySelector(`.${buttonLabelClass}`);
        label.classList.remove('text-warning');

        if (label.textContent.trim() === followingLabel()) label.classList.add('text-warning');
    }

    onMouseLeave(e) {
        const label = e.target.querySelector(`.${buttonLabelClass}`);
        label.classList.remove('text-warning');
    }

    async onClick(e, followed, userButton, icon) {
        const newClass = followed ? unfollowedIconClass : followedIconClass;
        icon.classList.remove(followedIconClass, unfollowedIconClass);
        icon.classList.add(newClass);

        userButton.click();
        await sleep(200);
        const actionButton = document.querySelector(`.o-mail-Followers-dropdown .${followed ? "o-mail-FollowerList-unfollowBtn" : "o-mail-FollowerList-followBtn"}`);
        actionButton.click();
        e.target.remove();
        this.appendFollowButton();
    }

    appendFollowButton() {
        for (const existing of document.querySelectorAll(`.${buttonClass}`))
            existing.remove();

        if (document.querySelector('.o-mail-Chatter-follow')) return;

        const mailFollowersButton = document.querySelector(`button.${mailFollowersButtonClass}`);
        const mailFollowersIcon = mailFollowersButton?.querySelector("i.fa");
        if (!mailFollowersIcon) return;

        const followed = mailFollowersIcon.classList.contains(followedIconClass);

        const followButton = stringToHTML(`<button class="${buttonClass} btn px-0 my-2 text-nowrap ${followed ? 'text-success' : ''}" title="${escapeHTML(followed ? unfollowLabel() : followLabel())}">
            <span class="${buttonLabelClass} border-bottom border-warning border-1">${escapeHTML(followed ? followingLabel() : followLabel())}</span>
        </button>`);

        followButton.addEventListener('mouseenter', this.onMouseEnter)
        followButton.addEventListener('mouseleave', this.onMouseLeave)
        followButton.onclick = (e) => this.onClick(e, followed, mailFollowersButton, mailFollowersIcon);

        mailFollowersButton.parentNode.parentNode.insertBefore(followButton, mailFollowersButton.nextSibling);

        this.followButtonObserver.disconnect();
        this.followButtonObserver.observe(mailFollowersIcon, { attributes: true, attributeFilter: ["class"] });
    }

    handleButtonMutation(mutations) {
        for (const mutation of mutations) {
            if (mutation.type === "attributes" && mutation.attributeName === "class") this.appendFollowButton();
        }
    }
}
