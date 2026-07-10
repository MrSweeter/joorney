import { getDataset } from '../../api/odoo.js';
import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { getModelAndID_fromURL } from '../../utils/url_manager.js';

export default class RecordFormContentFeature extends ContentFeature    {
    constructor(configuration, models, caching=0)  {
        super(configuration)
        this.models = models;
        this.caching = caching
    }

    async loadFeature(url)  {
        this.preloadFeature();
        if (!(await isStillSamePage(2500, url))) return;
        const modelRecord = await this.getRecord(url, true);
        if (modelRecord) this.loadFeatureWithRecord(modelRecord.model, modelRecord.record);
    }

    preloadFeature() {}
    loadFeatureWithRecord(_model, _record) {}

    async getRecord(url)    {
        const recordID = await this.tryCatch(() => getModelAndID_fromURL(url, Object.keys(this.models), true), undefined)
        if (!recordID) return undefined
        const { model, resId } = recordID

        const fields = ['id', this.models[model].user_field, ...(this.models[model].extra_fields || [])]
        const response = await this.tryCatch(() => getDataset(model, [['id', '=', resId]], fields, 1, this.caching), undefined)

        return response ? {model: model, resId: response.id, record: response} : undefined
    }
}
