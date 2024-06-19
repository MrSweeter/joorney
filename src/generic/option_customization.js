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
    }

    async setupCollapse(container) {
        const toggleElement = container.getElementsByClassName('feature-collapse-toggle')[0];
        const contentElements = container.getElementsByClassName('feature-collapse-content');
        const indicatorElement = container.getElementsByClassName('feature-collapse-indicator')[0];

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
