const got = require('got');
const moment = require('moment');

const config = require('../data/config.json');

const WINDOW_DAYS = 21;

async function fetchBaksmedjan(start, end) {
    const response = await got('https://www.baksmedjan.se/api/public/opening-hours', {
        json: true,
        query: { start, end },
    });

    if (!response.body || !response.body.success || !Array.isArray(response.body.data)) {
        throw new Error('Unexpected response shape from baksmedjan');
    }

    return response.body.data;
}

// Midsummer's Day (midsommardagen) — the Saturday between June 20 and 26.
function midsummerDay(year) {
    const day = moment({ year, month: 5, day: 20 });
    while (day.day() !== 6) {
        day.add(1, 'day');
    }
    return day;
}

// Public holidays in the May–midsummer season get weekend hours, matching the
// rule the shop's own site applies (it hardcodes these dates as "Helger").
const STAXANGSBLOMMOR_HOLIDAYS = new Set([
    '05-01', // Första maj
    '05-14', // Kristi himmelsfärds dag (2026)
    '06-06', // Sveriges nationaldag
]);

// Staxängs Blommor has no API — its hours are rule-based on the site:
// open every day from May 1 until midsummer, weekdays 14-18, weekends/holidays 10-16.
function fetchStaxangsblommor(start, end) {
    const result = [];
    const cursor = moment(start);
    const last = moment(end);

    while (cursor.isSameOrBefore(last, 'day')) {
        const seasonEnd = midsummerDay(cursor.year());
        const inSeason = cursor.month() >= 4 && cursor.isSameOrBefore(seasonEnd, 'day');

        if (inSeason) {
            const weekendHours = cursor.day() === 0
                || cursor.day() === 6
                || STAXANGSBLOMMOR_HOLIDAYS.has(cursor.format('MM-DD'));

            result.push({
                date: cursor.format('YYYY-MM-DD'),
                time: weekendHours ? '10-16' : '14-18',
            });
        }

        cursor.add(1, 'day');
    }

    return result;
}

const PROVIDERS = {
    baksmedjan: {
        name: 'Baksmedjan',
        time: '08-13',
        image: 'https://baksmedjan.se/logo.png',
        fetch: fetchBaksmedjan,
    },
    staxangsblommor: {
        name: 'Staxängs Blommor',
        image: 'https://www.staxangsblommor.se/img/bg.jpg',
        fetch: fetchStaxangsblommor,
    },
};

let cache = null;

module.exports = async function (request, response) {
    const today = moment().format('YYYY-MM-DD');

    if (cache && cache.date === today) {
        return response.send(cache.data);
    }

    const end = moment().add(WINDOW_DAYS, 'days').format('YYYY-MM-DD');
    const enabledKeys = Array.isArray(config.openings) && config.openings.length
        ? config.openings
        : Object.keys(PROVIDERS);

    const result = {};

    await Promise.all(enabledKeys.map(async (key) => {
        const provider = PROVIDERS[key];
        if (!provider) {
            console.error(`Unknown opening-hours provider: ${key}`);
            return;
        }

        try {
            const entries = await provider.fetch(today, end);
            for (const entry of entries) {
                const date = typeof entry === 'string' ? entry : entry.date;
                const time = (typeof entry === 'object' && entry.time) || provider.time;

                if (!result[date]) {
                    result[date] = [];
                }
                result[date].push({
                    title: provider.name,
                    time: time,
                    image: provider.image,
                });
            }
        } catch (error) {
            console.error(`Error fetching openings for ${key}:`, error.message);
        }
    }));

    cache = { date: today, data: result };
    response.send(result);
};
