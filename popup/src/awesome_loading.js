function loadAwesomeLoading(configuration) {
    const awesomeLoadingLargeFeature = document.getElementById('awesomeLoadingLargeFeature');
    awesomeLoadingLargeFeature.onchange = updateAwesomeLoadingLarge;

    awesomeLoadingLargeFeature.checked = configuration.awesomeLoadingLargeEnabled;
    updateRenderAwesomeLoadingLarge(configuration.awesomeLoadingLargeEnabled);

    const awesomeLoadingSmallFeature = document.getElementById('awesomeLoadingSmallFeature');
    awesomeLoadingSmallFeature.onchange = updateAwesomeLoadingSmall;

    awesomeLoadingSmallFeature.checked = configuration.awesomeLoadingSmallEnabled;
    updateRenderAwesomeLoadingSmall(configuration.awesomeLoadingSmallEnabled);
}

async function updateAwesomeLoadingLarge(e) {
    const checked = e.target.checked;
    await chrome.storage.sync.set({ awesomeLoadingLargeEnabled: checked });
    updateOptionPage({ enableAwesomeLoadingLarge: checked });

    updateRenderAwesomeLoadingLarge(checked);
}
async function updateAwesomeLoadingSmall(e) {
    const checked = e.target.checked;
    await chrome.storage.sync.set({ awesomeLoadingSmallEnabled: checked });
    updateOptionPage({ enableAwesomeLoadingSmall: checked });

    updateRenderAwesomeLoadingSmall(checked);
}

async function updateRenderAwesomeLoadingLarge(checked) {
    updateRenderAwesomeLoading(checked, true);
}
async function updateRenderAwesomeLoadingSmall(checked) {
    updateRenderAwesomeLoading(checked, false);
}

async function updateRenderAwesomeLoading(checked, large) {
    const awesomeLoadingImage = document.getElementById(
        large ? 'updateAwesomeLoadingLargeImage' : 'updateAwesomeLoadingSmallImage'
    );
    const awesomeLoadingImagePreview = document.getElementById(
        large ? 'awesomeLoadingLargeImagePreview' : 'awesomeLoadingSmallImagePreview'
    );
    const configuration = await chrome.storage.sync.get({
        awesomeLoadingLargeImage: '',
        awesomeLoadingSmallImage: '',
        awesomeLoadingImages: [],
    });
    const configurationImage = large
        ? configuration.awesomeLoadingLargeImage
        : configuration.awesomeLoadingSmallImage;

    awesomeLoadingImage.innerHTML = `<option value="" selected>${chrome.i18n.getMessage(
        'generic_default'
    )}</option>`;
    awesomeLoadingImage.disabled = !checked;
    awesomeLoadingImagePreview.src = configurationImage;
    awesomeLoadingImagePreview.style.opacity = checked ? 1 : 0.25;

    configuration.awesomeLoadingImages.forEach((img) => {
        const opt = document.createElement('option');
        opt.innerHTML = img;
        opt.value = img;
        opt.selected = configurationImage === img;
        awesomeLoadingImage.appendChild(opt);
    });

    if (configuration.awesomeLoadingImages.length <= 0) {
        awesomeLoadingImage.disabled = true;
        awesomeLoadingImage.style.opacity = 0.25;

        const optionButton = document.createElement('div');
        optionButton.style.cursor = 'pointer';
        optionButton.innerHTML = '<i class="fa-solid fa-up-right-from-square"></i>';
        optionButton.onclick = () => chrome.runtime.openOptionsPage();

        awesomeLoadingImage.parentNode.appendChild(optionButton);
    }

    awesomeLoadingImage.onchange = async (e) => {
        let value = e.target.value;
        await chrome.storage.sync.set(
            large ? { awesomeLoadingLargeImage: value } : { awesomeLoadingSmallImage: value }
        );
        const preview = document.getElementById(
            large ? 'awesomeLoadingLargeImagePreview' : 'awesomeLoadingSmallImagePreview'
        );
        preview.src = value;
        updateAwesomeLoadingTabs(value, large);
    };

    updateAwesomeLoadingTabs(checked ? configurationImage : false, large);
}

function updateAwesomeLoadingTabs(img, large) {
    // The wildcard * for scheme only matches http or https
    // Same url pattern than content_scripts in manifest
    chrome.tabs.query({ url: '*://*/*' }, (tabs) => {
        tabs.forEach((t) =>
            chrome.tabs.sendMessage(
                t.id,
                large
                    ? { awesomeLoadingLargeImage: img, url: t.url }
                    : { awesomeLoadingSmallImage: img, url: t.url }
            )
        );
    });
}
