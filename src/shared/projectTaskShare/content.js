import { getDataset } from '../../api/odoo.js';
import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { getModelAndID_fromURL } from '../../utils/url_manager.js';

export default class ProjectTaskShareContentFeature extends ContentFeature {
    async loadFeature(url) {
        this.preloadFeature();
        if (!(await isStillSamePage(2500, url))) return;
        const task = await this.getProjectTask(url);
        if (task) this.loadFeatureWithTask(task);
    }

    preloadFeature() {}
    loadFeatureWithTask(_task) {}

    async getProjectTask(url) {
        const task = await this.getTask(url);
        if (!task) return undefined;
        return task;
    }

    async getTask(url) {
        const taskID = await this.getProjectTaskID_fromURL(url);
        if (taskID === undefined) return undefined;

        const response = await getDataset(
            'project.task',
            [['id', '=', taskID]],
            ['id', 'project_id', 'user_ids', 'priority'],
            1
        );
        return response;
    }

    async getProjectTaskID_fromURL(url) {
        return (await getModelAndID_fromURL(url, 'project.task'))?.resId;
    }
}
