export function setupDropzone(drop, input, onFile) {
    input.onchange = () => {
        if (input.files[0]) onFile(input.files[0]);
    };
    drop.ondragover = (e) => {
        if (!e.dataTransfer?.types.includes('Files')) return;
        e.preventDefault();
        drop.classList.add('is-over');
    };
    drop.ondragleave = (e) => {
        if (!drop.contains(e.relatedTarget)) drop.classList.remove('is-over');
    };
    drop.ondrop = (e) => {
        e.preventDefault();
        drop.classList.remove('is-over');
        const file = e.dataTransfer?.files[0];
        if (file) onFile(file);
    };
}
