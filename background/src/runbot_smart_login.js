export async function getFinalRunbotURL(request) {
    const response = await fetch(request.href, {
        method: 'HEAD',
    });
    return { url: response.url };
}
