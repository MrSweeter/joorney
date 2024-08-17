export function setCancellableTimeout(callback, ms) {
    const timeoutID = setTimeout(callback, ms);
    return {
        clear: () => clearTimeout(timeoutID),
        trigger: () => {
            clearTimeout(timeoutID);
            callback();
        },
    };
}
