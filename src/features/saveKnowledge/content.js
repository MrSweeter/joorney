import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { getKnowledgeArticleID_fromURL } from '../../utils/url_manager.js';
import configuration from './configuration.js';

export default class SaveKnowledgeContentFeature extends ContentFeature {
    constructor() {
        super(configuration);
    }

    async loadFeature(url) {
        if (!(await isStillSamePage(2500, url))) return;

        const knowledgeArticle = await this.getKnowledgeArticle(url);
        if (knowledgeArticle) {
            this.appendSaveButton(knowledgeArticle);
        }
    }

    async getKnowledgeArticle(url) {
        // Odoo 17 introduce the save manually in article
        const odooSaveExist = document.getElementsByClassName('o_form_button_save');
        if (odooSaveExist.length > 0) return undefined;

        // Need to wait full page loaded to have access to the HTML
        // HTML not used in this method but need to return false is HTML is not "good"
        // TODO Improve of find an way to be sure than HTML is loaded
        const saveExist = document.getElementsByName('qol_action_save_article');
        saveExist.forEach((e) => (e.disabled = true));

        // body_0 is the ID use when you can edit an article body
        const exist = document.getElementById('body_0');
        if (!exist) return undefined;

        const article = await this.getArticle(url);
        if (!article) return undefined;

        return article;
    }

    async getArticle(url) {
        const articleID = await getKnowledgeArticleID_fromURL(url);
        if (!articleID) return undefined;
        return { id: articleID };
    }

    async appendSaveButton(article) {
        const exist = document.getElementsByName('qol_action_save_article');
        // Avoid adding button if already added
        if (exist.length > 0) {
            exist.forEach((e) => {
                this.updateSaveEvent(e, article);
                e.disabled = false;
            });
            return;
        }

        this.appendSaveButtonToDom(article);
    }

    async saveArticle(article) {
        const articleID = await getKnowledgeArticleID_fromURL(window.location.href);
        if (article.id != articleID)
            throw new Error(
                `Button context is not the same as the url context: '${article.id}' vs '${articleID}'`
            );

        const body = document.getElementById('body_0').innerHTML;
        if (!body) return;

        const writeResponse = await fetch(
            new Request(`/web/dataset/call_kw/knowledge.article/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 1,
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

    updateSaveEvent(btn, article) {
        btn.onclick = () => {
            this.saveArticle(article);
        };
    }

    appendSaveButtonToDom(article) {
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
            <button class="btn btn-warning" name="qol_action_save_article" type="object">
                <span>Save</span>
            </button>
        `.trim();

        const saveButton = buttonTemplate.content.firstChild;
        this.updateSaveEvent(saveButton, article);

        const statusBarButtons = document.getElementsByClassName('o_knowledge_add_buttons')[0];
        if (statusBarButtons) statusBarButtons.appendChild(saveButton);
    }
}
