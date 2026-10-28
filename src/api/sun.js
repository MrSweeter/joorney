import { Console } from '../utils/browser.js';
import { getSunSchedule, setSunSchedule } from './local.js';

// "7:12:34 AM" -> minutes since midnight
function parseTime12h(timeStr) {
    const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i.exec(`${timeStr ?? ''}`.trim());
    if (!match) return undefined;
    const hours = Number.parseInt(match[1]) % 12;
    const minutes = Number.parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    return (hours + (isPM ? 12 : 0)) * 60 + minutes;
}

export async function getSunRiseSunSet(latitude, longitude) {
    let today = new Date();
    today = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`;
    const cached = await getSunSchedule();

    if (cached.joorney_sunrise && cached.joorney_sunset && cached.joorney_date === today) {
        return cached;
    }

    try {
        // Timezone related to coordinates
        const response = await fetch(`https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}`);
        if (!response.ok) throw new Error(`HTTP ${response.status} while fetching sunrise/sunset`);

        const json = await response.json();

        // null during polar day/night
        const sunrise = parseTime12h(json.results?.sunrise);
        const sunset = parseTime12h(json.results?.sunset);
        if (sunrise === undefined || sunset === undefined) return undefined;

        const data = {
            joorney_sunrise: sunrise,
            joorney_sunset: sunset,
            joorney_date: today,
        };

        await setSunSchedule(data);
        return data;
    } catch (err) {
        Console.warn(err);
        return undefined;
    }
}
