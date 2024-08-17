import { StorageLocal } from '../../utils/browser.js';
import { ambients } from './ambient.js';

export default class AmbientManager {
    static async computeEvents() {
        const ambient_dates = {};

        const computes = Object.values(ambients.compute.ambients);
        for (const c of computes) {
            const dates = await c.computeDates();
            if (!dates) continue;
            ambient_dates[c.id] = { date_from: dates.date_from, date_to: dates.date_to };
        }

        await StorageLocal.set({ ambient_dates });
    }

    async getAmbientForDate(date) {
        let ambient = undefined;

        if (!ambient) ambient = await this.getComputedEventForDate(date);
        if (!ambient) ambient = this.getEventAmbientForDate(date);
        if (!ambient) ambient = this.getYearlyAmbientForDate(date);
        if (!ambient) ambient = this.getSeasonAmbientForDate(date);
        if (!ambient) ambient = this.getWeatherAmbientForDate(date);

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

    getEventAmbientForDate(date) {
        return this.getEventForDate(date, Object.values(ambients.event.ambients));
    }

    async getComputedEventForDate(date) {
        const computes = Object.values(ambients.compute.ambients);
        const { ambient_dates } = await StorageLocal.get({ ambient_dates: {} });
        for (const c of computes) {
            const dates = ambient_dates[c.id];
            if (dates) Object.assign(c, dates);
        }
        return this.getEventForDate(date, computes);
    }

    getYearlyAmbientForDate(date) {
        const mm = date.getMonth() + 1; // Months start at 0!
        const dd = date.getDate();

        const yearly = Object.values(ambients.yearly.ambients);
        return yearly.find((y) => y.day === dd && y.month === mm);
    }

    getSeasonAmbientForDate(_date) {
        return undefined;
    }

    getWeatherAmbientForDate(_date) {
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
}
