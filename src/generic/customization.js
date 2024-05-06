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
    }
}
