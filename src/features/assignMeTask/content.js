import { writeRecord } from '../../api/odoo.js';
import { SessionKey, getSessionData } from '../../api/session.js';
import { generateTrackingMessage, generateUserAvatarTag, stringToHTML } from '../../html_generator.js';
import RecordFormContentFeature from '../../shared/projectTaskShare/content.js';
import { ToastManager } from '../../toast/index.js';
import { StorageSync } from '../../utils/browser.js';
import configuration from './configuration.js';

const ASSIGN_TYPE = Object.freeze({
    RELOAD: 'reload',
    REDIRECT: 'redirect',
});
const fakeDataTitle = `This element is not part of the original application; it was added artificially by Joorney.
If unsure, please reload the page!`;

export default class AssignMeTaskContentFeature extends RecordFormContentFeature {
    constructor() {
        super(configuration, {
            // <model>: ['id', '<user field>', ...]
            'project.task': {
                list: true,
                user_field: 'user_ids',
                extra_fields: [],
                input_selector: '.many2many_tags_avatar_field_container .o_field_many2many_selection',
                button_parent_selector: '.o_statusbar_buttons'
            },
            'helpdesk.ticket': {
                user_field: 'user_id',
                extra_fields: [],
                input_selector: '.o_field_many2one_avatar_user .o_field_many2one_selection',
                button_parent_selector: '.o_statusbar_buttons'
            },
            'maintenance.equipment': {
                user_field: 'technician_user_id',
                date_field: 'assign_date',
                extra_fields: [],
                input_selector: '.o_many2one .o_field_many2one_selection',
                button_parent_selector: "div[name='technician_user_id']"
            },
        });
        this.activeModel = undefined
        this.activeRecord = undefined
        this.activeUser = undefined
    }

    preloadFeature() {
        const exist = document.getElementsByName('joorney_action_assign_to_me');
        for (const e of exist) e.disabled = true;
        this.removeUserInUI();
    }

    getUserField(record) {
        if (this.activeModel.list) return record[this.activeModel.user_field]
        return record[this.activeModel.user_field][0]
    }

    async loadFeatureWithRecord(model, record) {
        const user = await this.tryCatch(() => getSessionData(SessionKey.UID), undefined);
        if (!user) return;

        this.activeModel = {
            ...this.models[model],
            name: model
        }
        this.activeRecord = record
        this.activeUser = user

        const userField = this.getUserField(record)
        const userAssigned = this.activeModel.list ? userField.includes(user) : userField === user

        const exist = document.getElementsByName('joorney_action_assign_to_me');
        // Avoid adding button if already added, remove it if user already assigned
        if (exist.length > 0) {
            if (userAssigned) for (const e of exist) e.remove();
            for (const e of exist) {
                this.updateAssignMeEvent(e);
                e.disabled = false;
            }
        }
        if (userAssigned) return;

        this.appendAssignMeButtonToDom();
    }

    updateAssignMeEvent(btn)   {
        btn.onclick = () => this.addUserToRecord(ASSIGN_TYPE.RELOAD)
        btn.onauxclick = () => this.addUserToRecord(ASSIGN_TYPE.REDIRECT)
    }

