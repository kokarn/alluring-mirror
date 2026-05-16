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

const PROVIDERS = {
    baksmedjan: {
        name: 'Baksmedjan',
        time: '08-13',
        image: 'https://baksmedjan.se/logo.png',
        fetch: fetchBaksmedjan,
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
            const dates = await provider.fetch(today, end);
            for (const date of dates) {
                if (!result[date]) {
                    result[date] = [];
                }
                result[date].push({
                    title: provider.name,
                    time: provider.time,
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
