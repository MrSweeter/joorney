import { StorageLocal, getUserLocation } from '../utils/browser.js';

export async function getWeatherSun(latitudeArg, longitudeArg) {
    let latitude = latitudeArg;
    let longitude = longitudeArg;
    if (!latitude || !longitude) {
        if (!navigator || !navigator.geolocation) return {};
        const coords = await getUserLocation();
        latitude = coords.latitude;
        longitude = coords.longitude;
    }

    const emptyHourly = Array(24).fill(0);

    let today = new Date();
    today = today.toDateString();

    const cached = await StorageLocal.get({
        joorney_sunrise: 0,
        joorney_sunset: 23 * 60 + 59,
        joorney_rain: emptyHourly,
        joorney_snowfall: emptyHourly,
        joorney_wind: emptyHourly,
        joorney_date: '',
    });
    console.log(cached);

    if (cached.joorney_sunrise && cached.joorney_sunset && cached.joorney_date === today) {
        return cached;
    }

    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
            latitude: latitude,
            longitude: longitude,
            hourly: 'rain,snowfall,wind_speed_10m,wind_direction_10m',
            daily: 'sunrise,sunset',
            timezone: 'GMT',
            forecast_days: 1,
            wind_speed_unit: 'kn',
            format: 'json',
            //timeformat: 'unixtime',
        })}`
    );

    const json = await response.json();
    if (json.error) return {};

    // Sunrise/Sunset
    let sunrise = new Date(
        json.daily_units.sunrise === 'iso8601' ? `${json.daily.sunrise[0]}Z` : json.daily.sunrise[1] * 1000
    );
    let sunset = new Date(
        json.daily_units.sunset === 'iso8601' ? `${json.daily.sunset[0]}Z` : json.daily.sunset[1] * 1000
    );
    sunrise = sunrise.getHours() * 60 + sunrise.getMinutes();
    sunset = sunset.getHours() * 60 + sunset.getMinutes();

    // Precipitation
    let rain = json.hourly.rain;
    let snowfall = json.hourly.snowfall;
    if (rain.length !== 24) rain = emptyHourly;
    if (snowfall.length !== 24) snowfall = emptyHourly;
    rain = json.hourly_units.rain === 'mm' ? rain : 0;
    snowfall = json.hourly_units.snowfall === 'cm' ? snowfall * 10 : 0;

    // Wind
    const windSpeed = json.hourly.wind_speed_10m;
    const windDirection = json.hourly.wind_direction_10m;
    if (windSpeed.length !== 24) rain = emptyHourly;
    if (windDirection.length !== 24) snowfall = emptyHourly;
    const wind = [];
    for (let i = 0; i < 24; i++) {
        wind.push({
            speed: windSpeed[i],
            direction: windDirection[i],
        });
    }

    const data = {
        joorney_sunrise: sunrise,
        joorney_sunset: sunset,
        joorney_rain: rain,
        joorney_snowfall: snowfall,
        joorney_wind: wind,
        joorney_date: today,
    };

    await StorageLocal.set(data);
    return data;
}

// min-max in mm
export const RAIN_TYPE = {
    LIGHT: {
        min: 0,
        max: 2.5,
        ambientMultiplier: 0.5,
        description: 'This is usually a gentle, continuous rain but not intense. It can last for several hours.',
    },
    MODERATE: {
        min: 2.5,
        max: 7.6,
        ambientMultiplier: 1,
        description:
            'A sustained rain, noticeable but not very heavy. It can lead to significant wetting over a shorter period.',
    },
    HEAVY: {
        min: 7.6,
        max: 16,
        ambientMultiplier: 2,
        description:
            'The rain becomes intense, and it may cause rapid accumulation of water, though not yet torrential.',
    },
    TORRENTIAL: {
        min: 16,
        max: 1000,
        ambientMultiplier: 3,
        description: 'Extremely intense rain, which can cause flooding quickly. Often associated with thunderstorms.',
    },
    findType(value) {
        for (const type in this) {
            if (typeof this[type] !== 'object') continue;
            const { min, max } = this[type];
            if (value >= min && value < max) {
                return type;
            }
        }
        return undefined;
    },
};

// min-max in mm
export const SNOW_TYPE = {
    LIGHT: {
        min: 0,
        max: 5,
        ambientMultiplier: 0.5,
        description:
            'Snow falls gently and slowly accumulates. This type of snow might fall for extended periods without causing significant accumulation.',
    },
    MODERATE: {
        min: 5,
        max: 10,
        ambientMultiplier: 1,
        description:
            'Snow falls at a steady rate, leading to more noticeable accumulation over time. Roads and surfaces may start to become covered within a few hours.',
    },
    HEAVY: {
        min: 10,
        max: 30,
        ambientMultiplier: 2,
        description:
            'Snow accumulates quickly, potentially causing visibility issues and hazardous road conditions. The snow is intense enough to build up significantly in a short period.',
    },
    INTENSE: {
        min: 30,
        max: 1000,
        ambientMultiplier: 3,
        description:
            'Extremely heavy snow, which can accumulate rapidly and cause dangerous conditions like reduced visibility, road closures, and snowdrifts. Often associated with blizzards or snowstorms.',
    },
    findType(value) {
        for (const type in this) {
            if (typeof this[type] !== 'object') continue;
            const { min, max } = this[type];
            if (value >= min && value < max) {
                return type;
            }
        }
        return undefined;
    },
};

// https://www.weather.gov/mfl/beaufort
// min-max in knots https://en.wikipedia.org/wiki/Knot_(unit)
export const WIND_TYPE = {
    CALM: {
        force: 0,
        min: 0,
        max: 1,
        description: 'Calm; smoke rises vertically. Sea like a mirror.',
    },
    LIGHT_AIR: {
        force: 1,
        min: 1,
        max: 3,
        description:
            'Direction of wind shown by smoke drift, but not by wind vanes. Ripples with the appearance of scales on the sea.',
    },
    LIGHT_BREEZE: {
        force: 2,
        min: 4,
        max: 6,
        description: 'Wind felt on face; leaves rustle; ordinary vanes moved by wind. Small wavelets on the sea.',
    },
    GENTLE_BREEZE: {
        force: 3,
        min: 7,
        max: 10,
        description: 'Leaves and small twigs in constant motion; wind extends light flag. Large wavelets on the sea.',
    },
    MODERATE_BREEZE: {
        force: 4,
        min: 11,
        max: 16,
        description: 'Raises dust and loose paper; small branches are moved. Small waves with white horses on the sea.',
    },
    FRESH_BREEZE: {
        force: 5,
        min: 17,
        max: 21,
        description:
            'Small trees in leaf begin to sway; crested wavelets form on inland waters. Moderate waves with many white horses on the sea.',
    },
    STRONG_BREEZE: {
        force: 6,
        min: 22,
        max: 27,
        description:
            'Large branches in motion; umbrellas used with difficulty. Large waves with extensive foam crests on the sea.',
    },
    NEAR_GALE: {
        force: 7,
        min: 28,
        max: 33,
        description:
            'Whole trees in motion; inconvenience felt when walking against the wind. Sea heaps up with white foam blown in streaks.',
    },
    GALE: {
        force: 8,
        min: 34,
        max: 40,
        description:
            'Breaks twigs off trees; generally impedes progress. Moderately high waves with streaks of foam on the sea.',
    },
    SEVERE_GALE: {
        force: 9,
        min: 41,
        max: 47,
        description:
            'Slight structural damage occurs; chimney-pots and slates removed. High waves with dense streaks of foam on the sea.',
    },
    STORM: {
        force: 10,
        min: 48,
        max: 55,
        description:
            'Trees uprooted; considerable structural damage occurs. Very high waves with long overhanging crests on the sea.',
    },
    VIOLENT_STORM: {
        force: 11,
        min: 56,
        max: 63,
        description:
            'Very rarely experienced; accompanied by wide-spread damage. Exceptionally high waves with foam and froth on the sea.',
    },
    // https://www.weather.gov/mfl/saffirsimpson
    HURRICANE: {
        force: 12,
        min: 64,
        max: 1000,
        description:
            'Widespread damage; trees uprooted. Air filled with foam and spray, sea completely white with driving spray.',
    },
    findType(speed) {
        for (const type in this) {
            if (typeof this[type] === 'object') {
                const { min, max } = this[type];
                if (speed >= min && speed < max) {
                    return type;
                }
            }
        }
        return undefined;
    },
};
