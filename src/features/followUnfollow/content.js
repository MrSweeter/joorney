import ContentFeature from '../../generic/content.js';
import { stringToHTML } from '../../html_generator.js';
import { sleep } from '../../utils/util.js';
import configuration from './configuration.js';

const buttonClass = "joorney_follow_unfollow_button"
const buttonLabelClass = "joorney_follow_unfollow_btn_label"
const mailFollowersButtonClass = "o-mail-Followers-button"

// Odoo < 20: <i class="fa fa-user|fa-user-o"/>, Odoo 20+: <i class="oi [oi-filled]" data-icon="person"/>
const followedIconClass = "fa-user"
const unfollowedIconClass = "fa-user-o"
const followedOdooIconClass = "oi-filled"
const followersIconSelector = `i.${followedIconClass}, i.${unfollowedIconClass}, i.oi[data-icon="person"]`

const isOdooIcon = (icon) => icon.classList.contains("oi")
const isFollowedIcon = (icon) => icon.classList.contains(isOdooIcon(icon) ? followedOdooIconClass : followedIconClass)
function setFollowedIcon(icon, followed) {
    if (isOdooIcon(icon)) {
        icon.classList.toggle(followedOdooIconClass, followed);
        return;
    }
    icon.classList.remove(followedIconClass, unfollowedIconClass);
    icon.classList.add(followed ? followedIconClass : unfollowedIconClass);
}

const followLabel = "Follow"
const unfollowLabel = "Unfollow"
const followingLabel = "Following"

export default class FollowUnfollowContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
        this.handleButtonMutation = this.handleButtonMutation.bind(this);
        this.followButtonObserver = new MutationObserver(this.handleButtonMutation);
    }

    async loadFeature(url) {
        // The chatter may already be rendered when the feature loads
        this.appendFollowButton();
    }

    unload() {
        super.unload();
        this.followButtonObserver.disconnect();
    }

    async onDocumentDOMChange(mutations) {
        // The followers button can be added alone or inside a bigger subtree (Odoo 20 mounts the whole chatter at once)
        const selector = `button.${mailFollowersButtonClass}`;
        const hasFollowersButton = mutations.some((mutation) =>
            Array.from(mutation.addedNodes).some(
                (node) => node.nodeType === Node.ELEMENT_NODE && (node.matches(selector) || node.querySelector(selector))
            )
        );
        if (hasFollowersButton) this.appendFollowButton();
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
        setFollowedIcon(icon, !followed);

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
        const mailFollowersIcon = mailFollowersButton?.querySelector(followersIconSelector);
        if (!mailFollowersIcon) return;

        const followed = isFollowedIcon(mailFollowersIcon);

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
        if (this.unloadIfOrphaned()) return;
        for (const mutation of mutations) {
            if (mutation.type === "attributes" && mutation.attributeName === "class") this.appendFollowButton();
        }
    }
}
