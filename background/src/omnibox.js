import { SUPPORTED_VERSION } from '../../configuration.js';
import { openVersionKey } from '../../src/shared/limited/runbot_content.js';
import { OmniBox, StorageSync, Tabs } from '../../src/utils/browser.js';

export function initOmni() {
    OmniBox.onInputStarted.removeListener(onStarted);
    OmniBox.onInputStarted.addListener(onStarted);
}

async function onStarted() {
    const { autoOpenRunbotEnabled } = await StorageSync.get({ autoOpenRunbotEnabled: false });
    if (!autoOpenRunbotEnabled) {
        await OmniBox.setDefaultSuggestion({
            description:
                'The functionality to open a runbot from URL is currently disabled. Open options to enabled "Auto Open Runbot"!',
        });
    } else {
        await OmniBox.setDefaultSuggestion({ description: 'Open <match>%s</match> <dim>(if found)</dim>' });
        OmniBox.onInputChanged.removeListener(onChange);
        OmniBox.onInputChanged.addListener(onChange);

        OmniBox.onInputEntered.removeListener(onEntered);
        OmniBox.onInputEntered.addListener(onEntered);
    }
}

function onChange(text, suggest) {
    const suggestions = getSuggestions(text);
    suggest(suggestions);
}

function onEntered(text) {
    const url = getURLFromKeyword(text);
    if (url) {
        openURL(url);
    }
}

async function openURL(url) {
    const { omniboxFocusCurrentTab } = await StorageSync.get({ omniboxFocusCurrentTab: false });
    if (omniboxFocusCurrentTab) {
        Tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                Tabs.update(tabs[0].id, { url });
            }
        });
    } else {
        Tabs.create({ url });
    }
}

function getSuggestions(keyword) {
    const prefix = 'rb';
    if (!keyword.startsWith(prefix)) return [];

    const suggestions = SUPPORTED_VERSION.map((v) => ({ value: v, keyword: `${prefix}:${v}` }))
        .filter((v) => v.keyword.startsWith(keyword))
        .map((version) => ({
            content: version.keyword,
            description: `Open Runbot for version '${version.value}'`,
        }));
    suggestions.push({
        content: 'rb:master',
        description: `Open Runbot for version 'master'`,
    });
    return suggestions;
}

function getURLFromKeyword(keyword) {
    const pattern = /^rb:(.+)$/;
    const match = keyword.match(pattern);

    if (match) {
        const version = match[1];
        return `https://runbot.odoo.com?${openVersionKey}=${version}`;
    }

    return null;
}
