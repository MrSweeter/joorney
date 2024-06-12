import { writeRecord } from '../../api/odoo.js';
import { generateTrackingMessage, generateUserAvatarTag } from '../../html_generator.js';
import ProjectTaskShareContentFeature from '../../shared/projectTaskShare/content.js';
import { StorageSync } from '../../utils/browser.js';
import { getCurrentUserID } from '../../utils/user.js';
import configuration from './configuration.js';

const ASSIGN_TYPE = Object.freeze({
    RELOAD: 'reload',
    REDIRECT: 'redirect',
});

export default class AssignMeTaskContentFeature extends ProjectTaskShareContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeatureWithTask(task) {
        const currentUser = await this.tryCatch(() => getCurrentUserID(), undefined);
        if (!currentUser) return;
        const userAssigned = task.user_ids.includes(currentUser);

        const exist = document.getElementsByName('joorney_action_assign_to_me');
        // Avoid adding button if already added, remove it if user already assigned
        if (exist.length > 0) {
            if (userAssigned) for (const e of exist) e.remove();
            for (const e of exist) {
                this.updateAssignMeTaskEvent(e, task, currentUser);
                e.disabled = false;
            }
            return;
        }

        if (userAssigned) return;

        this.appendAssignMeTaskButtonToDom(task, currentUser);
    }

    preloadFeature() {
        const exist = document.getElementsByName('joorney_action_assign_to_me');
        for (const e of exist) e.disabled = true;
    }

    async addUserToTaskAssignees(task, userID, callback) {
        const taskID = await this.getProjectTaskID_fromURL(window.location.href);
        if (task.id !== taskID)
            throw new Error(`Button context is not the same as the url context: '${task.id}' vs '${taskID}'`);

        const newUsers = task.user_ids.concat(userID);

        const response = await writeRecord('project.task', task.id, { user_ids: newUsers });
        if (response) {
            switch (callback) {
                case ASSIGN_TYPE.RELOAD: {
                    const { useSimulatedUI } = await StorageSync.get({ useSimulatedUI: false });
                    if (useSimulatedUI) this.addUserInUI();
                    else window.location.reload();
                    break;
                }
                case ASSIGN_TYPE.REDIRECT: {
                    window.open(window.location.href);
                    break;
                }
            }
        }
    }

    addUserInUI() {
        const fakeDataTitle = `This element is not part of the original application; it was added artificially by Joorney.
If unsure, please reload the page!`;
        // Fake assigned element
        const fieldElement = document.getElementsByName('user_ids')?.[0];
        if (!fieldElement) return false;
        const containerElement = fieldElement
            .querySelector('.many2many_tags_avatar_field_container')
            ?.querySelector('.o_field_many2many_selection');
        if (!containerElement) return false;
        const avatarSrc = document.querySelector('.o_user_avatar, .oe_topbar_avatar')?.src;
        if (!avatarSrc || avatarSrc.length <= 0) return false;
        const userName = document.querySelector('.o_user_avatar ~ .oe_topbar_name, .oe_topbar_avatar ~ .oe_topbar_name')
            ?.firstChild?.nodeValue;
        if (!userName || userName.length <= 0) return false;
        const tagElement = generateUserAvatarTag(userName, avatarSrc);

        // Fake chat message
        const chatParent = document
            .querySelector('.o-mail-Chatter-content')
            ?.querySelector('.o-mail-Thread')?.firstChild;
        if (!chatParent) return false;
        const previousElement = chatParent.querySelector('.o-mail-Message, .o-mail-DateSection');
        if (!previousElement) return false;
        const messageElement = generateTrackingMessage(userName, userName, 'Assignees', avatarSrc, new Date());

        // Add Fake data warning
        tagElement.title = fakeDataTitle;
        messageElement.title = fakeDataTitle;

        containerElement.prepend(tagElement);
        previousElement.before(messageElement);
        return true;
    }

    appendAssignMeTaskButtonToDom(task, currentUser) {
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
            <button class="btn btn-warning" name="joorney_action_assign_to_me" type="object" title="Page will be reloaded, use wheel click to open in another tab">
                <span>Assign to me</span>
            </button>
        `.trim();

        const assignButton = buttonTemplate.content.firstChild;
        this.updateAssignMeTaskEvent(assignButton, task, currentUser);

        const statusBarButtons = document.getElementsByClassName('o_statusbar_buttons')[0];
        if (statusBarButtons) statusBarButtons.appendChild(assignButton);
    }

    updateAssignMeTaskEvent(btn, task, currentUser) {
        btn.onclick = () => {
            this.addUserToTaskAssignees(task, currentUser, ASSIGN_TYPE.RELOAD);
        };

        btn.onauxclick = () => {
            this.addUserToTaskAssignees(task, currentUser, ASSIGN_TYPE.REDIRECT);
        };
    }
}
