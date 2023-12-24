function loadUnfocusApp(configuration) {
    const unfocusAppFeature = document.getElementById('unfocusAppFeature');
    unfocusAppFeature.onchange = updateUnfocusApp;

    unfocusAppFeature.checked = configuration.unfocusAppEnabled;

    updateRenderUnfocusApp(configuration.unfocusAppEnabled);
}

function updateUnfocusApp(e) {
    const checked = e.target.checked;
    chrome.storage.sync.set({ unfocusAppEnabled: checked });
    updateOptionPage({ enableUnfocusApp: checked });
    updateUnfocusAppTabs(checked);

    updateRenderUnfocusApp(checked);
}

async function updateRenderUnfocusApp(checked) {
    const { unfocusAppReorderEnabled, unfocusAppShareEnabled } = await chrome.storage.sync.get({
        unfocusAppReorderEnabled: false,
        unfocusAppShareEnabled: false,
    });

    const appOrderSwitcher = document.getElementById('qol_unfocus_app_order_switcher');
    const appOrderInput = document.getElementById('qol_unfocus_app_order_input');
    updateRenderUnfocusAppSwitcher(
        appOrderSwitcher,
        appOrderInput,
        unfocusAppReorderEnabled,
        checked,
        onUnfocusAppReorderModeChange
    );

    const appShareSwitcher = document.getElementById('qol_unfocus_app_share_switcher');
    const appShareInput = document.getElementById('qol_unfocus_app_share_input');

    updateRenderUnfocusAppSwitcher(
        appShareSwitcher,
        appShareInput,
        unfocusAppShareEnabled,
        checked,
        onUnfocusAppShareModeChange
    );
}

function updateRenderUnfocusAppSwitcher(switcher, input, optionActive, featureActive, onchange) {
    input.checked = optionActive;
    input.setAttribute('indeterminate', !featureActive);
    input.onchange = onchange;

    switcher.disabled = !featureActive;
    input.disabled = !featureActive;
    switcher.style.opacity = featureActive ? 1 : 0.5;
}

function onUnfocusAppReorderModeChange(event) {
    const unfocusAppFeature = document.getElementById('unfocusAppFeature');
    const enabled = unfocusAppFeature.checked;
    if (enabled)
        chrome.storage.sync.set({
            unfocusAppReorderEnabled: event.currentTarget.checked,
        });
    else event.preventDefault();
}

function onUnfocusAppShareModeChange(event) {
    const unfocusAppFeature = document.getElementById('unfocusAppFeature');
    const enabled = unfocusAppFeature.checked;
    if (enabled)
        chrome.storage.sync.set({
            unfocusAppShareEnabled: event.currentTarget.checked,
        });
    else event.preventDefault();
}

function updateUnfocusAppTabs(checked) {
    // The wildcard * for scheme only matches http or https
    // Same url pattern than content_scripts in manifest
    chrome.tabs.query({ url: '*://*/*' }, (tabs) => {
        tabs.forEach((t) =>
            chrome.tabs.sendMessage(t.id, { enableUnfocusApp: checked, url: t.url })
        );
    });
}
