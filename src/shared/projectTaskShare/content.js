import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { getProjectTaskID_fromURL } from '../../utils/url_manager.js';

export default class ProjectTaskShareContentFeature extends ContentFeature {
    async loadFeature(url) {
        this.preloadFeature();
        if (!(await isStillSamePage(2500, url))) return;
        const task = await this.getProjectTask(url); // TODO Setup a caching system, and move Odoo API call to dedicated folder
        if (task) this.loadFeatureWithTask(task);
    }

    preloadFeature() {}
    loadFeatureWithTask(task) {}

    async getProjectTask(url) {
        const task = await getTask(url);
        if (!task) return undefined;
        return task;
    }

    async getTask(url) {
        const taskID = await getProjectTaskID_fromURL(url);
        if (taskID === undefined) return undefined;

        // Get task
        const taskResponse = await fetch(
            new Request(`/web/dataset/call_kw/project.task/search_read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        args: [],
                        kwargs: {
                            context: { lang: 'en_US' },
                            fields: ['id', 'project_id', 'user_ids', 'priority'],
                            domain: [['id', '=', taskID]],
                            limit: 1,
                        },
                        model: 'project.task',
                        method: 'search_read',
                    },
                }),
            })
        );

        const taskData = await taskResponse.json();

        if (taskData.result?.length === 0) return undefined;
        if (taskData.result === undefined) return undefined;

        return taskData.result[0];
    }
}
