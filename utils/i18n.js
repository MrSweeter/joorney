function loadInternationalization() {
    document.querySelectorAll('[data-i18n]').forEach((item) => {
        item.innerHTML = chrome.i18n.getMessage(item.getAttribute('data-i18n'));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((item) => {
        item.title = chrome.i18n.getMessage(item.getAttribute('data-i18n-title'));
    });

    document.querySelectorAll('[data-i18n-alt]').forEach((item) => {
        item.alt = chrome.i18n.getMessage(item.getAttribute('data-i18n-alt'));
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((item) => {
        item.placeholder = chrome.i18n.getMessage(item.getAttribute('data-i18n-placeholder'));
    });
}

loadInternationalization();
