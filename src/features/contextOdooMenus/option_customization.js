import OptionCustomizationFeature from '../../generic/option_customization.js';
import { escapeHTML } from '../../html_generator.js';
import { Console, I18n, StorageSync, sendRuntimeMessage } from '../../utils/browser.js';
import { featureName, t } from '../../utils/i18n.js';
import { iconHTML } from '../../utils/icons.js';
import { MESSAGE_ACTION } from '../../utils/messaging.js';
import configuration from './configuration.js';

const NEW_PATH_ID = 'joorney_contextOdooMenus_new_path';
const NEW_ERROR_ID = 'joorney_contextOdooMenus_new_error';
const BOX_ID = 'joorney_contextOdooMenus_box';
const COUNT_ID = 'joorney_contextOdooMenus_count';
const FILTER_ID = 'joorney_contextOdooMenus_filter';
const FILTER_NOTE_ID = 'joorney_contextOdooMenus_filter_note';
const HEAD_ACTIONS_ID = 'joorney_contextOdooMenus_head_actions';
const LIST_ID = 'joorney_contextOdooMenus_list';
const EMPTY_ID = 'joorney_contextOdooMenus_empty';
const PREVIEW_ID = 'joorney_contextOdooMenus_preview';
const PREVIEW_COUNTS_ID = 'joorney_contextOdooMenus_preview_counts';
const EDIT_PATH_ID = 'joorney_contextOdooMenus_edit_path';
// Pending id of the "Delete all" question
const ALL = '*';
// Up to this many menus in the submenu, its app groups start open
const OPEN_APPS_MAX = 10;
// Top of the "Joorney" item in the browser menu of the preview (skeleton rows above it), and the height of a row
const PREVIEW_JOORNEY_TOP = 106;
const PREVIEW_ROW = 28;

function pathSegments(path) {
    // An entry without path (a hand-edited import) must not break the whole block
    return String(path ?? '')
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean);
}

// "Sales / Orders", "Sales/Orders" and "sales/orders" are the same menu to the user
function samePath(path1, path2) {
    return pathSegments(path1).join('/').toLowerCase() === pathSegments(path2).join('/').toLowerCase();
}

function appOf(menu) {
    return pathSegments(menu.path)[0] ?? '';
}

