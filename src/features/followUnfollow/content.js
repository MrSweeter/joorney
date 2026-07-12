import ContentFeature from '../../generic/content.js';
import { stringToHTML } from '../../html_generator.js';
import { sleep } from '../../utils/util.js';
import configuration from './configuration.js';

const buttonClass = "joorney_follow_unfollow_button"
const buttonLabelClass = "joorney_follow_unfollow_btn_label"
const mailFollowersButtonClass = "o-mail-Followers-button"

const followedIconClass = "fa-user"
const unfollowedIconClass = "fa-user-o"

const followLabel = "Follow"
const unfollowLabel = "Unfollow"
const followingLabel = "Following"

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

        if (label.textContent.trim() === followingLabel) {
            label.classList.add('text-warning');
            label.textContent = unfollowLabel;
        }
    }

    onMouseLeave(e) {
        const label = e.target.querySelector(`.${buttonLabelClass}`);
        label.classList.remove('text-warning');

        if (label.textContent.trim() === unfollowLabel) label.textContent = followingLabel;
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

        const followButton = stringToHTML(`<button class="${buttonClass} btn px-0 my-2 ${followed ? 'text-success' : ''}">
            <div class="position-relative">
                <span class="d-flex invisible text-nowrap">__________</span>
                <span class="${buttonLabelClass} position-absolute end-0 top-0 border-bottom border-warning border-1"> ${followed ? followingLabel : followLabel} </span>
            </div>
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
