export async function getFinalRunbotURL(request) {
    try {
        const response = await fetch(request.href, {
            method: 'HEAD',
        });
        return { url: response.url };
    } catch (ex) {
        return {};
    }
}
