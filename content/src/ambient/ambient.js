const ambientPeriods = {
    compute: {
        easter: () => {
            // https://gist.github.com/johndyer/0dffbdd98c2046f41180c051f378f343
            const year = new Date().getFullYear();
            const f = Math.floor,
                // Golden Number - 1
                G = year % 19,
                C = f(year / 100),
                // related to Epact
                H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
                // number of days from 21 March to the Paschal full moon
                I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
                // weekday for the Paschal full moon
                J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
                // number of days from 21 March to the Sunday on or before the Paschal full moon
                L = I - J,
                month = 3 + f((L + 40) / 44),
                day = L + 28 - 31 * f(month / 4);

            return `${month}-${day}`;
        },
        /*birthday: () => {
            // TODO FROM USER INPUT
            return '12-27';
        },*/
    },
    season: {
        1: 'winter',
        2: 'winter',
        3: 'spring',
        4: 'spring',
        5: 'spring',
        6: 'summer',
        7: 'summer',
        8: 'summer',
        9: 'fall',
        10: 'fall',
        11: 'fall',
        12: 'winter',
    },
    '02-14': 'valentine',
    '03-17': 'patrick',
    '04-01': 'aprilfool',
    '10-31': 'halloween',
    '12-24': 'christmas_eve',
    '12-25': 'christmas',
    '12-24': 'newyear_eve',
    '12-25': 'newyear',
};

function isOdooHome() {
    const container = document.getElementsByClassName('o_apps');
    return container.length > 0;
}

function loadAmbient() {
    if (!isOdooHome()) return;

    const ambient = getTodayAmbient();
    switch (ambient) {
        case 'birthday': {
            _loadOneTimeAmbient(birthdayLoader);
            break;
        }
        case 'valentine': {
            _loadAmbient(defaultLoader(true, '🌹'), 30000);
            break;
        }
        case 'patrick': {
            _loadAmbient(defaultLoader(true, '☘️', '🍺'), 30000);
            break;
        }
        case 'easter': {
            _loadAmbient(defaultLoader(true, '🐰', '🐣'), 30000);
            break;
        }
        case 'aprilfool': {
            _loadAmbient(defaultLoader(true, '🐟'), 30000);
            break;
        }
        case 'halloween': {
            _loadAmbientCount(halloweenLoader, 30, 1000);
            break;
        }
        case 'christmas_eve': {
            _loadAmbient(defaultLoader(true, '🎄'), 30000);
            break;
        }
        case 'christmas': {
            _loadAmbient(defaultLoader(true, '🎁'), 30000);
            break;
        }
        case 'newyear_eve': {
            _loadAmbient(defaultLoader(false, '🥂'), 30000);
            break;
        }
        case 'newyear': {
            _loadAmbient(newYearLoader, 10000);
            _loadAmbientCount(textLoader(`${new Date().getFullYear()}`), 10, 1000);
            break;
        }
        case 'spring': {
            // '🌸'
            break;
        }
        case 'summer': {
            // '☀️'
            break;
        }
        case 'fall': {
            _loadAmbient(fallSeasonLoader, 30000);
            break;
        }
        case 'winter': {
            _loadAmbient(winterSeasonLoader, 30000);
            break;
        }
        case 'rain': {
            _loadAmbient(rainWeatherLoader, 30000);
            _loadAmbient(rainWeatherLoader, 30000);
        }
    }
}

function getTodayAmbient() {
    const today = new Date();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    let ambient = ambientPeriods[`${mm}-${dd}`];

    if (!ambient) {
        let computedPeriods = {};
        Object.keys(ambientPeriods.compute).forEach(
            (k) => (computedPeriods[ambientPeriods.compute[k]()] = k)
        );
        ambient = computedPeriods[`${mm}-${dd}`];
    }

    if (!ambient) {
        // TODO WITH SEASON CHECKBOX
        ambient = ambientPeriods.season[mm];
    }

    return ambient;
}

function _loadAmbientCount(ambientLoader, count, delay) {
    _loadAmbient(ambientLoader, count * delay, count);
}

function _loadOneTimeAmbient(ambientLoader) {
    let ambients = ambientLoader();
    ambients.forEach((ambient) => confetti(ambient));
}

function _loadAmbient(
    ambientLoader,
    duration,
    count = undefined,
    animationStart = Date.now(),
    animationEnd = animationStart + duration,
    delay = duration / parseFloat(count)
) {
    const now = Date.now();
    const timeLeft = animationEnd - now;
    const ticks = Math.max(200, 500 * (timeLeft / duration));

    let ambients = ambientLoader(ticks);
    if (!Array.isArray(ambients)) {
        ambients = [ambients];
    }

    if (count) {
        let ellapsed = now - animationStart;

        if (ellapsed >= delay) {
            ambients.forEach((ambient) => confetti(ambient));
            count--;
            animationStart = now;
        }
    } else if (count == undefined) {
        ambients.forEach((ambient) => confetti(ambient));
    }

    if (timeLeft > 0) {
        requestAnimationFrame(() =>
            _loadAmbient(ambientLoader, duration, count, animationStart, animationEnd, delay)
        );
    }
}
