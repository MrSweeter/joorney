import { writeRecord } from '../../api/odoo.js';
import { SessionKey, getSessionData } from '../../api/session.js';
import { escapeHTML, generateTrackingMessage, generateUserAvatarTag, stringToHTML } from '../../html_generator.js';
import RecordFormContentFeature from '../../shared/projectTaskShare/content.js';
import { ToastManager } from '../../toast/index.js';
import { StorageSync } from '../../utils/browser.js';
import { t } from '../../utils/i18n.js';
import { toOdooBackendDate } from '../../utils/util.js';
import configuration from './configuration.js';

const SIMULATED_HIDDEN_ATTR = 'data-joorney-simulated-hidden';
const ASSIGN_TYPE = Object.freeze({
    RELOAD: 'reload',
    REDIRECT: 'redirect',
});
const fakeDataTitle = () => t('common_fakeDataTitle');

export default class AssignMeTaskContentFeature extends RecordFormContentFeature {
    constructor() {
        super(configuration, {
            // <model>: {
            //     list: bool, list of assignee or not
            //     user_field: field_name for assignee,
            //     labelKey: i18n key of the field label displayed in simulated tracking message,
            //     date_field: field_name for assignation date field
            //     extra_fields: field names to fetch with record
            //     input_selector: HTML Query Selector,
            //     button_parent_selector: HTML Query Selector,
            // }
            'project.task': {
                list: true,
                user_field: 'user_ids',
                labelKey: 'assignMeTask_label_assignees',
                input_selector: '.many2many_tags_avatar_field_container .o_field_many2many_selection',
                button_parent_selector: '.o_statusbar_buttons',
            },
            'helpdesk.ticket': {
                user_field: 'user_id',
                labelKey: 'assignMeTask_label_assignedTo',
                input_selector: '.o_field_many2one_avatar_user .o_field_many2one_selection',
                button_parent_selector: '.o_statusbar_buttons',
            },
            'maintenance.equipment': {
                user_field: 'technician_user_id',
                labelKey: 'assignMeTask_label_technician',
                date_field: 'assign_date',
                // [ODOO] 19.0+ wraps it in .o_many2one, < 19.0 has it directly in the field root
                input_selector: '.o_field_many2one_selection',
                button_parent_selector: "div[name='technician_user_id']",
            },
        });
        this.activeModel = undefined;
        this.activeRecord = undefined;
        this.activeUser = undefined;
    }

    preloadFeature() {
        const exist = document.getElementsByName('joorney_action_assign_to_me');
        for (const e of exist) e.disabled = true;
        this.removeUserInUI();
    }

    getUserField(record) {
        const value = record[this.activeModel.user_field];
        if (this.activeModel.list) return value;
        return value ? value[0] : false;
    }

    async loadFeatureWithRecord(model, record) {
        const user = await this.tryCatch(() => getSessionData(SessionKey.UID), undefined);
        if (!user) return;

        this.activeModel = {
            ...this.models[model],
            name: model,
        };
        this.activeRecord = record;
        this.activeUser = user;

        const userField = this.getUserField(record);
        const userAssigned = this.activeModel.list ? userField.includes(user) : userField === user;

        const exist = Array.from(document.getElementsByName('joorney_action_assign_to_me'));
        // Avoid adding button if already added, remove it if user already assigned
        if (exist.length > 0) {
            for (const e of exist) {
                if (userAssigned) {
                    e.remove();
                    continue;
                }
                this.updateAssignMeEvent(e);
                e.disabled = false;
            }
            return;
        }
        if (userAssigned) return;

        this.appendAssignMeButtonToDom();
    }

    updateAssignMeEvent(btn) {
        btn.onclick = () => this.addUserToRecord(ASSIGN_TYPE.RELOAD);
        btn.onauxclick = (e) => {
            // Middle click only, ignore right click
            if (e.button === 1) this.addUserToRecord(ASSIGN_TYPE.REDIRECT);
        };
    }

