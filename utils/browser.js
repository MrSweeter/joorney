export function isFirefox() {
	return typeof chrome !== 'undefined' && typeof browser !== 'undefined';
}

//export const BrowserAction = isFirefox() ? browser?.browserAction : chrome.action;
//export const Tabs = isFirefox() ? browser.tabs : chrome.tabs;
//export const ContextMenus = isFirefox() ? browser.contextMenus : chrome.contextMenus;
//export const Runtime = isFirefox() ? browser.runtime : chrome.runtime;
//export const StorageSync = isFirefox() ? browser.storage.sync : chrome.storage.sync;
//export const Scripting = isFirefox() ? browser.scripting : chrome.scripting;
//export const WebNavigation = isFirefox() ? browser.webNavigation : chrome.webNavigation;
