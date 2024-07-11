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
export const Windows = isFirefox() ? browser.windows : chrome.windows;
export const Management = isFirefox() ? browser.management : chrome.management;
export const OmniBox = isFirefox() ? browser.omnibox : chrome.omnibox;

export async function sendRuntimeMessage(action, message = {}) {
    try {
        return await Runtime.sendMessage({ action: action, ...message });
    } catch (err) {
        Console.trace('catch runtime', err);
    }
}

export async function sendTabMessage(tabID, action, message = {}) {
    try {
        return await Tabs.sendMessage(tabID, { action: action, ...message });
    } catch (err) {
        Console.trace('catch tabs', err);
    }
}

export const Console = {
    info(obj) {
        console.info(`%c${this._getFormatOperator(obj)}`, 'border-left: 2px solid cyan; padding-left: 8px;', obj);
    },
    log(obj) {
        console.log(obj);
    },
    error(obj) {
        console.info(`%c${this._getFormatOperator(obj)}`, 'border-left: 2px solid red; padding-left: 8px;', obj);
    },
    warn(obj) {
        console.info(`%c${this._getFormatOperator(obj)}`, 'border-left: 2px solid goldenrod; padding-left: 8px;', obj);
    },
    success(obj) {
        console.info(`%c${this._getFormatOperator(obj)}`, 'border-left: 2px solid green; padding-left: 8px;', obj);
    },
    trace(label, obj) {
        console.trace(label, obj);
    },
    critical(obj) {
        console.error(obj);
    },

    _getFormatOperator(obj) {
        switch (typeof obj) {
            case 'string':
                return '%s';
            case 'number':
                return '%s';
            case 'object':
                return '%O';
            default:
                return '%s';
        }
    },
};
