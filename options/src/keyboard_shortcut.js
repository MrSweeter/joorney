import { Tabs } from '../../src/utils/browser';

export async function load() {
    const openExtensionShortcut = document.getElementById('open-extension-shortcut');
    openExtensionShortcut.onclick = () => {
        Tabs.create({ url: 'chrome://extensions/shortcuts' });
    };
}
