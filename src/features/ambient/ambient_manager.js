import { RAIN_TYPE, SNOW_TYPE, getWeatherSun } from '../../api/weather.js';
import { StorageLocal, StorageSync } from '../../utils/browser.js';
import { ambients } from './ambient.js';

export default class AmbientManager {
    static async computeEvents() {
        const ambient_dates = {};

        for (const c of ambients.compute.ambients) {
            const dates = await c.computeDates();
            if (!dates) continue;
            ambient_dates[c.id] = { date_from: dates.date_from, date_to: dates.date_to };
        }

        await StorageLocal.set({ ambient_dates });
    }

    async getAmbientForDate(date) {
        let ambient = undefined;
        const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });

        if (!ambient) ambient = await this.getComputedEventForDate(ambientStatus, date);
        if (!ambient) ambient = this.getEventAmbientForDate(ambientStatus, date);
        if (!ambient) ambient = this.getYearlyAmbientForDate(ambientStatus, date);
        if (!ambient) ambient = this.getSeasonAmbientForDate(ambientStatus, date);
        if (!ambient) ambient = await this.getWeatherAmbientForDate(ambientStatus, date);

        return ambient;
    }

    getEventForDate(date, events) {
        let from = undefined;
        let to = undefined;

        for (const event of events) {
            if (event.date_from && event.date_to) {
                from = new Date(event.date_from);
                to = new Date(event.date_to);
                if (this.isDateBetween(date, from, to)) return event;
                continue;
            }
            if (event.date) {
                from = new Date(event.date);
                if (this.isSameDay(date, from)) return event;
            }
        }

        return undefined;
    }

    getEventAmbientForDate(ambientStatus, date) {
        const activeAmbients = ambients.event.ambients.filter((a) => ambientStatus[a] ?? true);
        return this.getEventForDate(date, activeAmbients);
    }

    async getComputedEventForDate(ambientStatus, date) {
        const computes = ambients.compute.ambients.filter((a) => ambientStatus[a.id] ?? true);
        const { ambient_dates } = await StorageLocal.get({ ambient_dates: {} });
        for (const c of computes) {
            const dates = ambient_dates[c.id];
            if (dates) Object.assign(c, dates);
        }
        return this.getEventForDate(date, computes);
    }

    getYearlyAmbientForDate(ambientStatus, date) {
        const mm = date.getMonth() + 1; // Months start at 0!
        const dd = date.getDate();

        return ambients.event.ambients.find((a) => (ambientStatus[a] ?? true) && a.day === dd && a.month === mm);
    }

    getSeasonAmbientForDate(_ambientStatus, _date) {
        return undefined;
    }

    async getWeatherAmbientForDate(_ambientStatus, _date) {
        const weather = await getWeatherSun();
        const hour = new Date().getHours();

        const snow = weather.joorney_snowfall[hour];
        const rain = weather.joorney_rain[hour];
        let idToSearch = undefined;
        let type = undefined;

        if (snow > 0) {
            idToSearch = 'snow-weather';
            type = SNOW_TYPE.findType(snow);
        }
        if (rain > 0) {
            idToSearch = 'rain-weather';
            type = RAIN_TYPE.findType(rain);
        }

        if (!type) return undefined;
        const ambient = ambients.weather.ambients.find((a) => a['id' === idToSearch]);
        if (!ambient) return undefined;
        return ambient;
    }

    isDateBetween(targetDate, startDate, endDate) {
        return targetDate >= startDate && targetDate <= endDate;
    }

    isSameDay(date1, date2) {
        // return date1.toDateString() === date2.toDateString();
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }
}