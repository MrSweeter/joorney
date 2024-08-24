export async function getAnnounceData() {
    const source = 'https://raw.githubusercontent.com/MrSweeter/joorney/master/store/announce.json' ?? {};
    try {
        const response = await fetch(source);
        if (!response.ok) return {};
        return await response.json();
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
    return {};
}
