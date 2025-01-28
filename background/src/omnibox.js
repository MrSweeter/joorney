import { getRunbotOpenUrl } from '../../src/shared/limited/runbot_content.js';
import { OmniBox, Runtime, StorageSync, Tabs } from '../../src/utils/browser.js';
import { SUPPORTED_VERSION } from '../../src/utils/constant.js';

export function initOmni() {
    OmniBox.onInputStarted.removeListener(onStarted);
    OmniBox.onInputStarted.addListener(onStarted);
}

const STATIC_LINK = {
    CHROMEWEBSTORE: {
        suggestionStart: ['chrome', 'store'],
        keyword: 'chromewebstore',
        description: 'Open Chrome Web Store',
        url: `https://chromewebstore.google.com/detail/${Runtime.id}`,
    },
    GITHUB: {
        suggestionStart: ['git'],
        keyword: 'githubrepository',
        description: 'Open GitHub repository',
        url: 'https://github.com/MrSweeter/joorney',
    },
    WEBSITE: {
        suggestionStart: ['web'],
        keyword: 'websitepage',
        description: 'Open Github Page',
        url: 'https://mrsweeter.github.io/joorney/?style=odoo',
    },
};

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
    for (const link of Object.values(STATIC_LINK)) {
        if (link.suggestionStart?.some((start) => keyword.startsWith(start))) {
            return [{ content: link.keyword, description: link.description }];
        }
    }

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
    const link = Object.values(STATIC_LINK).find((link) => link.keyword === keyword);
    if (link) return link.url;

    const pattern = /^rb:(.+)$/;
    const match = keyword.match(pattern);

    if (match) {
        const version = match[1];
        return getRunbotOpenUrl(version);
    }

    return null;
}
