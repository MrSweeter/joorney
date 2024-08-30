import { getSunSchedule, setSunSchedule } from './local.js';

export async function getSunRiseSunSet(latitude, longitude) {
    let today = new Date();
    today = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`;
    const cached = await getSunSchedule();

    if (cached.joorney_sunrise && cached.joorney_sunset && cached.joorney_date === today) {
        return cached;
    }

    // Timezone related to coordinates
    const response = await fetch(`https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}`);

    const json = await response.json();

    let sunrise = json.results.sunrise.split(':');
    sunrise =
        Number.parseInt(sunrise[0]) * 60 + Number.parseInt(sunrise[1]) + (sunrise[2].endsWith('PM') ? 12 * 60 : 0);

    let sunset = json.results.sunset.split(':');
    sunset = Number.parseInt(sunset[0]) * 60 + Number.parseInt(sunset[1]) + (sunset[2].endsWith('PM') ? 12 * 60 : 0);

    const data = {
        joorney_sunrise: sunrise,
        joorney_sunset: sunset,
        joorney_date: today,
    };

    await setSunSchedule(data);
    return data;
}
