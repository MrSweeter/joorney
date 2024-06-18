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
        const contentElement = container.getElementsByClassName('feature-collapse-content')[0];
        const indicatorElement = container.getElementsByClassName('feature-collapse-indicator')[0];

        function toggle() {
            if (contentElement.style.maxHeight && Number.parseInt(contentElement.style.maxHeight)) {
                contentElement.style.maxHeight = 0;
                indicatorElement.classList.remove('feature-opened');
            } else {
                contentElement.style.maxHeight = `${contentElement.scrollHeight + 200}px`;
                indicatorElement.classList.add('feature-opened');
            }
        }

        toggleElement.onclick = () => toggle();
        contentElement.style.maxHeight = 0;
    }
}
