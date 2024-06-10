// https://github.com/callumlocke/json-formatter

export function handleExpanderClick() {
    for (const element of document.getElementsByClassName('expander')) {
        element.onclick = onClickExpander;
    }
}

function onClickExpander(event) {
    event.preventDefault();
    const parent = event.target.parentNode;

    // Expand or collapse
    if (parent.classList.contains('json-collapsed')) {
        // EXPAND
        if (event.metaKey || event.ctrlKey) {
            const gp = parent.parentNode;
            expand(gp.children, event.shiftKey);
            return;
        }
        expand([parent], event.shiftKey);
        return;
    }

    // COLLAPSE
    if (event.metaKey || event.ctrlKey) {
        const gp = parent.parentNode;
        collapse(gp.children, event.shiftKey);
        return;
    }
    collapse([parent], event.shiftKey);
}

// (CSS shows/hides the contents and hides/shows an ellipsis.)
function collapse(elements, recursive = false) {
    for (const el of elements) {
        el.classList.add('json-collapsed');
        if (recursive) {
            for (const sel of el.getElementsByClassName('jsonEntry')) {
                sel.classList.add('json-collapsed');
            }
        }
    }
}

function expand(elements, recursive = false) {
    for (const el of elements) {
        el.classList.remove('json-collapsed');
        if (recursive) {
            for (const sel of el.getElementsByClassName('jsonEntry')) {
                sel.classList.remove('json-collapsed');
            }
        }
    }
}
