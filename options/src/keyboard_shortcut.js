import { StorageSync } from '../../utils/browser.js';
import { defaultKeyboardShortcutLocalSetting } from '../../utils/feature_default_configuration.js';

export async function load() {
	await preview();
}

const ctrlKeyString = 'Control'
const altKeyString = 'Alt'
const shiftKeyString = 'Shift'
const editorSeparator = '+'
const blacklistFinalKeys = [ctrlKeyString, altKeyString, shiftKeyString, editorSeparator]

async function preview() {
	const configuration = await StorageSync.get(defaultKeyboardShortcutLocalSetting)

	document.getElementById('keyboard_shortcut_preview_ctrl').style.display = configuration.kbsCtrlKey ? 'inline-block' : 'none'
	document.getElementById('keyboard_shortcut_preview_alt').style.display = configuration.kbsAltKey ? 'inline-block' : 'none'
	document.getElementById('keyboard_shortcut_preview_shift').style.display = configuration.kbsShiftKey ? 'inline-block' : 'none'
	document.getElementById('keyboard_shortcut_preview_key').textContent = configuration.kbsDisplayKey

	const modifyButton = document.getElementById('keyboard_shortcut_modify_button')
	modifyButton.onclick = e => modify()

	const editorContainer = document.getElementById('keyboard_shortcut_editor')
	editorContainer.style.display = 'none'
	const previewContainer = document.getElementById('keyboard_shortcut_preview')
	previewContainer.style.display = 'block'
}

function modify() {
	const editor = document.getElementById('keyboard_shortcut_editor_input')
	editor.onkeyup = e => {
		if (blacklistFinalKeys.includes(e.key)) return
		let result = []

		if (e.ctrlKey) result.push(ctrlKeyString)
		if (e.altKey) result.push(altKeyString)
		if (e.shiftKey) result.push(shiftKeyString)

		result.push(`${e.code} (${e.key})`)
		editor.value = result.join(editorSeparator)
	}

	const closeButton = document.getElementById('keyboard_shortcut_close_button')
	closeButton.onclick = e => preview()

	const saveButton = document.getElementById('keyboard_shortcut_save_button')
	saveButton.onclick = async (e) => {
		const input = document.getElementById('keyboard_shortcut_editor_input')
		const value = input.value
		if (!value) return
		const values = input.value.split(editorSeparator)

		await StorageSync.set({
			kbsAltKey: values.includes(altKeyString),
			kbsCtrlKey: value.includes(ctrlKeyString),
			kbsShiftKey: values.includes(shiftKeyString),
			kbsCodeKey: values[values.length - 1].split(' ')[0],
			kbsDisplayKey: values[values.length - 1]
		})

		preview()
	}

	const previewContainer = document.getElementById('keyboard_shortcut_preview')
	previewContainer.style.display = 'none'
	const editorContainer = document.getElementById('keyboard_shortcut_editor')
	editorContainer.style.display = 'flex'
}
