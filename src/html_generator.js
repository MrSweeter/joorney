export function stringToHTML(str) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    return template.content.firstChild;
}

export function generateLimitedFeatureOptionButtonItem(feature) {
    return stringToHTML(`
		<label
			title="[Limited Feature] ${feature.display_name ?? feature.id}"
			for="qol_${feature.id}_limited_feature"
		>
			<input id="qol_${feature.id}_limited_feature" class="input-hide" type="checkbox" />
			<div class="limited-feature-wrapper d-flex">
				<i class="qol-font-icon-size fa-regular me-2"></i>
				<p>${feature.display_name ?? feature.id}</p>
			</div>
		</label>
	`);
}

export function generateFeatureOptionListItem(feature) {
    const icon = feature.icon.join('\n');

    return stringToHTML(`
		<label
			id="qol_${feature.id}_feature"
			title="[Feature] ${feature.display_name ?? feature.id}"
			data-feature="${feature.id}"
			class="draggable-feature" draggable="true"
		>
			<div class="feature-wrapper d-flex">
				<div class="icon-wrapper pe-1">
					${icon}
				</div>
				<p>${feature.display_name ?? feature.id}</p>
			</div>
		</label>
	`);
}

export function generateFeatureOptionTableHeadItem(feature) {
    const icon = feature.icon.join('\n');

    return stringToHTML(`
		<th title="[Feature Origin] ${feature.display_name ?? feature.id}" class="icon-wrapper-head">
			<div class="icon-wrapper" id="qol_origins_filter_feature_header_${feature.id}">
				${icon}
			</div>
		</th>
	`);
}

export function generateFeaturePopupToggleItem(feature) {
    const icon = feature.icon.join('\n');

    return stringToHTML(`
		<label
			title="[Feature] ${feature.display_name ?? feature.id}"
			for="${feature.id}Feature"
			class="m-2 d-flex justify-content-center align-items-center"
		>
			<input id="${feature.id}Feature" type="checkbox" />
			<div class="icon-wrapper ${feature.limited ? 'limited-feature' : ''}">
				${icon}
			</div>
		</label>
	`);
}

export function generateTabFeaturePopupToggleItem(feature) {
    const icon = feature.icon.join('\n');

    return stringToHTML(`
		<label
			title="[Feature Origin] ${feature.display_name ?? feature.id}"
			for="${feature.id}FeatureTab"
			class="mx-1"
		>
			<input id="${feature.id}FeatureTab" type="checkbox" />
			<div class="icon-wrapper-tab">
				${icon}
			</div>
		</label>
	`);
}
