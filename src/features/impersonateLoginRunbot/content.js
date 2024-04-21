import LimitedRunbotContentFeature from '../../shared/limited/runbot_content.js';
import { StorageSync } from '../../utils/browser.js';
import { isAuthorizedLimitedFeature } from '../../utils/authorize.js';
import { sanitizeURL } from '../../utils/url_manager.js';
import adminDebugLoginConfiguration from '../adminDebugLoginRunbot/configuration.js';
import autoOpenRunbotConfiguration from '../autoOpenRunbot/configuration.js';
import configuration from './configuration.js';

export default class ImpersonateLoginRunbotContentFeature extends LimitedRunbotContentFeature {
    constructor() {
        super(configuration);
    }

    async load(urlArg) {
        const url = sanitizeURL(urlArg);

        if (!(await isAuthorizedLimitedFeature(this.configuration.id, url))) return;

        let autologin = false;
        if (
            (await isAuthorizedLimitedFeature(adminDebugLoginConfiguration.id, url)) ||
            (await isAuthorizedLimitedFeature(autoOpenRunbotConfiguration.id, url))
        ) {
            autologin = this.loginWithAdmin(url);
        }

        if (!autologin) {
            this.appendImpersonateLogin();
        }
    }

    async loadFeature(url) {
        const relatedConfiguration = await StorageSync.get({
            [adminDebugLoginConfiguration.id]:
                adminDebugLoginConfiguration.defaultSettings.adminDebugLoginRunbotEnabled,
            [autoOpenRunbotConfiguration.id]:
                autoOpenRunbotConfiguration.defaultSettings.autoOpenRunbotEnabled,
        });

        let autologin = false;
        if (
            relatedConfiguration[adminDebugLoginConfiguration.id] ||
            relatedConfiguration[autoOpenRunbotConfiguration.id]
        ) {
            autologin = await this.checkAdminDebug(url);
        }
    }

    async checkRelatedConfiguration() {
        const relatedConfiguration = await StorageSync.get({
            [adminDebugLoginConfiguration.id]:
                adminDebugLoginConfiguration.defaultSettings.adminDebugLoginRunbotEnabled,
            [autoOpenRunbotConfiguration.id]:
                autoOpenRunbotConfiguration.defaultSettings.autoOpenRunbotEnabled,
        });

        if (
            relatedConfiguration[adminDebugLoginConfiguration.id] ||
            relatedConfiguration[autoOpenRunbotConfiguration.id]
        ) {
            autologin = await this.checkAdminDebug(url);
        }
    }

    appendImpersonateLogin() {
        const fieldLogin = document.getElementsByClassName('field-login')[0];
        if (!fieldLogin) return;

        const loginsIdentifier = 'qol-impersonate-login-runbot';

        document.getElementById(loginsIdentifier)?.remove();

        const loginsTemplate = document.createElement('template');
        loginsTemplate.innerHTML = `
            <div id="${loginsIdentifier}" class="form-group mb-2 text-center">
                <div class="btn-group-sm d-flex justify-content-center">
                    <button type="button" class="btn btn-warning mx-1 flex-fill" data-login="admin" title="Login as admin">Admin</button>
                    <button type="button" class="btn btn-warning mx-1 flex-fill" data-login="demo" title="Login as demo">Demo</button>
                    <button type="button" class="btn btn-warning mx-1 flex-fill" data-login="portal" title="Login as portal">Portal</button>
                </div>
            </div>
        `.trim();

        const loginsElement = loginsTemplate.content.firstChild;

        Array.from(loginsElement.getElementsByTagName('button')).forEach((btn) => {
            btn.onclick = (e) => this.loginWithForm(e.target.dataset.login);
        });

        fieldLogin.before(loginsElement);
    }

    loginWithForm(login) {
        document.getElementById('login').value = login;
        document.getElementById('password').value = login;
        const form = document.getElementsByClassName('oe_login_form')[0];
        form.action += '?debug=1';
        form.submit();
    }

    updateSelectorLink() {
        Array.from(document.querySelectorAll('div.list-group-item a')).forEach((e) => {
            e.href = this.getAdminDebugURL(e.href);
        });
    }

    loginWithAdmin(url) {
        if (this.isRunbotSelectorPageWithLogin(url)) {
            this.updateSelectorLink();
            return true;
        }

        if (!this.getOpenData(url)) return false;

        // 16+
        let front_to_back_button = document.getElementsByClassName(
            'o_frontend_to_backend_apps_btn'
        );
        // < 16
        if (front_to_back_button.length == 0)
            front_to_back_button = document.getElementsByClassName('o_menu_toggle');
        if (front_to_back_button.length > 0) {
            window.location.href = `${window.location.origin}/web`;
            return true;
        }

        this.loginWithForm('admin');
        return true;
    }
}
