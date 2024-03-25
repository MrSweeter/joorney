async function appendComposerSwitch(href) {
    const url = hrefFragmentToURLParameters(href);
    if (url.pathname.startsWith('/odoo')) return; // 17.2+ exclude, to be improved

    await new Promise((r) => setTimeout(r, 1000));

    const currentURL = hrefFragmentToURLParameters(window.location.href);
    if (currentURL.href !== url.href) return;

    const { composerSwitchEnabled } = await chrome.storage.sync.get({
        composerSwitchEnabled: false,
    });
    if (!composerSwitchEnabled) return;

    const authorizedFeature = await authorizeFeature('composerSwitch', url.origin);
    if (!authorizedFeature) return undefined;

    observe();
}

const composerSwitchObserver = new MutationObserver((mutations) => {
    let addedNodes = mutations
        .filter((m) => m.type == 'childList' && m.addedNodes.length > 0)
        .flatMap((m) => Array.from(m.addedNodes).filter((n) => n.querySelector));
    /* Work from 16 but not before
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'BUTTON' && node.className.includes('close')) {
                    appendCopyPaster(node);
                }
            });
        }
    });*/
    if (!addedNodes.length > 0) return;
    const addedNode = addedNodes[0];

    const button = addedNode.querySelector('button.btn-close, button.close');
    if (!button) return;
    appendCopyPaster(button);
});

function observe() {
    let chatters = document.getElementsByClassName('o-overlay-container'); // 16.4+

    if (chatters.length === 0) {
        chatters = document.getElementsByClassName('o_dialog_container'); // <16.4
    }
    if (chatters.length !== 1) return;

    const chatterTarget = chatters[0];
    //const observerOptions = { childList: true, subtree: true }; Work from 16 but not before
    const observerOptions = { childList: true, subtree: false };
    composerSwitchObserver.observe(chatterTarget, observerOptions);
}

function appendCopyPaster(node) {
    if (document.getElementById('qol_composer_switch_cp')) return;
    const body =
        document.getElementById('body_0') ?? // 17.0
        document.getElementById('body') ?? // 16.0
        document.getElementsByClassName('odoo-editor-editable')?.[0]; // 15.0
    if (!body) return;

    // Disconnect if the only way to close is to copy/paste, no standard close button - with settings ?
    //composerSwitchObserver.disconnect();
    //node.style.display = 'none';
    node.classList.toggle(node.classList.contains('btn-close') ? 'btn-danger' : 'text-danger');

    const parentNode = node.parentNode;

    // Button
    const closePaste = document.createElement('button');
    closePaste.id = 'qol_composer_switch_cp';
    closePaste.innerHTML = 'Close and Paste';
    closePaste.className = 'btn btn-warning ms-3 ml-3';
    parentNode.appendChild(closePaste);
    closePaste.onclick = (e) => copyAndPaste(node);

    // Modal background closeable - with settings ?
    //const background = document.getElementsByClassName('o_technical_modal')[0];
    //background.style.backgroundColor = 'rgba(89, 60, 0, 0.5)';
    //background.onclick = (e) => {
    //    if (e.target !== background) return;
    //    copyAndPaste(node);
    //};
}

async function copyAndPaste(node) {
    const body =
        document.getElementById('body_0') ?? // 17.0
        document.getElementById('body') ?? // 16.0
        document.getElementsByClassName('odoo-editor-editable')?.[0]; // 15.0
    let text = body.innerText;

    const textarea =
        document.getElementsByClassName('o-mail-Composer-input')?.[0] ?? // 17.0
        document.getElementsByClassName('o_ComposerTextInput_textarea')?.[0]; // 15.0

    let lines = text.split(/\r|\r\n|\n/);
    while (lines.length > 0 && lines[lines.length - 1] == '') {
        lines.pop();
    }
    const lineCount = lines.length;
    node.click();
    //observe();

    if (!lineCount) return;
    text = lines.join('\n');

    await new Promise((r) => setTimeout(r, 100));
    textarea.value = text;
    textarea.style.height = `${lineCount * 20 + 20}px`;
    textarea.dispatchEvent(new Event('input'));
}
