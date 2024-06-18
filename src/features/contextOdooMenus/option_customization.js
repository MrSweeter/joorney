import OptionCustomizationFeature from '../../generic/option_customization.js';
import { StorageSync, sendRuntimeMessage } from '../../utils/browser.js';
import { MESSAGE_ACTION } from '../../utils/messaging.js';
import configuration from './configuration.js';

export default class ContextOdooMenusOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
        this.menusKey = 'contextOdooMenusContextMenu';
    }

    async load() {
        super.load();
        const menus = await this.getItems();
        this.setup(menus);
    }

    async getItems() {
        const settings = await StorageSync.get(this.defaultSettings);
        console.log(settings);
        return settings[this.menusKey];
    }

    async setItems(menus) {
        await StorageSync.set({ [this.menusKey]: menus });
    }

    //#region CRUD
    async create() {
        const pathInput = document.getElementById('joorney_contextOdooMenus_new_path');

        try {
            const menus = await this.updateOrCreate(crypto.randomUUID(), pathInput.value, false);
            await this.saveAndRender(menus, true);
            pathInput.value = '';
        } catch (error) {
            this.displayError(error.message);
        }
    }

    async toggle(id, active) {
        const menus = await this.getItems();
        menus[id].active = active;
        await this.saveAndRender(menus, false);
    }

    async favorite(id, favorite) {
        const menus = await this.getItems();
        menus[id].favorite = favorite;
        await this.saveAndRender(menus, true);
    }

    async updatePath(id, path) {
        try {
            const menus = await this.updateOrCreate(id, path, false);
            await this.saveAndRender(menus, false);
        } catch (error) {
            this.displayError(error.message);
        }
    }

    async reorder(id, moveUp) {
        const menus = await this.getItems();

        const sortedRecordIds = Object.keys(menus).sort((k1, k2) => menus[k1].order - menus[k2].order);

        const curPos = sortedRecordIds.indexOf(id);
        const newPos = Math.min(Math.max(curPos + (moveUp ? -1 : 1), 0), sortedRecordIds.length - 1); // Keep newPos in bounds (0 <= newPos <= maxPos)

        [sortedRecordIds[curPos], sortedRecordIds[newPos]] = [sortedRecordIds[newPos], sortedRecordIds[curPos]]; // ES6 Swap

        sortedRecordIds.forEach((k, i) => {
            menus[k].order = i;
        }); // Rewrite order

        await this.saveAndRender(menus, true);
    }

    async remove(id, path) {
        if (confirm(`Are you sure you want to remove the menu: ${path}?`)) {
            const menus = await this.getItems();
            delete menus[id];
            await this.saveAndRender(menus, true);
        }
    }

    async removeAll() {
        if (confirm('Are you sure you want to delete all menus?')) {
            await this.saveAndRender({}, true);
        }
    }

    async updateOrCreate(id, pathArg, overwrite) {
        if (!pathArg) throw new Error('Missing path');

        const menus = await this.getItems();

        const path = pathArg.trim();
        const existingRecord = menus[id];
        let nextPosition = existingRecord?.order ?? Number.MAX_SAFE_INTEGER;

        if (!overwrite) {
            const ids = Object.keys(menus);
            if (ids.includes(id)) {
                throw new Error(`This id is already registered (should not happen): ${id}`);
            }
            const items = Object.values(menus);
            if (items.some((s) => s.path === path)) {
                throw new Error(`This path is already registered: ${path}`);
            }
            nextPosition = Math.max(...items.map((s) => s.order)) + 1;
        }

        menus[id] = {
            id: id,
            path: path,
            order: Math.max(0, nextPosition),
            active: existingRecord?.active ?? true,
            favorite: existingRecord?.favorite ?? false,
        };
        return menus;
    }
    //#endregion

    //#region UI
    displayError(errorMessage) {
        const container = document.getElementById('joorney_contextOdooMenus_new_error');
        container.textContent = errorMessage;
        container.style.display = errorMessage ? 'table-cell' : 'none';
    }

    async saveAndRender(menus, recreate) {
        await this.setItems(menus);
        if (recreate) await sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.RECREATE_MENU);
        this.render(menus);
    }

    render(menus) {
        const container = document.getElementById('joorney_contextOdooMenus_table_body');
        container.innerHTML = '';

        const menusArray = Object.values(menus).sort((a, b) => a.order - b.order);
        menusArray.forEach((menu, index) =>
            this.renderOne(menu, index === 0, index === menusArray.length - 1, container)
        );

        this.displayError();
    }

    renderOne(menu, isFirst, isLast, container) {
        const template = document.createElement('template');

        template.innerHTML = `
        <tr style="opacity: ${menu.active ? '1' : '0.5'}" ${!menu.active ? 'disabled' : ''}>
            <td class="p-1 ps-3" title="${menu.order}" style="vertical-align: middle">
                <button class="btn p-2 order-up-button-${menu.id}" ${isFirst ? 'disabled style="opacity: 0"' : 0}>
                    <i class="fa fa-caret-up text-success"></i>
                </button>
                <button class="btn p-2 order-down-button-${menu.id}" ${isLast ? 'disabled style="opacity: 0"' : 0}>
                    <i class="fa fa-caret-down text-danger"></i>
                </button>
            </td>
            <td class="p-1" style="vertical-align: middle">
                <input
                    class="joorney_contextOdooMenus_record_path_${menu.id} form-control border border-0 ${
                        menu.active ? '' : 'text-muted'
                    }"
                    placeholder="Menu name / Menu Path"
                    value="${menu.path}"
                    type="text"
                    ${!menu.active ? 'disabled' : ''}
                    style="background-color: rgba(0,0,0,0)">
            </td>
            <td class="p-1" style="vertical-align: middle">
                <button
                    class="joorney_contextOdooMenus_record_favorite_${menu.id} btn btn-outline-warning ${
                        menu.active ? '' : 'text-muted'
                    } border-0 btn-floating"
                    title="${menu.favorite ? 'Favorite' : 'Not favorite'}">
                    <i style="font-size: 1.2em" class="fa fa-${menu.favorite ? 'solid' : 'regular'} fa-star"></i>
                </button>
                <button
                    class="joorney_contextOdooMenus_record_toggle_${menu.id} btn btn-outline-success ${
                        menu.active ? '' : 'text-muted'
                    } border-0 btn-floating"
                    title="${menu.active ? 'Disable' : 'Enable'} quick menu">
                    <i style="font-size: 1.2em" class="fa fa-toggle-${menu.active ? 'on' : 'off'}"></i>
                </button>
                <button
                    class="joorney_contextOdooMenus_record_update_button_${menu.id} btn btn-outline-success border-0 btn-floating"
                    title="Save modification"
                    disabled>
                    ${menu.active ? '<i class="fa fa-save" style="font-size: 1.2em"></i>' : ''}
                </button>
                <button
                    class="joorney_contextOdooMenus_record_remove_button_${menu.id} btn btn-outline-danger border-0 btn-floating"
                    title="Delete quick menu">
                    <i style="font-size: 1.2em" class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `.trim();

        const menuElement = template.content.firstChild;

        const downButton = menuElement.getElementsByClassName(`order-down-button-${menu.id}`)[0];
        const upButton = menuElement.getElementsByClassName(`order-up-button-${menu.id}`)[0];
        const favoriteButton = menuElement.getElementsByClassName(
            `joorney_contextOdooMenus_record_favorite_${menu.id}`
        )[0];
        const stateButton = menuElement.getElementsByClassName(`joorney_contextOdooMenus_record_toggle_${menu.id}`)[0];
        const updateButton = menuElement.getElementsByClassName(
            `joorney_contextOdooMenus_record_update_button_${menu.id}`
        )[0];
        const removeButton = menuElement.getElementsByClassName(
            `joorney_contextOdooMenus_record_remove_button_${menu.id}`
        )[0];
        const pathInput = menuElement.getElementsByClassName(`joorney_contextOdooMenus_record_path_${menu.id}`)[0];

        downButton.addEventListener('click', () => this.reorder(menu.id, false));
        upButton.addEventListener('click', () => this.reorder(menu.id, true));

        favoriteButton.addEventListener('click', () => this.favorite(menu.id, !menu.favorite));
        stateButton.addEventListener('click', () => this.toggle(menu.id, !menu.active));
        updateButton.addEventListener('click', () => this.updatePath(menu.id, pathInput.value));
        removeButton.addEventListener('click', () => this.remove(menu.id, menu.path));

        pathInput.addEventListener('input', (event) => {
            event.target.parentElement.style.backgroundColor = 'rgba(255, 204, 0, 0.25)';
            updateButton.removeAttribute('disabled');
        });

        container.appendChild(menuElement);
    }

    async setup(menus) {
        const newPathInput = document.getElementById('joorney_contextOdooMenus_new_path');
        newPathInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.create();
            }
        });

        document.getElementById('joorney_contextOdooMenus_new_save').addEventListener('click', () => this.create());
        document
            .getElementById('joorney_contextOdooMenus_delete_all')
            .addEventListener('click', () => this.removeAll());

        this.render(menus);
    }
    //#endregion
}
