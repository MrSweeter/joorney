import JoorneyStyle from './html_generator.css';
import { featureName, t } from './utils/i18n.js';

//#region Joorney injected style
// Everything Joorney injects in Odoo pages (simulated data, copies, action buttons) shares this look.
// It must stay obviously different from standard Odoo (no o_* / o-mail-* classes, no Odoo colors),
// users should never mistake simulated data for real records. Style in html_generator.css (inlined at build).
const JoorneyStyleElementID = 'joorney-injected-style';

export function ensureJoorneyStyle() {
    if (document.getElementById(JoorneyStyleElementID)) return;
    const style = document.createElement('style');
    style.id = JoorneyStyleElementID;
    style.textContent = JoorneyStyle;
    (document.head ?? document.documentElement).appendChild(style);
}

const fakeDataTitle = () => t('common_fakeDataTitle');

// [ODOO] 20.0+ icons are Material Symbols (oi + data-icon ligature), Font Awesome before.
// Detected from the page: generators have no version context. The 20.0 font is a subset, only use
// icon names already used by Odoo itself.
function hasMaterialIcons() {
    return document.querySelector('.oi[data-icon]') !== null;
}

/**
 * @param {{fa: string, oi?: string}} icon Font Awesome class and Material Symbols name
 */
function iconHTML(icon) {
    if (!icon) return '';
    if (icon.oi && hasMaterialIcons())
        return `<i class="oi" data-icon="${escapeHTML(icon.oi)}" aria-hidden="true"></i>`;
    return `<i class="fa ${escapeHTML(icon.fa)}" aria-hidden="true"></i>`;
}
const injectedTitle = (title) =>
    title ? `${title}\n${t('common_injectedButtonTitle')}` : t('common_injectedButtonTitle');
//#endregion

export function escapeHTML(value) {
    return `${value ?? ''}`
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function stringToHTML(str) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    return template.content.firstChild;
}

export function generateLimitedFeatureOptionButtonItem(feature) {
    return stringToHTML(`
		<label
			title="[Limited Feature] ${escapeHTML(featureName(feature))}"
			for="joorney_${feature.id}_limited_feature"
		>
			<input id="joorney_${feature.id}_limited_feature" class="input-hide" type="checkbox" />
			<div class="limited-feature-wrapper d-flex">
				<i class="joorney-font-icon-size fa-regular me-2"></i>
				<p>${escapeHTML(featureName(feature))}</p>
			</div>
		</label>
	`);
}

export function generateFeatureOptionListItem(feature) {
    return stringToHTML(`
		<label
			id="joorney_${feature.id}_feature"
			title="[Feature] ${escapeHTML(featureName(feature))}"
			data-feature="${feature.id}"
			class="draggable-feature" draggable="true"
		>
			<div class="feature-wrapper d-flex">
				<div class="icon-wrapper pe-1">
					${feature.icon}
				</div>
				<p>${escapeHTML(featureName(feature))}</p>
			</div>
		</label>
	`);
}

export function generateFeatureOptionTableHeadItem(feature) {
    return stringToHTML(`
		<th title="[Feature Origin] ${escapeHTML(featureName(feature))}" class="icon-wrapper-head">
			<div class="icon-wrapper" id="joorney_origins_filter_feature_header_${feature.id}">
				${feature.icon}
			</div>
		</th>
	`);
}

export function generateFeaturePopupToggleItem(feature) {
    return stringToHTML(`
		<label
			title="${escapeHTML(t('popup_featureTitle', featureName(feature)))}"
			for="${feature.id}Feature"
			class="m-2 d-flex justify-content-center align-items-center"
		>
			<input id="${feature.id}Feature" type="checkbox" />
			<div class="icon-wrapper ${feature.limited ? 'limited-feature' : ''}">
				${feature.icon}
			</div>
		</label>
	`);
}

export function generateTabFeaturePopupToggleItem(feature) {
    return stringToHTML(`
		<label
			title="${escapeHTML(t('popup_featureOriginTitle', featureName(feature)))}"
			for="${feature.id}FeatureTab"
			class=""
		>
			<input id="${feature.id}FeatureTab" type="checkbox" />
			<div class="icon-wrapper-tab">
				${feature.icon}
			</div>
		</label>
	`);
}

