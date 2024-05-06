document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copyright-year').innerHTML = new Date().getFullYear();

    if (new URL(location.href).searchParams.get('odoo') != null) {
        document.getElementsByTagName('body')[0].classList.add('odoo-style');
    }
});
// TODO[DOCS/DYNAMIC HTML]
// TODO[DOCS/ONE PAGE WEBSITE]
