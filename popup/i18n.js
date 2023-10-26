function loadInternationalization() {
    document.querySelectorAll('[data-i18n]').forEach((item) => {
        item.innerText = chrome.i18n.getMessage(item.getAttribute('data-i18n'));
    });
}

loadInternationalization();
