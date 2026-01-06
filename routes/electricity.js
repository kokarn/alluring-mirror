const got = require('got');
const moment = require('moment');
const config = require('../data/config.json');

let cache = {};

module.exports = function (request, response) {
    const now = moment();
    const dateStr = now.format('YYYY/MM-DD');
    const region = config.electricity_region || 'SE3';
    const url = `https://www.elprisetjustnu.se/api/v1/prices/${dateStr}_${region}.json`;

    if (cache[region] && cache[region].date === dateStr && cache[region].data) {
        return response.send(getPriceData(cache[region].data, now));
    }

    got(url, { json: true })
        .then((apiResponse) => {
            cache[region] = {
                date: dateStr,
                data: apiResponse.body
            };

            response.send(getPriceData(cache[region].data, now));
        })
        .catch((error) => {
            console.error('Error fetching electricity prices:', error);
            response.status(500).send({ error: 'Failed to fetch electricity prices' });
        });
};

function getPriceData(data, now) {
    // API returns an array of price objects for the day
    // Each object has { "SEK_per_kWh": ..., "time_start": "2026-01-05T11:00:00+01:00", ... }

    // Find the entry that matches the current 15-minute interval
    const current = data.find(entry => {
        const start = moment(entry.time_start);
        const end = moment(entry.time_end);
        return now.isBetween(start, end, null, '[)');
    }) || data[0];

    // Calculate daily high and low
    let high = -Infinity;
    let highTime = null;
    let low = Infinity;
    let lowTime = null;

    for (const entry of data) {
        if (entry.SEK_per_kWh > high) {
            high = entry.SEK_per_kWh;
            highTime = entry.time_start;
        }
        if (entry.SEK_per_kWh < low) {
            low = entry.SEK_per_kWh;
            lowTime = entry.time_start;
        }
    }

    return {
        current: current.SEK_per_kWh,
        high: high,
        high_time: highTime,
        low: low,
        low_time: lowTime,
        time_start: current.time_start,
        time_end: current.time_end
    };
}
