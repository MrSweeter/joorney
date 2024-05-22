import { writeRecord } from '../../api/odoo.js';
import ContentFeature from '../../generic/content.js';
import { isStillSamePage } from '../../utils/authorize.js';
import { getModelAndID_fromURL } from '../../utils/url_manager.js';
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
        // Need to wait full page loaded to have access to the HTML
        // HTML not used in this method but need to return false if HTML is not "good"
        // TODO[IMP] Improve of find an way to be sure than HTML is loaded
        const saveExist = document.getElementsByName('joorney_action_save_article');
        for (const e of saveExist) e.disabled = true;

        // body_0 is the ID use when you can edit an article body
        const exist = document.getElementById('body_0') ?? document.getElementById('body');
        if (!exist) return undefined;

        const article = await this.getArticle(url);
        if (!article) return undefined;

        return article;
    }

    async getArticle(url) {
        const articleID = await this.tryCatch(() => this.getKnowledgeArticleID_fromURL(url), undefined);
        if (!articleID) return undefined;
        return { id: articleID };
    }

    async appendSaveButton(article) {
        const exist = document.getElementsByName('joorney_action_save_article');
        // Avoid adding button if already added
        if (exist.length > 0) {
            for (const e of exist) {
                this.updateSaveEvent(e, article);
                e.disabled = false;
            }
            return;
        }

        this.appendSaveButtonToDom(article);
    }

    async saveArticle(article) {
        const articleID = await this.tryCatch(
            () => this.getKnowledgeArticleID_fromURL(window.location.href),
            undefined
        );
        if (!articleID) return;
        if (article.id !== articleID)
            throw new Error(`Button context is not the same as the url context: '${article.id}' vs '${articleID}'`);

        const body = document.getElementById('body_0').innerHTML;
        if (!body) return;

        await writeRecord('knowledge.article', Number.parseInt(articleID), {
            body: body,
        });
    }

    updateSaveEvent(btn, article) {
        btn.onclick = () => {
            this.saveArticle(article);
        };
    }

    appendSaveButtonToDom(article) {
        const buttonTemplate = document.createElement('template');
        buttonTemplate.innerHTML = `
            <button class="btn btn-warning" name="joorney_action_save_article" type="object">
                <span>Save</span>
            </button>
        `.trim();

        const saveButton = buttonTemplate.content.firstChild;
        this.updateSaveEvent(saveButton, article);

        let statusBarButtons = document.getElementsByClassName('o_knowledge_add_buttons')[0];
        if (statusBarButtons) {
            statusBarButtons.appendChild(saveButton);
            return;
        }

        statusBarButtons = document.getElementsByClassName('o_knowledge_header')[0]?.childNodes[1];
        if (statusBarButtons) {
            statusBarButtons.prepend(saveButton);
        }
    }

    async getKnowledgeArticleID_fromURL(url) {
        return (await getModelAndID_fromURL(url, 'knowledge.article'))?.resId;
    }
}