function sectionOf(menu) {
    if (!menu.active) return 'off';
    return menu.favorite ? 'top' : `app:${appOf(menu)}`;
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
const byPath = (a, b) => collator.compare(pathSegments(a.path).join('/'), pathSegments(b.path).join('/'));

function sectionsOf(menus) {
    const apps = new Map();
    for (const menu of menus.filter((m) => m.active && !m.favorite)) {
        if (!apps.has(appOf(menu))) apps.set(appOf(menu), []);
        apps.get(appOf(menu)).push(menu);
    }
    const groups = [...apps]
        .filter(([, list]) => list.length > 1)
        .sort(([app1], [app2]) => collator.compare(app1, app2))
        .map(([app, list]) => [app, list.sort(byPath)]);
    const singles = [...apps.values()]
        .filter((list) => list.length === 1)
        .flat()
        .sort(byPath);
    return {
        top: menus.filter((m) => sectionOf(m) === 'top'),
        groups,
        singles,
        off: menus.filter((m) => !m.active),
    };
}

export default class ContextOdooMenusOptionCustomizationFeature extends OptionCustomizationFeature {
    constructor() {
        super(configuration);
        this.menusKey = 'contextOdooMenusContextMenu';
        this.menus = {};
        // At most one row is edited or asks to be deleted (ALL: the "Delete all" question)
        this.editingId = null;
        this.pendingId = null;
        this.editError = '';
        // Row whose ⋮ menu is open, row being dragged
        this.menuId = null;
        this.dragId = null;
        this.filter = '';
        // App name -> open, set by the user; apps not in it follow OPEN_APPS_MAX
        this.openApps = new Map();
        this.offOpen = false;
        // Changes run one after the other: each reloads the list (refresh) then saves it whole
        this.changes = Promise.resolve();
    }

    async load() {
        super.load();
        this.menus = await this.getItems();
        this.setup();
        // In memory only: opening the page must not rewrite the user's order. A list saved before the submenu was
        // sorted is saved sorted on its next change (save)
        this.normalizeOrder();
        this.render();
    }

    async getItems() {
        const settings = await StorageSync.get(this.defaultSettings);
        return settings[this.menusKey];
    }

    /**
     * @param {() => Promise<void>} change
     * @returns {Promise<void>} once the change (and the ones queued before it) is saved
     */
    run(change) {
        this.changes = this.changes.then(change).catch((error) => this.recover(error));
        return this.changes;
    }

    async recover(error) {
        Console.error(error);
        try {
            this.menus = await this.getItems();
            this.normalizeOrder();
        } catch (e) {
            Console.error(e);
        }
        this.menuId = null;
        this.editingId = null;
        this.pendingId = null;
        this.render();
        this.showAddError(t('optionsContextMenus_errorSave', error?.message ?? String(error)));
    }

    async refresh(id) {
        this.menus = await this.getItems();
        this.normalizeOrder();
        if (!id || Object.hasOwn(this.menus, id)) return true;
        this.menuId = null;
        this.editingId = null;
        this.pendingId = null;
        this.render();
        return false;
    }

    sortedMenus() {
        return Object.values(this.menus).sort((a, b) => a.order - b.order);
    }

    //#region CRUD
    validatePath(value, exceptId) {
        const path = value.trim();
        const segments = pathSegments(path);
        if (!segments.length) return { error: t('optionsContextMenus_errorMissing') };
        const others = Object.values(this.menus).filter((m) => m.id !== exceptId);
        if (others.some((m) => samePath(m.path, path))) return { error: t('optionsContextMenus_errorExists') };
        // A lone menu name ("Quotations") and a path ending with it ("Sales/Orders/Quotations") would show the same
        // menu twice, or two entries the user cannot tell apart
        const clash = others.find((m) => {
            const other = pathSegments(m.path);
            return (
                (segments.length === 1 || other.length === 1) &&
                other.at(-1)?.toLowerCase() === segments.at(-1).toLowerCase()
            );
        });
        return clash ? { error: t('optionsContextMenus_errorSameMenu', clash.path) } : { path };
    }

    async create() {
        await this.refresh();
        const input = document.getElementById(NEW_PATH_ID);
        const { path, error } = this.validatePath(input.value);
        this.showAddError(error);
        if (error) return;

        const orders = Object.values(this.menus).map((m) => m.order);
        const id = crypto.randomUUID();
        this.menus[id] = {
            id,
            path,
            order: orders.length ? Math.max(...orders) + 1 : 0,
            active: true,
            favorite: false,
        };
        this.reveal(this.menus[id]);
        await this.save();
        // Only once saved: a failed save keeps the typed path to try again
        input.value = '';
    }

    async toggle(id) {
        if (!(await this.refresh(id))) return;
        const menu = this.menus[id];
        menu.active = !menu.active;
        this.reveal(menu);
        await this.save(this.rowFocus(id, 'toggle'));
    }

    async favorite(id, focusAction = 'favorite') {
        if (!(await this.refresh(id))) return;
        const menu = this.menus[id];
        menu.favorite = !menu.favorite;
        this.reveal(menu);
        await this.save(this.rowFocus(id, focusAction));
    }

    place(id, targetId, after) {
        const ids = this.sortedMenus()
            .map((m) => m.id)
            .filter((k) => k !== id);
        ids.splice(ids.indexOf(targetId) + (after ? 1 : 0), 0, id);
        ids.forEach((k, i) => {
            this.menus[k].order = i;
        });
    }

    // Keyboard reorder (Up / Down on the grip, top level only): swaps with the neighbour
    async step(id, direction) {
        if (!(await this.refresh(id))) return;
        const top = this.sortedMenus().filter((m) => sectionOf(m) === 'top');
        const neighbour = top[top.indexOf(this.menus[id]) + direction];
        if (!neighbour) return;
        this.place(id, neighbour.id, direction > 0);
        await this.save(this.rowFocus(id, 'grip'));
    }

    // Only the top level is dragged (the submenu is sorted): onto another top level row to reorder, onto the
    // Submenu band or the menu's app header to unstar
    canDrop(menu, target) {
        if (!menu?.active || !menu.favorite || !target) return false;
        if (target.dataset.drop === 'sub') return true;
        if (target.dataset.drop === 'app') return appOf(menu) === target.dataset.app;
        const other = this.menus[target.dataset.id];
        return Boolean(other) && other.id !== menu.id && sectionOf(other) === 'top';
    }

    async drop(menu, target) {
        if (target.dataset.drop) {
            await this.favorite(menu.id, 'menu');
            return;
        }
        if (!(await this.refresh(menu.id))) return;
        const moved = this.menus[menu.id];
        const other = this.menus[target.dataset.id];
        if (!this.canDrop(moved, target)) {
            this.render();
            return;
        }
        const sorted = this.sortedMenus();
        this.place(moved.id, other.id, sorted.indexOf(moved) < sorted.indexOf(other));
        await this.save(this.rowFocus(menu.id, 'grip'));
    }

    async saveEdit(id) {
        if (!(await this.refresh(id))) return;
        const input = document.getElementById(EDIT_PATH_ID);
        const { path, error } = this.validatePath(input.value, id);
        if (error) {
            this.editError = error;
            this.render(`#${EDIT_PATH_ID}`, input.value);
            return;
        }
        this.menus[id].path = path;
        this.editingId = null;
        this.editError = '';
        this.reveal(this.menus[id]);
        await this.save(this.rowFocus(id, 'menu'));
    }

    async remove(id) {
        if (!(await this.refresh(id))) return;
        const sorted = this.sortedMenus();
        const index = sorted.findIndex((m) => m.id === id);
        const next = sorted[index + 1] ?? sorted[index - 1];
        delete this.menus[id];
        this.pendingId = null;
        await this.save([...(next ? this.rowFocus(next.id, 'menu') : []), `#${NEW_PATH_ID}`]);
    }

    async removeAll() {
        this.menus = {};
        this.pendingId = null;
        this.editingId = null;
        await this.save(`#${NEW_PATH_ID}`);
    }

    // Offered on an empty list, but another options tab may have added menus since: keep them
    async addDefaults() {
        await this.refresh();
        const stored = Object.values(this.menus);
        for (const menu of Object.values(structuredClone(this.defaultSettings[this.menusKey]))) {
            if (Object.hasOwn(this.menus, menu.id) || stored.some((m) => samePath(m.path, menu.path))) continue;
            this.menus[menu.id] = menu;
        }
        await this.save('[data-action="delete-all"]');
    }

    // Rewrites the order to the one the list shows (sectionsOf): Chrome shows the menus in that order
    normalizeOrder() {
        const { top, groups, singles, off } = sectionsOf(this.sortedMenus());
        [...top, ...groups.flatMap(([, list]) => list), ...singles, ...off].forEach((menu, index) => {
            menu.order = index;
        });
    }

    // Every change rebuilds the context menu: switching a menu off or on can move the others in or out of the submenu
    async persist() {
        await StorageSync.set({ [this.menusKey]: this.menus });
        await sendRuntimeMessage(MESSAGE_ACTION.TO_BACKGROUND.RECREATE_MENU);
    }

    async save(focus) {
        this.menuId = null;
        this.normalizeOrder();
        await this.persist();
        this.render(focus);
    }
    //#endregion

    //#region UI
    // Opens the group a menu is in, so it stays in sight after it moved there
    reveal(menu) {
        const section = sectionOf(menu);
        if (section === 'off') this.offOpen = true;
        else if (section !== 'top') this.openApps.set(appOf(menu), true);
    }

    isAppOpen(app, submenuCount) {
        return this.openApps.get(app) ?? submenuCount <= OPEN_APPS_MAX;
    }

    // Focus after a render: the control of the row, or the header of its group when the row is folded away
    rowFocus(id, action) {
        const menu = this.menus[id];
        const selectors = [
            `[data-action="${action}"][data-id="${CSS.escape(id)}"]`,
            `[data-action="menu"][data-id="${CSS.escape(id)}"]`,
        ];
        if (!menu) return selectors;
        const group =
            sectionOf(menu) === 'off'
                ? '[data-action="off"]'
                : `[data-action="app"][data-app="${CSS.escape(appOf(menu))}"]`;
        return [...selectors, group];
    }

    showAddError(error) {
        const input = document.getElementById(NEW_PATH_ID);
        const container = document.getElementById(NEW_ERROR_ID);
        input.setAttribute('aria-invalid', String(Boolean(error)));
        container.hidden = !error;
        container.innerHTML = error ? `${iconHTML('error')}${escapeHTML(error)}` : '';
    }

    render(focus, editValue) {
        const menus = this.sortedMenus();
        const box = document.getElementById(BOX_ID);
        const empty = document.getElementById(EMPTY_ID);
        box.hidden = !menus.length;
        empty.hidden = Boolean(menus.length);
        empty.innerHTML = menus.length ? '' : this.emptyHTML();

        document.getElementById(COUNT_ID).textContent =
            menus.length === 1
                ? t('optionsContextMenus_countOne')
                : t('optionsContextMenus_count', String(menus.length));
        document.getElementById(HEAD_ACTIONS_ID).innerHTML = this.headActionsHTML();
        document.getElementById(FILTER_NOTE_ID).hidden = !this.filterText();
        document.getElementById(LIST_ID).innerHTML = menus.length ? this.listHTML(menus, editValue) : '';
        document.getElementById(PREVIEW_COUNTS_ID).innerHTML = this.previewCountsHTML(this.previewGroups(menus));
        document.getElementById(PREVIEW_ID).innerHTML = this.previewHTML(menus);

        if (!focus) return;
        const block = box.closest('[data-feature-customization]');
        for (const selector of [focus].flat()) {
            const element = block.querySelector(selector);
            if (element) {
                element.focus();
                return;
            }
        }
    }

    filterText() {
        return this.filter.trim().toLowerCase();
    }

    headActionsHTML() {
        if (this.pendingId !== ALL) {
            return `<button type="button" class="joorney-btn is-secondary is-small" data-action="delete-all">
                ${iconHTML('delete')}<span>${escapeHTML(t('optionsContextMenus_deleteAll'))}</span>
            </button>`;
        }
        const question = t('optionsContextMenus_confirmDeleteAll');
        return `<div class="joorney-ask joorney-cm-ask" role="group" aria-label="${escapeHTML(question)}">
            <span>${escapeHTML(question)}</span>
            <button type="button" class="joorney-btn is-secondary is-small" data-action="cancel">${escapeHTML(t('optionsContextMenus_cancel'))}</button>
            <button type="button" class="joorney-btn is-small" data-action="confirm-delete-all">${escapeHTML(t('optionsContextMenus_deleteAll'))}</button>
        </div>`;
    }

    // Top level band, submenu band with its app groups, switched off fold; a filter shows the matches only
    listHTML(menus, editValue) {
        const query = this.filterText();
        const matches = (m) => !query || m.path.toLowerCase().includes(query);
        const rows = (list, inApp) => list.map((m) => this.rowHTML(m, inApp, editValue)).join('');

        const { top, groups, singles, off } = sectionsOf(menus);
        const submenuCount = groups.flatMap(([, list]) => list).length + singles.length;
        const extensionName = I18n.getMessage('ext_name') || 'Joorney';
        const html = [];

        const topShown = top.filter(matches);
        if (!query || topShown.length) {
            html.push(
                this.bandHTML('top', 'star', t('optionsContextMenus_sectionTop'), top.length, `${extensionName} ›`)
            );
            html.push(rows(topShown, false));
            if (!top.length)
                html.push(`<p class="joorney-cm-hintrow">${escapeHTML(t('optionsContextMenus_topEmpty'))}</p>`);
        }

        const groupsShown = groups.map(([app, list]) => [app, list, list.filter(matches)]);
        const singlesShown = singles.filter(matches);
        if (!query || singlesShown.length || groupsShown.some(([, , shown]) => shown.length)) {
            html.push(
                this.bandHTML(
                    'sub',
                    'subdirectory_arrow_right',
                    t('optionsContextMenus_sectionSub'),
                    submenuCount,
                    `${extensionName} › ${featureName(configuration)} ›`
                )
            );
            // An app with one menu is no group (a header over a single row, often of the same name, says nothing):
            // those rows come after the groups, with their full path
            for (const [app, list, shown] of groupsShown) {
                if (query && !shown.length) continue;
                const open = query ? true : this.isAppOpen(app, submenuCount);
                html.push(this.appHTML(app, list, open));
                if (open) html.push(rows(shown, true));
            }
            html.push(rows(singlesShown, false));
        }

        const offShown = off.filter(matches);
        if (off.length && (!query || offShown.length)) {
            const open = query ? true : this.offOpen;
            html.push(`
                <button type="button" class="joorney-cm-group joorney-cm-fold${open ? ' is-open' : ''}" data-action="off" aria-expanded="${open}">
                    ${iconHTML(open ? 'expand_more' : 'chevron_right', { classes: 'joorney-cm-chev' })}
                    ${iconHTML('toggle_off', { classes: 'joorney-cm-foldicon' })}
                    <span class="joorney-cm-groupname">${escapeHTML(t('optionsContextMenus_sectionOff'))}</span>
                    <span class="joorney-chip">${off.length}</span>
                    <span class="joorney-cm-groupnames">${escapeHTML(t('optionsContextMenus_offHelp'))}</span>
                </button>
            `);
            if (open) html.push(rows(offShown, false));
        }

        if (query && !html.length) {
            html.push(
                `<p class="joorney-cm-hintrow">${escapeHTML(t('optionsContextMenus_noMatch', this.filter.trim()))}</p>`
            );
        }
        return html.join('');
    }

    // "where" is the path to these menus in the right-click menu
    bandHTML(kind, icon, title, count, where) {
        return `
            <div class="joorney-cm-band is-${kind}"${kind === 'sub' ? ' data-drop="sub"' : ''}>
                ${iconHTML(icon, { filled: kind === 'top', classes: 'joorney-cm-bandicon' })}
                <h4 class="joorney-cm-bandtitle">${escapeHTML(title)}</h4>
                <span class="joorney-chip">${count}</span>
                <span class="joorney-cm-where">${escapeHTML(where)}</span>
            </div>
        `;
    }

    appHTML(app, list, open) {
        // Folded: the menu names, except one that only repeats the app name (a lone "Knowledge" in "Knowledge")
        const names = open
            ? ''
            : list
                  .map((m) => pathSegments(m.path).at(-1))
                  .filter((name) => name !== app)
                  .join(', ');
        return `
            <button type="button" class="joorney-cm-group" data-action="app" data-app="${escapeHTML(app)}" data-drop="app" aria-expanded="${open}">
                ${iconHTML(open ? 'expand_more' : 'chevron_right', { classes: 'joorney-cm-chev' })}
                <span class="joorney-cm-groupname">${escapeHTML(app)}</span>
                <span class="joorney-chip">${list.length}</span>
                <span class="joorney-cm-groupnames">${escapeHTML(names)}</span>
            </button>
        `;
    }

    rowHTML(menu, inApp, editValue) {
        if (menu.id === this.editingId) return this.editRowHTML(menu, inApp, editValue);
        if (menu.id === this.pendingId) return this.askRowHTML(menu);

        // Full path in reading order; inside its app group the app is the group title, so it is left out
        const segments = pathSegments(menu.path);
        const shown = inApp && segments.length > 1 ? segments.slice(1) : segments;
        // Only the top level has a manual order; the submenu is sorted
        const draggable = sectionOf(menu) === 'top' && !this.filterText();
        const menuOpen = menu.id === this.menuId;
        const path = menu.path;
        const classes = [
            'joorney-cm-row',
            draggable ? 'has-grip' : '',
            inApp ? 'is-in' : '',
            menu.active ? '' : 'is-off',
        ]
            .filter(Boolean)
            .join(' ');
        // No placeholder where there is no grip: the row padding keeps the paths aligned
        const grip = draggable
            ? `<button type="button" class="joorney-cm-grip" data-action="grip" data-id="${escapeHTML(menu.id)}" aria-label="${escapeHTML(t('optionsContextMenus_reorder', path))}" title="${escapeHTML(t('optionsContextMenus_reorderTitle'))}">${iconHTML('drag_indicator')}</button>`
            : '';
        const popover = menuOpen
            ? `<div class="joorney-cm-pop" role="menu" aria-label="${escapeHTML(t('optionsContextMenus_more', path))}">
                <button type="button" role="menuitem" data-action="edit" data-id="${escapeHTML(menu.id)}">${iconHTML('edit')}<span>${escapeHTML(t('optionsContextMenus_editPath'))}</span></button>
                <button type="button" role="menuitem" data-action="move" data-id="${escapeHTML(menu.id)}">${iconHTML(menu.favorite ? 'subdirectory_arrow_right' : 'star')}<span>${escapeHTML(menu.favorite ? t('optionsContextMenus_moveSub') : t('optionsContextMenus_moveTop'))}</span></button>
                <button type="button" role="menuitem" class="is-danger" data-action="delete" data-id="${escapeHTML(menu.id)}">${iconHTML('delete')}<span>${escapeHTML(t('optionsContextMenus_deleteButton'))}</span></button>
            </div>`
            : '';

        return `
            <div class="${classes}" data-id="${escapeHTML(menu.id)}" draggable="${draggable}">
                ${grip}
                <div class="joorney-cm-text">${this.pathHTML(shown)}</div>
                <button type="button" class="joorney-icon-btn is-small joorney-cm-star${menu.favorite ? ' is-on' : ''}" data-action="favorite" data-id="${escapeHTML(menu.id)}" aria-pressed="${menu.favorite}" aria-label="${escapeHTML(t('optionsContextMenus_topLevel', path))}" title="${escapeHTML(t('optionsContextMenus_topLevelTitle'))}">
                    ${iconHTML('star', { filled: menu.favorite })}
                </button>
                <button type="button" class="joorney-switch" role="switch" data-action="toggle" data-id="${escapeHTML(menu.id)}" aria-checked="${menu.active}" aria-label="${escapeHTML(t('optionsContextMenus_on', path))}"></button>
                <div class="joorney-cm-rel">
                    <button type="button" class="joorney-icon-btn is-small" data-action="menu" data-id="${escapeHTML(menu.id)}" aria-haspopup="menu" aria-expanded="${menuOpen}" aria-label="${escapeHTML(t('optionsContextMenus_more', path))}">
                        ${iconHTML('more_vert')}
                    </button>
                    ${popover}
                </div>
            </div>
        `;
    }

    // Parents in gray, the menu name (last segment) in bold
    pathHTML(segments) {
        return segments
            .map((segment, index) => {
                const cls = index === segments.length - 1 ? 'joorney-cm-name' : 'joorney-cm-parent';
                return `<span class="${cls}">${escapeHTML(segment)}</span>`;
            })
            .join(iconHTML('chevron_right', { classes: 'joorney-cm-sep' }));
    }

    // Asks inline (Cancel / Delete, no confirm()): the question takes the place of the row and names its menu
    askRowHTML(menu) {
        const question = t('optionsContextMenus_confirmDelete', menu.path);
        return `
            <div class="joorney-cm-row is-confirm">
                <div class="joorney-ask joorney-cm-ask" role="group" aria-label="${escapeHTML(question)}">
                    <span>${escapeHTML(question)}</span>
                    <button type="button" class="joorney-btn is-secondary is-small" data-action="cancel">${escapeHTML(t('optionsContextMenus_cancel'))}</button>
                    <button type="button" class="joorney-btn is-small" data-action="confirm-delete" data-id="${escapeHTML(menu.id)}">${escapeHTML(t('optionsContextMenus_deleteButton'))}</button>
                </div>
            </div>
        `;
    }

    editRowHTML(menu, inApp, editValue) {
        const value = editValue ?? menu.path;
        const error = this.editError;
        return `
            <div class="joorney-cm-row is-edit${inApp ? ' is-in' : ''}">
                <div class="joorney-cm-editfield">
                    <input type="text" class="joorney-input" id="${EDIT_PATH_ID}" value="${escapeHTML(value)}" autocomplete="off" spellcheck="false" aria-label="${escapeHTML(t('optionsContextMenus_path'))}" aria-invalid="${Boolean(error)}"${error ? ` aria-describedby="${EDIT_PATH_ID}_error"` : ''}>
                    ${error ? `<p class="joorney-error joorney-cm-error" id="${EDIT_PATH_ID}_error" role="alert">${iconHTML('error')}${escapeHTML(error)}</p>` : ''}
                </div>
                <button type="button" class="joorney-btn is-secondary is-small" data-action="cancel">${escapeHTML(t('optionsContextMenus_cancel'))}</button>
                <button type="button" class="joorney-btn is-small" data-action="save-edit" data-id="${escapeHTML(menu.id)}">${iconHTML('check')}<span>${escapeHTML(t('optionsContextMenus_save'))}</span></button>
            </div>
        `;
    }

    emptyHTML() {
        const count = Object.keys(this.defaultSettings[this.menusKey]).length;
        return `
            <div class="joorney-empty joorney-cm-empty">
                <p>${escapeHTML(t('optionsContextMenus_empty'))}</p>
                <button type="button" class="joorney-btn is-secondary is-small" data-action="add-defaults">
                    ${iconHTML('settings')}<span>${escapeHTML(t('optionsContextMenus_addDefaults', String(count)))}</span>
                </button>
            </div>
        `;
    }

    // Same grouping as getFeaturesItems in src/contextmenu/manager.js: keep both in sync
    previewGroups(menus) {
        const active = menus.filter((m) => m.active);
        const favoriteCount = menus.filter((m) => m.favorite).length;
        const grouped = favoriteCount !== active.length && active.length > 1;
        return {
            grouped,
            top: grouped ? active.filter((m) => m.favorite) : active,
            sub: grouped ? active.filter((m) => !m.favorite) : [],
        };
    }

    // The chips of the preview header, visible while the preview is collapsed
    previewCountsHTML({ grouped, top, sub }) {
        const subChip = grouped
            ? `<span class="joorney-chip">${escapeHTML(t('optionsContextMenus_subCount', String(sub.length)))}</span>`
            : '';
        return `<span class="joorney-chip is-version">${escapeHTML(t('optionsContextMenus_topCount', String(top.length)))}</span>${subChip}`;
    }

    previewHTML(menus) {
        const { grouped, top, sub } = this.previewGroups(menus);
        // The star only tells the starred menus apart when the others are in the submenu
        const item = (menu, starred) =>
            `<div class="joorney-cm-pi">${escapeHTML(menu.path)}${starred ? iconHTML('star', { filled: true, classes: 'joorney-cm-pstar' }) : ''}</div>`;
        const bar = '<div class="joorney-cm-pi is-skeleton" aria-hidden="true"><span></span></div>';
        const separator = '<div class="joorney-cm-psep" aria-hidden="true"></div>';
        const topRows = top.map((menu) => item(menu, grouped));
        const parentTop = PREVIEW_JOORNEY_TOP + top.length * PREVIEW_ROW;
        // Chrome groups the entries under the built name (dev or prod), t() reads the source messages
        const extensionName = I18n.getMessage('ext_name') || 'Joorney';

        return `
            <div class="joorney-cm-pmenu">
                ${bar}${bar}${separator}${bar}${separator}
                <div class="joorney-cm-pi is-open"><img class="joorney-cm-plogo" src="/images/icon_128.png" alt="">${escapeHTML(extensionName)}${iconHTML('chevron_right', { classes: 'joorney-cm-parrow' })}</div>
            </div>
            <div class="joorney-cm-pmenu" style="margin-top: ${PREVIEW_JOORNEY_TOP}px">
                ${top.length || grouped ? topRows.join('') : `<div class="joorney-cm-pi is-dim">${escapeHTML(t('optionsContextMenus_previewNone'))}</div>`}
                ${grouped ? `<div class="joorney-cm-pi is-open">${escapeHTML(featureName(configuration))}${iconHTML('chevron_right', { classes: 'joorney-cm-parrow' })}</div>` : ''}
                ${separator}
                <div class="joorney-cm-pi is-dim">${escapeHTML(t('contextMenu_clearCache'))}</div>
                <div class="joorney-cm-pi is-dim">${escapeHTML(t('contextMenu_openOptions'))}</div>
            </div>
            ${grouped ? `<div class="joorney-cm-pmenu" style="margin-top: ${parentTop}px">${sub.map((menu) => item(menu, false)).join('')}</div>` : ''}
        `;
    }

    // Closes the ⋮ menu without a render, so the click that moved the focus still reaches its button
    closeMenu() {
        if (!this.menuId) return;
        const id = this.menuId;
        // Cleared first: removing the focused menu fires focusout, which calls this again
        this.menuId = null;
        const list = document.getElementById(LIST_ID);
        list.querySelector('.joorney-cm-pop')?.remove();
        list.querySelector(`[data-action="menu"][data-id="${CSS.escape(id)}"]`)?.setAttribute('aria-expanded', 'false');
    }

    setup() {
        const input = document.getElementById(NEW_PATH_ID);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.run(() => this.create());
            }
        });
        input.addEventListener('input', () => this.showAddError(''));
        document
            .getElementById('joorney_contextOdooMenus_new_save')
            .addEventListener('click', () => this.run(() => this.create()));

        document.getElementById(FILTER_ID).addEventListener('input', (event) => {
            this.filter = event.target.value;
            this.menuId = null;
            this.render();
        });

        const box = document.getElementById(BOX_ID);
        const empty = document.getElementById(EMPTY_ID);
        const list = document.getElementById(LIST_ID);
        const actions = {
            favorite: (id) => this.run(() => this.favorite(id)),
            toggle: (id) => this.run(() => this.toggle(id)),
            menu: (id) => {
                const opening = this.menuId !== id;
                this.closeMenu();
                if (!opening) return;
                this.menuId = id;
                this.render('.joorney-cm-pop [role="menuitem"]');
            },
            move: (id) => this.run(() => this.favorite(id, 'menu')),
            edit: (id) => {
                this.menuId = null;
                this.editingId = id;
                this.pendingId = null;
                this.editError = '';
                this.render(`#${EDIT_PATH_ID}`);
            },
            'save-edit': (id) => this.run(() => this.saveEdit(id)),
            delete: (id) => {
                this.menuId = null;
                this.pendingId = id;
                this.editingId = null;
                this.render('[data-action="cancel"]');
            },
            'confirm-delete': (id) => this.run(() => this.remove(id)),
            'delete-all': () => {
                this.pendingId = ALL;
                this.editingId = null;
                this.render('[data-action="cancel"]');
            },
            'confirm-delete-all': () => this.run(() => this.removeAll()),
            'add-defaults': () => this.run(() => this.addDefaults()),
            app: (_id, button) => {
                this.openApps.set(button.dataset.app, button.getAttribute('aria-expanded') !== 'true');
                this.render(`[data-action="app"][data-app="${CSS.escape(button.dataset.app)}"]`);
            },
            off: () => {
                this.offOpen = !this.offOpen;
                this.render('[data-action="off"]');
            },
            cancel: () => this.cancel(),
        };
        const onClick = (event) => {
            const button = event.target.closest('[data-action]');
            if (button) actions[button.dataset.action]?.(button.dataset.id, button);
        };
        box.addEventListener('click', onClick);
        empty.addEventListener('click', onClick);

        box.addEventListener('keydown', (event) => this.onKeyDown(event));
        // Focus leaving the ⋮ menu (Tab, a click elsewhere) closes it
        list.addEventListener('focusout', (event) => {
            if (this.menuId && !event.target.closest('.joorney-cm-rel')?.contains(event.relatedTarget)) {
                this.closeMenu();
            }
        });
        this.setupDrag(list);
    }

    onKeyDown(event) {
        const target = event.target;
        if (target.id === EDIT_PATH_ID && event.key === 'Enter') {
            event.preventDefault();
            const id = this.editingId;
            this.run(() => this.saveEdit(id));
            return;
        }
        if (target.dataset.action === 'grip' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            event.preventDefault();
            this.run(() => this.step(target.dataset.id, event.key === 'ArrowUp' ? -1 : 1));
            return;
        }
        if (this.menuId && target.getAttribute('role') === 'menuitem' && /^Arrow(Up|Down)$/.test(event.key)) {
            event.preventDefault();
            const items = [...target.closest('[role="menu"]').querySelectorAll('[role="menuitem"]')];
            const next = items.indexOf(target) + (event.key === 'ArrowUp' ? -1 : 1);
            items[(next + items.length) % items.length].focus();
            return;
        }
        if (event.key !== 'Escape') return;
        if (this.menuId) {
            event.preventDefault();
            const id = this.menuId;
            this.closeMenu();
            document.querySelector(`#${LIST_ID} [data-action="menu"][data-id="${CSS.escape(id)}"]`)?.focus();
        } else if (this.editingId || this.pendingId) {
            event.preventDefault();
            this.cancel();
        }
    }

    // Native drag and drop; the classes change in place during the drag, the list renders once, on the drop
    setupDrag(list) {
        let over = null;
        const setOver = (element) => {
            over?.classList.remove('is-over');
            over = element;
            over?.classList.add('is-over');
        };
        const targetOf = (event) => event.target.closest('[data-drop], .joorney-cm-row[data-id]');

        list.addEventListener('dragstart', (event) => {
            const row = event.target.closest('.joorney-cm-row[draggable="true"]');
            if (!row) return;
            this.closeMenu();
            this.dragId = row.dataset.id;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', this.menus[this.dragId].path);
            row.classList.add('is-dragging');
        });
        list.addEventListener('dragover', (event) => {
            const target = targetOf(event);
            if (!this.canDrop(this.menus[this.dragId], target)) {
                setOver(null);
                return;
            }
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setOver(target);
        });
        list.addEventListener('drop', async (event) => {
            const target = targetOf(event);
            const menu = this.menus[this.dragId];
            setOver(null);
            this.dragId = null;
            if (!this.canDrop(menu, target)) return;
            event.preventDefault();
            await this.run(() => this.drop(menu, target));
        });
        list.addEventListener('dragend', () => {
            setOver(null);
            list.querySelector('.is-dragging')?.classList.remove('is-dragging');
            this.dragId = null;
        });
    }

    // Back to the button that opened the edit or the question
    cancel() {
        const focus =
            this.pendingId === ALL
                ? '[data-action="delete-all"]'
                : this.rowFocus(this.editingId ?? this.pendingId, 'menu');
        this.editingId = null;
        this.pendingId = null;
        this.editError = '';
        this.render(focus);
    }
    //#endregion
}
