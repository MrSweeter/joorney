export function isFirefox() {
    return typeof chrome !== 'undefined' && typeof browser !== 'undefined';
}

//export const BrowserAction = isFirefox() ? browser?.browserAction : chrome.action;
export const Tabs = isFirefox() ? browser.tabs : chrome.tabs;
export const ContextMenus = isFirefox() ? browser.contextMenus : chrome.contextMenus;
export const Runtime = isFirefox() ? browser.runtime : chrome.runtime;
export const StorageSync = isFirefox() ? browser.storage.sync : chrome.storage.sync;
export const StorageLocal = isFirefox() ? browser.storage.local : chrome.storage.local;
//export const Scripting = isFirefox() ? browser.scripting : chrome.scripting;
export const WebNavigation = isFirefox() ? browser.webNavigation : chrome.webNavigation;
export const Cookies = isFirefox() ? browser.cookies : chrome.cookies;
export const Action = isFirefox() ? browser.action : chrome.action;
export const Commands = isFirefox() ? browser.commands : chrome.commands;
//export const Windows = isFirefox() ? browser.windows : chrome.windows;
export const Management = isFirefox() ? browser.management : chrome.management;
