import { StorageLocal } from '../../utils/browser';

export async function getCurrentWeather(latitude, longitude) {
    const shortLatitude = Math.round(latitude * 100) / 100.0;
    const shortLongitude = Math.round(longitude * 100) / 100.0;

    let today = new Date();
    today = today.getMonth() + 1 + '-' + today.getDate() + '-' + today.getFullYear();
    const locdate = `${today}_${shortLatitude}_${shortLongitude}`;

    const cached = await StorageLocal.get({
        qol_weather: null,
        qol_locdate: '',
    });

    const currentHour = new Date().getHours();

    if (cached.qol_weather && cached.qol_locdate === locdate) {
        return cached;
    }

    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=rain,showers,snowfall&timeformat=unixtime&forecast_days=1`
    );

    const json = await response.json();

    const data = {
        qol_locdate: locdate,
        qol_weather: {
            rain: json.hourly.rain[currentHour],
            showers: json.hourly.showers[currentHour],
            snowfall: json.hourly.snowfall[currentHour],
        },
    };

    await StorageLocal.set(data);
    return data;
}

export async function getSunRiseSunSet(latitude, longitude) {
    let today = new Date();
    today = today.getMonth() + 1 + '-' + today.getDate() + '-' + today.getFullYear();
    const cached = await StorageLocal.get({
        qol_sunrise: 0,
        qol_sunset: 23 * 60 + 59,
        qol_date: '',
    });

    if (cached.qol_sunrise && cached.qol_sunset && cached.qol_date === today) {
        return cached;
    }

    const response = await fetch(
        `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}`
    );

    const json = await response.json();

    let sunrise = json.results.sunrise.split(':');
    sunrise =
        parseInt(sunrise[0]) * 60 +
        parseInt(sunrise[1]) +
        (sunrise[2].endsWith('PM') ? 12 * 60 : 0);

    let sunset = json.results.sunset.split(':');
    sunset =
        parseInt(sunset[0]) * 60 + parseInt(sunset[1]) + (sunset[2].endsWith('PM') ? 12 * 60 : 0);

    const data = {
        qol_sunrise: sunrise,
        qol_sunset: sunset,
        qol_date: today,
    };

    await StorageLocal.set(data);
    return data;
}
