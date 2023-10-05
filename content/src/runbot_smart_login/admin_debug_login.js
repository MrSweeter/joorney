async function appendRunbotAdminDebugLogin(currentUrl) {
    const url = new URL(currentUrl);
    const authorizedFeature = await authorizeLimitedFeature('adminDebugLoginRunbot', url.origin);
    if (!authorizedFeature) return;

    const btnIdentifier = 'qol-admin-debug-login-runbot';

    Array.from(document.getElementsByClassName(btnIdentifier)).forEach((e) => e.remove());

    const signIn = Array.from(document.getElementsByClassName('fa fa-sign-in btn btn-info'));

    signIn.forEach((btn) => {
        if (!btn.href.includes('static/build')) {
            const newBtn = document.createElement('a');
            newBtn.className = `${btnIdentifier} fa fa-rocket btn btn-warning`;
            newBtn.style.color = '#444';
            newBtn.onclick = (e) => openRunbot(e, false);
            newBtn.onauxclick = (e) => openRunbot(e, true);
            newBtn.href = btn.href;
            newBtn.title = 'Open runbot as admin and with debug mode enabled';
            btn.after(newBtn);
        }
    });
}

function getAdminDebugURL(href) {
    const url = new URL(href);
    url.pathname = '/web/login';
    url.search = 'debug=1';
    url.hash = 'qol-auto-login';
    return url.toString();
}

async function openRunbot(e, newTab) {
    e.preventDefault();

    let response = await chrome.runtime.sendMessage({
        action: 'GET_FINAL_RUNBOT_URL',
        href: e.target.href,
    });

    const finalLink = document.createElement('a');
    finalLink.href = getAdminDebugURL(response.url);
    finalLink.target = newTab ? '_blank' : '';
    // Manage event to open tab without switching to it
    const event = new MouseEvent('click', { ctrlKey: newTab });
    finalLink.dispatchEvent(event);
}
