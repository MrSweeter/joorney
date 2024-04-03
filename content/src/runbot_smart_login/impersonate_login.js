const hashes = ['#qol-auto-login', '#qol-autoopen-login'];

function loginWithForm(login) {
    document.getElementById('login').value = login;
    document.getElementById('password').value = login;
    const form = document.getElementsByClassName('oe_login_form')[0];
    form.setAttribute('onsubmit', "this.action = '/web/login?debug=1'");
    // form.submit() will not trigger "onsubmit"
    setTimeout(() => form.requestSubmit(), 250);
}

function isRunbotSelectorPageWithLogin(url) {
    return url.pathname === '/web/database/selector' && hashes.includes(url.hash);
}

function updateSelectorLink() {
    Array.from(document.querySelectorAll('div.list-group-item a')).forEach((e) => {
        e.href = getAdminDebugURL(e.href);
    });
}

async function checkAdminDebug(currentUrl) {
    const url = new URL(currentUrl);

    const authorizedAdminDebugFeature = await authorizeLimitedFeature(
        'adminDebugLoginRunbot',
        url.origin
    );

    const authorizedAutoOpenFeature = await authorizeLimitedFeature('autoOpenRunbot', url.origin);
    const authorized = authorizedAdminDebugFeature || authorizedAutoOpenFeature;

    if (authorized && isRunbotSelectorPageWithLogin(url)) {
        updateSelectorLink();
        return true;
    }

    if (authorized && hashes.includes(url.hash)) {
        // 16+
        let front_to_back_button = document.getElementsByClassName(
            'o_frontend_to_backend_apps_btn'
        );
        // < 16
        if (front_to_back_button.length == 0)
            front_to_back_button = document.getElementsByClassName('o_menu_toggle');
        if (front_to_back_button.length > 0) {
            window.location.href = `${window.location.origin}/web`;
            return;
        }

        loginWithForm('admin');
        return true;
    }
}

async function appendRunbotLogin(currentUrl) {
    const url = new URL(currentUrl);

    const authorizedFeature = await authorizeLimitedFeature('impersonateLoginRunbot', url.origin);
    if (!authorizedFeature) return;

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

    loginsElement = loginsTemplate.content.firstChild;

    Array.from(loginsElement.getElementsByTagName('button')).forEach((btn) => {
        btn.onclick = (e) => loginWithForm(e.target.dataset.login);
    });

    fieldLogin.before(loginsElement);
}
