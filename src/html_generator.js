export function stringToHTML(str) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    return template.content.firstChild;
}

export function generateLimiteFeatureOptionButtonItem(feature) {
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
