//#region
async function checkTaskPage(currentUrl) {
    const taskSetup = await loadTaskSetup(currentUrl);
    if (taskSetup.task) {
        // From assign_me.js
        if (taskSetup.assignMeTaskEnabled) appendAssignMeTaskButton(taskSetup.task);

        // From starring_task.js
        if (taskSetup.starringTaskEffectEnabled)
            loadStar(parseInt(`${taskSetup.task.priority}`) === 1);
    }
}

async function loadTaskSetup(href) {
    const url = hrefFragmentToURLParameters(href);

    const { assignMeTaskEnabled, starringTaskEffectEnabled } = await chrome.storage.sync.get({
        assignMeTaskEnabled: false,
        starringTaskEffectEnabled: false,
    });

    const configuration = {};
    if (assignMeTaskEnabled) {
        const authorizedFeature = await authorizeFeature('assignMeTask', url.origin);
        configuration.assignMeTaskEnabled = authorizedFeature;
    }
    if (starringTaskEffectEnabled) {
        const authorizedFeature = await authorizeFeature('starringTaskEffect', url.origin);
        configuration.starringTaskEffectEnabled = authorizedFeature;
    }

    if (Object.values(configuration).includes(true)) {
        const task = await getProjectTask(url, () => {
            // From assign_me.js
            preloadAssignMeTask();
            preloadStarringTaskEffect();
        });

        return {
            ...configuration,
            task: task,
        };
    }
    return {};
}
//#endregion

//#region
async function getProjectTask(url, preload) {
    // Need to wait full page loaded to have access to the HTML
    // HTML not used in this method but need to return false is HTML is not "good"
    // TODO Improve of find an way to be sure than HTML is loaded
    preload();
    await new Promise((r) => setTimeout(r, 2500));

    const currentURL = hrefFragmentToURLParameters(window.location.href);
    if (currentURL.href !== url.href) return undefined;

    const task = await getTask(url);
    if (!task) return undefined;

    task.qol_origin = url.origin;
    return task;
}

function getTaskIDFromUrl(url) {
    const search = url.searchParams;
    const model = search.get('model');
    if (model !== 'project.task') return undefined;
    const viewType = search.get('view_type');
    if (viewType !== 'form') return undefined;
    const ticketID = search.get('id');
    if (!ticketID) return undefined;
    return ticketID;
}

async function getTask(url) {
    const ticketID = getTaskIDFromUrl(url);
    if (ticketID === undefined) return undefined;

    // Get task
    const taskResponse = await fetch(
        new Request(`${url.origin}/web/dataset/call_kw/project.task/search_read`, {
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
                        domain: [['id', '=', ticketID]],
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

async function getCurrentUserID() {
    // TODO IMPROVE, settings page field ? web request ?
    const avatarEl = document.getElementsByClassName('o_avatar o_user_avatar rounded')[0];
    if (!avatarEl) return undefined;
    const avatarURL = new URL(avatarEl.src);
    const search = avatarURL.searchParams;
    const userID = parseInt(search.get('id'));
    if (isNaN(userID)) return undefined;
    return userID;
}

//#endregion