    appendAssignMeButtonToDom()  {
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
            <button class="btn btn-warning" name="joorney_action_assign_to_me" type="object" title="Page will be reloaded, use wheel click to open in another tab">
                <span>Assign to me</span>
            </button>
        `.trim();

        const assignButton = buttonTemplate.content.firstChild;
        this.updateAssignMeEvent(assignButton);

        const buttonContainer = document.querySelector(this.activeModel.button_parent_selector);
        if (buttonContainer) buttonContainer.appendChild(assignButton)
    }

    async addUserToRecord(callback)    {
        // const recordID = await this.tryCatch(() => getModelAndID_fromURL(url, Object.keys(this.models), true), undefined)
        // if (recordID?.resId !== recordArg.id) throw new Error(`Button context is not the same as the url context: '${recordID?.resId}' vs '${recordArg.id}'`);

        const modelResId = await this.getRecord(window.location.href)
        if (this.activeModel.name !== modelResId.model || modelResId.resId !== this.activeRecord.id)  {
            throw new Error(`Button context is not the same as the url context: '${modelResId.resId}' vs '${this.activeRecord.id}'`);
        }
        const record = modelResId.record
        const userField = this.getUserField(record)

        // const missingAssigned = this.activeModel.list ? userField.filter((u) => !userFieldArg.includes(u)) : userField

        const userIds = this.activeModel.list ? this.getUserField(record).concat(this.activeUser) : this.activeUser
        const data = { [this.activeModel.user_field]: userIds }
        if (this.activeModel.date_field) data[this.activeModel.date_field] = new Date().toISOString()

        try {
            const response = await writeRecord(this.activeModel.name, record.id, data)
            if (response)   {
                switch (callback)   {
                    case ASSIGN_TYPE.RELOAD: {
                        for (const e of document.getElementsByName('joorney_action_assign_to_me')) e.remove();
                        const { useSimulatedUI } = await StorageSync.get({ useSimulatedUI: false });
                        if (useSimulatedUI) this.addUserInUI(true);
                        else window.location.reload();
                        break;
                    }
                    case ASSIGN_TYPE.REDIRECT: {
                        window.open(window.location.href);
                        break;
                    }
                }
            }
        } catch (err) {
            ToastManager.warn(this.configuration.id, 'An error occurred during record assignment', err.message);
        }
    }

    addUserInUI(isWarning) {
        // Fake assigned element
        const avatarSrc = document.querySelector('.o_user_avatar, .oe_topbar_avatar')?.src ?? document.querySelector('.o_user_menu img')?.src;
        if (!avatarSrc || avatarSrc.length <= 0) return false;
        const userName = document
            .querySelector('.o_user_avatar ~ .oe_topbar_name, .oe_topbar_avatar ~ .oe_topbar_name, .o_user_menu .oe_topbar_name')
            ?.textContent?.trim();
        if (!userName || userName.length <= 0) return false;

        // Fake chat message
        const chatParent = document.querySelector('.o-mail-Chatter-content .o-mail-Thread')?.firstChild;
        if (!chatParent) return false;
        const previousElement = chatParent.querySelector('.o-mail-Message, .o-mail-DateSection');
        if (!previousElement) return false;
        const messageElement = generateTrackingMessage(
            userName,
            userName,
            this.activeModel.user_field,
            avatarSrc,
            new Date(),
            isWarning
        );
        messageElement.title = fakeDataTitle;

        this.addUserTag(userName, avatarSrc);
        previousElement.before(messageElement);

        // Fake date element
        if (!this.activeModel.date_field) return true;
        this.addDateTag(new Date().toISOString().split("T")[0])

        return true;
    }

    addDateTag(date)    {
        const fieldElement = document.getElementsByName(this.activeModel.date_field)?.[0]
        if (!fieldElement) return false;
        const dateElement = stringToHTML(`<span class='joorney-simulated-ui-assignme' >${date}</span>`)
        dateElement.title = fakeDataTitle
        dateElement.classname = "position-absolute top-0 end-0 bottom-0 start-0 mx-n2 mt-n1 mb-n1 rounded border"
        dateElement.style.backgroundColor = 'rgba(255, 204, 0, 0.25)';

        fieldElement.replaceChildren(dateElement)
    }

    addUserTag(username, avatarSrc) {
        const fieldElement = document.getElementsByName(this.activeModel.user_field)?.[0];
        if (!fieldElement) return false;
        const containerElement = fieldElement.querySelector(this.activeModel.input_selector)
        if (!containerElement) return false;
        const tagElement = generateUserAvatarTag(username, avatarSrc);
        tagElement.title = fakeDataTitle;

        if (!this.activeModel.list) {
            containerElement.innerHTML = ''
            fieldElement.querySelector(".o-mail-Avatar")?.remove()
        }
        containerElement.prepend(tagElement);
    }

    removeUserInUI() {
        for (const element of document.getElementsByClassName('joorney-simulated-ui-assignme')) {
            element.remove();
        }
    }
}
