async function checkKnowledge(currentUrl) {
    const knowledgeArticle = await getKnowledgeArticle(currentUrl);
    if (knowledgeArticle) {
        appendSaveButton(knowledgeArticle);
    }
}

async function getKnowledgeArticle(href) {
    const { saveKnowledgeEnabled } = await chrome.storage.sync.get({
        saveKnowledgeEnabled: false,
    });
    if (!saveKnowledgeEnabled) return undefined;
    // Need to wait full page loaded to have access to the HTML
    // HTML not used in this method but need to return false is HTML is not "good"
    // TODO Improve of find an way to be sure than HTML is loaded
    const saveExist = document.getElementsByName('qol_action_save_article');
    saveExist.forEach((e) => (e.disabled = true));

    await new Promise((r) => setTimeout(r, 2500));
    if (window.location.href !== href) return undefined;

    // Odoo url can manage fragment for some parameter, need to merge fragment and classic parameter
    const url = hrefFragmentToURLParameters(href);
    const authorizedFeature = await authorizeFeature('saveKnowledge', url.origin);
    if (!authorizedFeature) return undefined;

    // body_0 is the ID use when you can edit an article body
    const exist = document.getElementById('body_0');
    if (!exist) return undefined;

    const article = await getArticle(url);
    if (!article) return undefined;

    article.qol_origin = url.origin;
    return article;
}

function getArticleIDFromUrl(url) {
    const search = url.searchParams;
    const model = search.get('model');
    if (model !== 'knowledge.article') return undefined;
    const viewType = search.get('view_type');
    if (viewType !== 'form') return undefined;
    const articleID = search.get('id');
    if (!articleID) return undefined;
    return articleID;
}

async function getArticle(url) {
    const articleID = getArticleIDFromUrl(url);
    if (articleID === undefined) return undefined;

    return { id: articleID };
}

async function appendSaveButton(article) {
    const exist = document.getElementsByName('qol_action_save_article');
    // Avoid adding button if already added
    if (exist.length > 0) {
        exist.forEach((e) => {
            updateSaveEvent(e, article);
            e.disabled = false;
        });
        return;
    }

    appendSaveButtonToDom(article);
}

async function saveArticle(article) {
    const articleID = getArticleIDFromUrl(hrefFragmentToURLParameters(window.location.href));
    if (article.id != articleID)
        throw new Error(
            `Button context is not the same as the url context: '${article.id}' vs '${articleID}'`
        );

    const body = document.getElementById('body_0').innerHTML;
    if (!body) return;

    const writeResponse = await fetch(
        new Request(`${article.qol_origin}/web/dataset/call_kw/knowledge.article/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: rpcIndex++,
                method: 'call',
                jsonrpc: '2.0',
                params: {
                    args: [[parseInt(articleID)], { body: body }],
                    kwargs: { context: {} },
                    model: 'knowledge.article',
                    method: 'write',
                },
            }),
        })
    );

    const data = await writeResponse.json();

    if (data?.error || data?.result === false)
        throw new Error(data.error, "'Save article' call failed !");

    if (data?.result === true) return;

    throw new Error(data?.result || "Unknown response from 'Save article' call...");
}

function updateSaveEvent(btn, article) {
    btn.onclick = () => {
        saveArticle(article);
    };
}

function appendSaveButtonToDom(article) {
    const buttonTemplate = document.createElement('template');
    buttonTemplate.innerHTML = `
		<button class="btn btn-warning" name="qol_action_save_article" type="object">
			<span>Save</span>
		</button>
	`.trim();

    const saveButton = buttonTemplate.content.firstChild;
    updateSaveEvent(saveButton, article);

    const statusBarButtons = document.getElementsByClassName('o_knowledge_add_buttons')[0];
    if (statusBarButtons) statusBarButtons.appendChild(saveButton);
}