    appendAssignMeButtonToDom() {
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
            <button class="btn btn-warning" name="joorney_action_assign_to_me" type="object" title="${escapeHTML(t('assignMeTask_buttonTitle'))}">
                <span>${escapeHTML(t('assignMeTask_buttonLabel'))}</span>
            </button>
        `.trim();

        const assignButton = buttonTemplate.content.firstChild;
        this.updateAssignMeEvent(assignButton);

        const buttonContainer = document.querySelector(this.activeModel.button_parent_selector);
        if (buttonContainer) buttonContainer.appendChild(assignButton);
    }

    hasConcurrentAssignment(record) {
        const previous = this.getUserField(this.activeRecord);
        const current = this.getUserField(record);
        if (this.activeModel.list) return current.some((u) => !previous.includes(u));
        return current !== previous;
    }

    async addUserToRecord(callback) {
        try {
            const modelResId = await this.getRecord(window.location.href);
            if (this.activeModel.name !== modelResId?.model || modelResId?.resId !== this.activeRecord.id) {
                throw new Error(t('common_error_buttonContext', modelResId?.resId, this.activeRecord.id));
            }
            const record = modelResId.record;

            const userIds = this.activeModel.list ? this.getUserField(record).concat(this.activeUser) : this.activeUser;
            const data = { [this.activeModel.user_field]: userIds };
            if (this.activeModel.date_field) data[this.activeModel.date_field] = toOdooBackendDate(new Date());

            const response = await writeRecord(this.activeModel.name, record.id, data);
            if (response) {
                switch (callback) {
                    case ASSIGN_TYPE.RELOAD: {
                        for (const e of document.querySelectorAll('[name="joorney_action_assign_to_me"]')) e.remove();
                        const { useSimulatedUI } = await StorageSync.get({ useSimulatedUI: false });
                        if (useSimulatedUI) this.addUserInUI(!this.hasConcurrentAssignment(record));
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
            ToastManager.warn(this.configuration.id, t('assignMeTask_error_title'), err.message);
        }
    }

    addUserInUI(isWarning) {
        // Fake assigned element
        const avatarSrc =
            document.querySelector('.o_user_avatar, .oe_topbar_avatar')?.src ??
            document.querySelector('.o_user_menu img')?.src;
        if (!avatarSrc || avatarSrc.length <= 0) return false;
        const userName = document
            .querySelector(
                '.o_user_avatar ~ .oe_topbar_name, .oe_topbar_avatar ~ .oe_topbar_name, .o_user_menu .oe_topbar_name'
            )
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
            t(this.activeModel.labelKey),
            avatarSrc,
            new Date(),
            isWarning
        );
        messageElement.title = fakeDataTitle();

        this.addUserTag(userName, avatarSrc);
        previousElement.before(messageElement);

        // Fake date element
        if (this.activeModel.date_field) this.addDateTag(new Date().toLocaleDateString());

        return true;
    }

    addDateTag(date) {
        const fieldElement = document.getElementsByName(this.activeModel.date_field)?.[0];
        if (!fieldElement) return false;
        const dateElement = stringToHTML(`<span class="joorney-simulated-ui-assignme">${date}</span>`);
        dateElement.title = fakeDataTitle();
        dateElement.classList.add('rounded', 'border', 'px-1');
        dateElement.style.backgroundColor = 'rgba(255, 204, 0, 0.25)';

        for (const child of fieldElement.children) this.hideForSimulation(child);
        fieldElement.append(dateElement);
        return true;
    }

    addUserTag(username, avatarSrc) {
        const fieldElement = document.getElementsByName(this.activeModel.user_field)?.[0];
        if (!fieldElement) return false;
        // Single value field: when the input markup is unknown (other Odoo version), replace the whole field content
        const containerElement =
            fieldElement.querySelector(this.activeModel.input_selector) ??
            (this.activeModel.list ? null : fieldElement);
        if (!containerElement) return false;
        const tagElement = generateUserAvatarTag(username, avatarSrc);
        tagElement.title = fakeDataTitle();

        if (!this.activeModel.list) {
            for (const child of containerElement.children) this.hideForSimulation(child);
            const avatar = fieldElement.querySelector('.o-mail-Avatar');
            if (avatar) this.hideForSimulation(avatar);
        }
        containerElement.prepend(tagElement);
        return true;
    }

    removeUserInUI() {
        for (const element of document.querySelectorAll('.joorney-simulated-ui-assignme')) {
            element.remove();
        }
        for (const element of document.querySelectorAll(`[${SIMULATED_HIDDEN_ATTR}]`)) {
            element.style.removeProperty('display');
            element.removeAttribute(SIMULATED_HIDDEN_ATTR);
        }
    }

    // Odoo (OWL) owns the field DOM: removing its nodes leaves dangling refs that crash on the next render
    // (e.g. AutoComplete.onWillUpdateProps after pager navigation). Hide them instead, restored by removeUserInUI.
    // !important: Odoo field roots often use Bootstrap d-flex (display: flex !important), which beats inline display
    hideForSimulation(element) {
        element.style.setProperty('display', 'none', 'important');
        element.setAttribute(SIMULATED_HIDDEN_ATTR, '');
    }
}
