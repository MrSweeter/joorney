function loginWithForm(login) {
    document.getElementById('login').value = login;
    document.getElementById('password').value = login;
    document.getElementsByClassName('oe_login_form')[0].submit();
}

function isRunbotSelectorPageWithLogin(url) {
    return url.pathname === '/web/database/selector' && url.hash === '#qol-auto-login';
}

function updateSelectorLink() {
    Array.from(document.querySelectorAll('div.list-group-item a')).forEach((e) => {
        e.href = getAdminDebugURL(e.href);
    });
}

async function checkAdminDebug(currentUrl) {
    const url = new URL(currentUrl);

    const authorizedSideFeature = await authorizeLimitedFeature(
        'adminDebugLoginRunbot',
        url.origin
    );

    if (authorizedSideFeature && isRunbotSelectorPageWithLogin(url)) {
        updateSelectorLink();
        return true;
    }

    if (authorizedSideFeature && url.hash === '#qol-auto-login') {
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
                <button class="btn btn-warning mx-1 flex-fill" data-login="admin" title="Login as admin">Admin</button>
                <button class="btn btn-warning mx-1 flex-fill" data-login="demo" title="Login as demo">Demo</button>
                <button class="btn btn-warning mx-1 flex-fill" data-login="portal" title="Login as portal">Portal</button>
            </div>
        </div>
    `.trim();

    loginsElement = loginsTemplate.content.firstChild;

    Array.from(loginsElement.getElementsByTagName('button')).forEach((btn) => {
        btn.onclick = (e) => loginWithForm(e.target.dataset.login);
    });

    fieldLogin.before(loginsElement);
}
