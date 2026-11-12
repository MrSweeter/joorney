import { writeRecord } from '../../api/odoo.js';
import { SessionKey, getSessionData } from '../../api/session.js';
import {
    generateActionButton,
    generateActionIconButton,
    generateSimulatedValue,
    generateTrackingMessage,
    generateUserAvatarTag,
} from '../../html_generator.js';
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
// Cleanup key of every simulated node, see removeUserInUI
const SIMULATED_CLASS = 'joorney-simulated-ui-assignme';
const BUTTON_NAME = 'joorney_action_assign_to_me';

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
            //         inside the form statusbar: labelled button, elsewhere: icon button next to the input
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
        const exist = document.getElementsByName(BUTTON_NAME);
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

        const exist = Array.from(document.getElementsByName(BUTTON_NAME));
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
        const buttonContainer = document.querySelector(this.activeModel.button_parent_selector);
        if (!buttonContainer) return;

        const buttonProps = {
            name: BUTTON_NAME,
            label: t('assignMeTask_buttonLabel'),
            title: t('assignMeTask_buttonTitle'),
            icon: { fa: 'fa-user-plus', oi: 'person_add' },
        };
        const inHeader = buttonContainer.closest('.o_form_statusbar') !== null;
        if (inHeader) {
            const assignButton = generateActionButton(buttonProps);
            this.updateAssignMeEvent(assignButton);
            buttonContainer.appendChild(assignButton);
            return;
        }
        const assignButton = generateActionIconButton(buttonProps);
        this.updateAssignMeEvent(assignButton);
        const inputRow = buttonContainer.querySelector('.o_field_many2one_selection') ?? buttonContainer;
        inputRow.appendChild(assignButton);
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
                        for (const e of Array.from(document.getElementsByName(BUTTON_NAME))) e.remove();
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
        const userName = getSessionData(SessionKey.NAME) || this.getTopbarUserName();
        if (!userName || userName.length <= 0) return false;

        // Fake chat message
        const chatParent = document.querySelector('.o-mail-Chatter-content .o-mail-Thread')?.firstChild;
        if (!chatParent) return false;
        // Simulated messages reuse Odoo message markup inside their frame: skip them
        const previousElement = Array.from(chatParent.querySelectorAll('.o-mail-Message, .o-mail-DateSection')).find(
            (e) => !e.closest(`.${SIMULATED_CLASS}`)
        );
        if (!previousElement) return false;
        const messageElement = generateTrackingMessage({
            authorName: userName,
            newValue: userName,
            fieldName: t(this.activeModel.labelKey),
            avatarSrc,
            date: new Date(),
            isWarning,
            extraClass: SIMULATED_CLASS,
        });

        this.addUserTag(userName, avatarSrc);
        previousElement.before(messageElement);

        // Fake date element
        if (this.activeModel.date_field) this.addDateTag(new Date().toLocaleDateString());

        return true;
    }

    getTopbarUserName() {
        const topbarName = document.querySelector(
            '.o_user_avatar ~ .oe_topbar_name, .oe_topbar_avatar ~ .oe_topbar_name, .o_user_menu .oe_topbar_name'
        );
        // [ODOO] 17.0+ .oe_topbar_name also holds <mark>db name</mark>: keep its own text only
        return Array.from(topbarName?.childNodes ?? [])
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent)
            .join('')
            .trim();
    }

    addDateTag(date) {
        const fieldElement = document.getElementsByName(this.activeModel.date_field)?.[0];
        if (!fieldElement) return false;
        const dateElement = generateSimulatedValue(date, SIMULATED_CLASS);

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
        const tagElement = generateUserAvatarTag(username, avatarSrc, SIMULATED_CLASS);

        if (!this.activeModel.list) {
            for (const child of containerElement.children) this.hideForSimulation(child);
            const avatar = fieldElement.querySelector('.o-mail-Avatar');
            if (avatar) this.hideForSimulation(avatar);
        }
        containerElement.prepend(tagElement);
        return true;
    }

    removeUserInUI() {
        for (const element of document.querySelectorAll(`.${SIMULATED_CLASS}`)) {
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