//#region Simulated data & copies
function formatDateTime(date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

/**
 * Simulated many2one/many2many value: our own pill, never Odoo o_tag markup.
 * `extraClass` lets the caller add its cleanup marker.
 */
export function generateUserAvatarTag(userName, avatarSrc, extraClass = '') {
    ensureJoorneyStyle();
    return stringToHTML(`
		<span class="joorney-sim joorney-sim-inline ${extraClass}" title="${escapeHTML(`${userName}\n${fakeDataTitle()}`)}">
			<img src="${escapeHTML(avatarSrc)}" alt="" />
			<span class="text-truncate">${escapeHTML(userName)}</span>
			<span class="joorney-sim-mark">J</span>
		</span>
	`);
}

/**
 * Simulated plain field value (e.g. a date).
 */
export function generateSimulatedValue(text, extraClass = '') {
    ensureJoorneyStyle();
    return stringToHTML(`
		<span class="joorney-sim joorney-sim-inline ${extraClass}" title="${escapeHTML(fakeDataTitle())}">
			<span class="joorney-sim-mark">J</span>
			<span class="text-truncate">${escapeHTML(text)}</span>
		</span>
	`);
}

/**
 * Simulated chatter tracking message. The content keeps the original Odoo message markup (it mimics a real
 * tracking message), only the frame around it is Joorney.
 * `isWarning` false means a concurrent change was detected: the UI may be wrong, frame shown in red.
 */
export function generateTrackingMessage({
    authorName,
    newValue,
    fieldName,
    avatarSrc,
    date,
    isWarning,
    extraClass = '',
}) {
    ensureJoorneyStyle();
    return stringToHTML(`
		<div
			class="joorney-sim joorney-sim-frame ${isWarning ? '' : 'joorney-sim--error'} ${extraClass}"
			data-joorney-badge="${escapeHTML(t('common_simulatedBadge'))}"
			title="${escapeHTML(fakeDataTitle())}"
		>
			<div class="o-mail-Message position-relative py-1 px-3">
				<div class="o-mail-Message-core position-relative d-flex flex-shrink-0">
					<div class="o-mail-Message-sidebar d-flex flex-shrink-0">
						<div class="o-mail-Message-avatarContainer position-relative bg-view rounded">
							<img class="o-mail-Message-avatar w-100 h-100 rounded o_object_fit_cover" src="${escapeHTML(avatarSrc)}" />
						</div>
					</div>
					<div class="w-100 o-min-width-0">
						<div class="o-mail-Message-header d-flex flex-wrap align-items-baseline mb-1 lh-1">
							<span class="o-mail-Message-author">
								<strong class="me-1 text-truncate">${escapeHTML(authorName)}</strong>
							</span>
							<small class="o-mail-Message-date text-muted opacity-75 me-2">- ${escapeHTML(formatDateTime(date))} - Joorney</small>
						</div>
						<div class="position-relative d-flex">
							<div class="o-mail-Message-content o-min-width-0">
								<div class="o-mail-Message-textContent position-relative d-flex">
									<div>
										<ul class="mb-0 ps-4">
											<li class="o-mail-Message-tracking mb-1">
												<span class="o-mail-Message-trackingOld me-1 px-1 text-muted fw-bold">?</span>
												<i class="o-mail-Message-trackingSeparator fa fa-long-arrow-right mx-1 text-600"></i>
												<span class="o-mail-Message-trackingNew me-1 fw-bold text-info">?, ${escapeHTML(newValue)}</span>
												<span class="o-mail-Message-trackingField ms-1 fst-italic text-muted">(${escapeHTML(fieldName)})</span>
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`);
}

/**
 * Copy of a real chatter message (pinned message): original Odoo message markup inside a Joorney frame,
 * without stripes to keep the body readable.
 * `hasOriginal`: true ([ODOO] 18.0+, reload highlighting the message) or the original element ([ODOO] <18.0).
 */
export function generateMessage(messageID, authorName, avatarSrc, bodyContent, date, hasOriginal) {
    ensureJoorneyStyle();
    const messageElement = stringToHTML(`
		<div class="joorney-sim joorney-sim--copy joorney-sim-frame mx-0" data-joorney-badge="${escapeHTML(t('common_simulatedBadge'))}">
			<div class="o-mail-Message position-relative py-1 px-3">
				<button
					type="button"
					class="joorney-sim-jump d-none btn btn-sm joorney-action-btn joorney-action-icon m-1 position-absolute top-0 end-0"
					style="z-index: 1;"
					title="${escapeHTML(t('common_jump'))}"
					aria-label="${escapeHTML(t('common_jump'))}"
				>
					${iconHTML({ fa: 'fa-arrow-right', oi: 'arrow_forward' })}
				</button>
				<div class="o-mail-Message-core position-relative d-flex flex-shrink-0">
					<div class="o-mail-Message-sidebar d-flex flex-shrink-0">
						<div class="o-mail-Message-avatarContainer position-relative bg-view rounded">
							<img class="o-mail-Message-avatar w-100 h-100 rounded o_object_fit_cover" src="${escapeHTML(avatarSrc)}" />
						</div>
					</div>
					<div class="w-100 o-min-width-0">
						<div class="o-mail-Message-header d-flex flex-wrap align-items-baseline mb-1 lh-1">
							<span class="o-mail-Message-author">
								<strong class="me-1 text-truncate">${escapeHTML(authorName)}</strong>
							</span>
							<small class="o-mail-Message-date text-muted opacity-75 me-2">- ${escapeHTML(formatDateTime(date))} - Joorney</small>
						</div>
						<div class="position-relative d-flex">
							<div class="o-mail-Message-content o-min-width-0">
								<div class="o-mail-Message-textContent position-relative d-flex">
									<div class="position-relative overflow-x-auto d-inline-block">
										<div class="o-mail-Message-bubble rounded-bottom-3 position-absolute top-0 start-0 w-100 h-100 rounded-end-3"></div>
										<div class="o-mail-Message-body position-relative text-break mb-0 w-100">${bodyContent}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`);

    if (hasOriginal) {
        const jumpTo = messageElement.querySelector('.joorney-sim-jump');
        jumpTo.onclick = () => {
            if (typeof hasOriginal === 'boolean') {
                // [ODOO] 18.0+
                const params = new URLSearchParams(window.location.search);
                params.set('highlight_message_id', messageID);
                window.location.search = params;
            } else {
                // [ODOO] <18.0
                hasOriginal.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
                hasOriginal.classList.remove('joorney-flash');
                // Restart the animation when jumping twice in a row
                void hasOriginal.offsetWidth;
                hasOriginal.classList.add('joorney-flash');
                setTimeout(() => hasOriginal.classList.remove('joorney-flash'), 1000);
            }
        };
        jumpTo.classList.remove('d-none');
    }

    return messageElement;
}
//#endregion

//#region Action buttons
/**
 * Button injected in an Odoo header (statusbar, knowledge header): Odoo button shape, Joorney colors.
 * `name` is kept as attribute: features find their buttons with getElementsByName.
 */
export function generateActionButton({ name, label, title, icon }) {
    ensureJoorneyStyle();
    return stringToHTML(`
		<button type="button" class="btn joorney-action-btn" name="${escapeHTML(name)}" title="${escapeHTML(injectedTitle(title))}">
			${iconHTML(icon)}
			<span>${escapeHTML(label)}</span>
		</button>
	`);
}

/**
 * Icon-only button, placed next to an input when there is no header to host a labelled button.
 * Same shape as the Odoo many2one external button (btn-sm).
 */
export function generateActionIconButton({ name, label, title, icon }) {
    ensureJoorneyStyle();
    const fullTitle = [label, title].filter(Boolean).join('\n');
    return stringToHTML(`
		<button
			type="button"
			class="btn btn-sm joorney-action-btn joorney-action-icon ms-2"
			name="${escapeHTML(name)}"
			title="${escapeHTML(injectedTitle(fullTitle))}"
			aria-label="${escapeHTML(label)}"
		>
			${iconHTML(icon)}
		</button>
	`);
}
//#endregion
