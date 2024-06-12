import LimitedRunbotContentFeature from '../../shared/limited/runbot_content.js';
import { Console } from '../../utils/browser.js';
import configuration from './configuration.js';

export default class AdminDebugLoginRunbotContentFeature extends LimitedRunbotContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(url) {
        if (!this.isRunbotPage(url)) return;

        this.appendRunbotAdminDebugLogin();
    }

    async appendRunbotAdminDebugLogin() {
        const btnIdentifier = 'joorney-admin-debug-login-runbot';

        for (const e of document.getElementsByClassName(btnIdentifier)) e.remove();

        const signIn = Array.from(document.getElementsByClassName('fa fa-sign-in btn btn-info'));

        for (const btn of signIn) {
            if (!btn.href.includes('static/build')) {
                const newBtn = document.createElement('a');
                newBtn.className = `${btnIdentifier} fa fa-rocket btn btn-warning`;
                newBtn.style.color = '#444';
                newBtn.onclick = (e) => this.openEventRunbot(e, false);
                newBtn.onauxclick = (e) => this.openEventRunbot(e, true);
                newBtn.href = btn.href;
                newBtn.title = 'Open runbot as admin and with debug mode enabled';
                btn.after(newBtn);
            }
        }
    }

    async openEventRunbot(e, newTab) {
        e.preventDefault();
        try {
            await this.openRunbot(e.target.href, newTab);
        } catch (error) {
            Console.warn(error);
            e.target.classList.remove('btn-warning');
            e.target.classList.add('btn-danger');
            e.target.title = error;
        }
    }
}
