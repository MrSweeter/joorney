import { loadFeature } from '../../options/src/features.js';

export default class OptionFeature {
    constructor(configuration) {
        this.configuration = configuration;
        this.defaultSettings = configuration.defaultSettings;
    }

    async load() {
        await loadFeature(this.configuration.id);
    }

    async restore() {}
}
