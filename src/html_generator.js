const joorneySimulatedStyle = 'background-color: rgba(252, 163, 17, 0.25)';

export function stringToHTML(str) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    return template.content.firstChild;
}

export function generateLimitedFeatureOptionButtonItem(feature) {
    return stringToHTML(`
		<label
			title="[Limited Feature] ${feature.display_name ?? feature.id}"
			for="joorney_${feature.id}_limited_feature"
		>
			<input id="joorney_${feature.id}_limited_feature" class="input-hide" type="checkbox" />
			<div class="limited-feature-wrapper d-flex">
				<i class="joorney-font-icon-size fa-regular me-2"></i>
				<p>${feature.display_name ?? feature.id}</p>
			</div>
		</label>
	`);
}

export function generateFeatureOptionListItem(feature) {
    const icon = feature.icon.join('\n');

    return stringToHTML(`
		<label
			id="joorney_${feature.id}_feature"
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
			<div class="icon-wrapper" id="joorney_origins_filter_feature_header_${feature.id}">
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
			class=""
		>
			<input id="${feature.id}FeatureTab" type="checkbox" />
			<div class="icon-wrapper-tab">
				${icon}
			</div>
		</label>
	`);
}

export function generateUserAvatarTag(userName, avatarSrc) {
    const tagElement = stringToHTML(`
		<span class="o_tag position-relative d-inline-flex align-items-center mw-100 o_avatar pe-1 rounded joorney-simulated-ui-assignme" title="${userName}">
			<span
				class="position-absolute top-0 end-0 bottom-0 start-0 mx-n2 mt-n1 mb-n1 rounded border"
				style="${joorneySimulatedStyle}"
			></span>
			<img class="o_avatar o_m2m_avatar position-relative rounded" src="${avatarSrc}" />
			<div class="o_tag_badge_text text-truncate position-relative ms-1">${userName}</div>
		</span>
	`);

    return tagElement;
}

export function generateTrackingMessage(authorName, newValue, fieldName, avatarSrc, date) {
    const messageElement = stringToHTML(`
		<div class="o-mail-Message position-relative py-1 mt-2 px-3 joorney-simulated-ui-assignme">
			<span
				class="position-absolute top-0 end-0 bottom-0 start-0 mx-2 mt-n1 mb-n1 rounded border"
				style="${joorneySimulatedStyle}"
			></span>
			<div class="o-mail-Message-core position-relative d-flex flex-shrink-0">
				<div class="o-mail-Message-sidebar d-flex flex-shrink-0">
					<div class="o-mail-Message-avatarContainer position-relative bg-view rounded">
						<img class="o-mail-Message-avatar w-100 h-100 rounded o_object_fit_cover" src="${avatarSrc}" />
					</div>
				</div>
				<div class="w-100 o-min-width-0">
					<div class="o-mail-Message-header d-flex flex-wrap align-items-baseline mb-1 lh-1">
						<span class="o-mail-Message-author">
							<strong class="me-1 text-truncate">${authorName}</strong>
						</span>
						<small class="o-mail-Message-date text-muted opacity-75 me-2">- ${date.toLocaleDateString()} ${date.toLocaleTimeString()} - Joorney</small>
					</div>
					<div class="position-relative d-flex">
						<div class="o-mail-Message-content o-min-width-0">
							<div class="o-mail-Message-textContent position-relative d-flex">
								<div>
									<ul class="mb-0 ps-4">
										<li class="o-mail-Message-tracking mb-1">
											<span class="o-mail-Message-trackingOld me-1 px-1 text-muted fw-bold">?</span>
											<i class="o-mail-Message-trackingSeparator fa fa-long-arrow-right mx-1 text-600"></i>
											<span class="o-mail-Message-trackingNew me-1 fw-bold text-info">?, ${newValue}</span>
											<span class="o-mail-Message-trackingField ms-1 fst-italic text-muted">(${fieldName})</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`);
    return messageElement;
}

export function generateMessage(authorName, avatarSrc, bodyContent, date, original) {
    const messageElement = stringToHTML(`
		<div class="o-mail-Message position-relative py-1 mt-2 px-3 rounded border">
			<button class="o-mail-Message-jumpTo d-none btn m-1 position-absolute top-0 end-0 rounded-pill badge badge-secondary" style="z-index: 1;">
				Jump
			</button>
			<div class="o-mail-Message-core position-relative d-flex flex-shrink-0">
				<div class="o-mail-Message-sidebar d-flex flex-shrink-0">
					<div class="o-mail-Message-avatarContainer position-relative bg-view rounded">
						<img class="o-mail-Message-avatar w-100 h-100 rounded o_object_fit_cover" src="${avatarSrc}" />
					</div>
				</div>
				<div class="w-100 o-min-width-0">
					<div class="o-mail-Message-header d-flex flex-wrap align-items-baseline mb-1 lh-1">
						<span class="o-mail-Message-author">
							<strong class="me-1 text-truncate">${authorName}</strong>
						</span>
						<small class="o-mail-Message-date text-muted opacity-75 me-2">- ${date.toLocaleDateString()} ${date.toLocaleTimeString()} - Joorney</small>
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
	`);

    if (original) {
        const jumpTo = messageElement.querySelector('.o-mail-Message-jumpTo');
        jumpTo.onclick = () => {
            original.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
            original.style = joorneySimulatedStyle;
            setTimeout(() => {
                original.style = null;
            }, 1000);
        };
        jumpTo.classList.toggle('d-none');
    }

    return messageElement;
}
