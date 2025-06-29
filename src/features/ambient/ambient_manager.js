import { getAmbientDates, setAmbientDates } from '../../api/local.js';
import { StorageSync } from '../../utils/browser.js';
import { ambients } from './ambient.js';

export default class AmbientManager {
    static async computeEvents() {
        const ambient_dates = {};

        for (const c of ambients.compute.ambients) {
            const dates = await c.computeDates();
            if (!dates) continue;
            ambient_dates[c.id] = {
                date_from: dates.event_date_from,
                date_to: dates.event_date_to,
                name: dates.event_name,
            };
        }

        await setAmbientDates(ambient_dates);
    }

    async getAmbientForDate(date) {
        let ambient = undefined;
        const { ambientStatus } = await StorageSync.get({ ambientStatus: {} });

        if (!ambient) ambient = await this.getComputedEventForDate(date);
        if (!ambient) ambient = this.getEventAmbientForDate(date);
        if (!ambient) ambient = this.getYearlyAmbientForDate(date);
        if (!ambient) ambient = this.getSeasonAmbientForDate(date);
        if (!ambient) ambient = await this.getWeatherAmbientForDate(date);

        if (ambient && this.isEnable(ambientStatus, ambient.id)) return ambient;
        return false;
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

    getEventAmbientForDate(date) {
        const activeAmbients = ambients.event.ambients;
        return this.getEventForDate(date, activeAmbients);
    }

    async getComputedEventForDate(date) {
        const computes = ambients.compute.ambients;
        const ambient_dates = await getAmbientDates();
        for (const c of computes) {
            const dates = ambient_dates[c.id];
            if (dates) Object.assign(c, dates);
        }
        return this.getEventForDate(date, computes);
    }

    getYearlyAmbientForDate(date) {
        const mm = date.getMonth() + 1; // Months start at 0!
        const dd = date.getDate();

        return ambients.yearly.ambients.find((a) => a.day === dd && a.month === mm);
    }

    getSeasonAmbientForDate(_date) {
        return undefined;
    }

    async getWeatherAmbientForDate(_date) {
        return undefined;
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

    isEnable(ambientStatus, ambientName) {
        if (Object.keys(ambientStatus).includes(ambientName)) return ambientStatus[ambientName];
        return true;
    }
}
