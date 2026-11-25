import { StorageSync } from '../utils/browser.js';

export default class OptionCustomizationFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
        if (!configuration.customization.option) throw new Error(`Invalid state for feature: ${this.configuration.id}`);
    }

    async load() {
        const container = document.querySelector(`div[data-feature-customization="${this.configuration.id}"]`);
        if (!container) throw new Error(`Invalid state for feature: ${this.configuration.id}`);
        container.classList.remove('d-none');

        await this.setupCollapse(container);
        await this.setupSettingSwitches(container);
    }

    async setupSettingSwitches(container) {
        const switches = Array.from(container.querySelectorAll('[role="switch"][data-setting]'));
        if (!switches.length) return;
        const values = await StorageSync.get(
            Object.fromEntries(switches.map((el) => [el.dataset.setting, this.defaultSettings[el.dataset.setting]]))
        );
        for (const el of switches) {
            const key = el.dataset.setting;
            el.setAttribute('aria-checked', String(Boolean(values[key])));
            el.onclick = async () => {
                const value = el.getAttribute('aria-checked') !== 'true';
                el.setAttribute('aria-checked', String(value));
                await StorageSync.set({ [key]: value });
                await this.onSettingSwitch(key, value);
            };
        }

        // The toolbar popup (or another options tab) stores the same keys: follow it, so a click flips what is shown
        // and what depends on it (onSettingSwitch)
        const follow = async (changes) => {
            // The page was left without unload(): nothing to update anymore
            if (!container.isConnected) {
                this.unload();
                return;
            }
            for (const el of switches) {
                const key = el.dataset.setting;
                const change = changes[key];
                if (!change) continue;
                const value = Boolean(change.newValue ?? this.defaultSettings[key]);
                if (el.getAttribute('aria-checked') === String(value)) continue;
                el.setAttribute('aria-checked', String(value));
                await this.onSettingSwitch(key, value);
            }
        };
        this.unload();
        this.followSettings = follow;
        StorageSync.onChanged?.addListener(follow);
    }

    unload() {
        if (this.followSettings) StorageSync.onChanged?.removeListener(this.followSettings);
        this.followSettings = null;
    }

    async onSettingSwitch(_key, _value) {}

    async setupCollapse(container) {
        const toggleElement = container.getElementsByClassName('feature-collapse-toggle')[0];
        const contentElements = container.getElementsByClassName('feature-collapse-content');
        const indicatorElement = container.getElementsByClassName('feature-collapse-indicator')[0];
        // The options feature page shows the block open, with no collapse header
        if (!toggleElement || !indicatorElement) return;

        function toggle() {
            if (indicatorElement.classList.contains('feature-opened')) {
                for (const el of contentElements) el.style.maxHeight = 0;
                indicatorElement.classList.remove('feature-opened');
            } else {
                for (const el of contentElements) el.style.maxHeight = '100%';
                indicatorElement.classList.add('feature-opened');
            }
        }

        toggleElement.onclick = () => toggle();
        for (const el of contentElements) el.style.maxHeight = 0;
    }
}
