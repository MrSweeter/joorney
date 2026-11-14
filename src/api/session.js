let SESSION_INFO;
export const SessionKey = {
    UID: 'uid',
    NAME: 'name',
    PARTNER_ID: 'partner_id',
    SERVER_VERSION_INFO: 'server_version_info',
    DB: 'db',
};

export function isDebugSession() {
    const dataset = document.querySelector('body').dataset;
    return dataset.odooDebugMode && dataset.odooDebugMode !== '0';
}

export function getSessionData(key) {
    return SESSION_INFO?.[key];
}

export async function loadSessionInfo() {
    if (SESSION_INFO) return;
    const scripts = document.querySelectorAll('script[type="text/javascript"]');
    const script = Array.from(scripts).find((s) => s.textContent.includes('odoo.__session_info__'));
    if (!script) return;
    const regex = /odoo\.__session_info__\s*=\s*(\{.*\});/;
    const match = script.textContent.match(regex);
    if (match) {
        await saveSession(JSON.parse(match[1]));
    }
}

async function saveSession(data) {
    SESSION_INFO = data;
    console.debug(SESSION_INFO);
}
