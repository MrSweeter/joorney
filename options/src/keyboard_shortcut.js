import { Commands, Tabs } from '../../src/utils/browser.js';

export async function load() {
    const tableBody = document.getElementById('shortcut_table_body');
    const rowTemplate = document.createElement('template');
    const commands = await Commands.getAll();
    commands.forEach((command) => {
        rowTemplate.innerHTML = `
			<tr>
				<td>${command.shortcut}</td>
				<td>${command.name === '_execute_action' ? 'Activate the extension' : command.description}</td>
			</tr>
		`.trim();
        tableBody.appendChild(rowTemplate.content.firstChild);
    });

    const openExtensionShortcut = document.getElementById('open-extension-shortcut');
    openExtensionShortcut.onclick = () => {
        Tabs.create({ url: 'chrome://extensions/shortcuts' });
    };
}
