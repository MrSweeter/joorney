let SESSION_INFO = undefined;
export const SessionKey = {
    UID: 'uid',
    SERVER_VERSION_INFO: 'server_version_info',
};
export function getSessionData(key) {
    return SESSION_INFO?.[key];
}

export async function loadSessionInfo() {
    if (SESSION_INFO) return;
    const scripts = document.querySelectorAll('script[type="text/javascript"]');
    const script = Array.from(scripts).find((s) => s.innerText.includes('odoo.__session_info__'));
    if (!script) return;
    const regex = /odoo\.__session_info__\s*=\s*(\{.*\});/;
    const match = script.innerText.match(regex);
    if (match) {
        await saveSession(JSON.parse(match[1]));
    }
}

async function saveSession(data) {
    SESSION_INFO = data;
    console.debug(SESSION_INFO);
}
