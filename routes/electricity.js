const got = require('got');
const moment = require('moment');
const config = require('../data/config.json');

let cache = {};

module.exports = function (request, response) {
    const now = moment();
    const dateStr = now.format('YYYY/MM-DD');
    const electConfig = config.electricity || {};
    const region = electConfig.region || 'SE3';
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
    const electConfig = config.electricity || {};

    // Find the entry that matches the current 15-minute interval
    const currentEntry = data.find(entry => {
        const start = moment(entry.time_start);
        const end = moment(entry.time_end);
        return now.isBetween(start, end, null, '[)');
    }) || data[0];

    const calculateTotal = (sekPerKwh) => {
        let ore = sekPerKwh * 100;
        ore += (electConfig.markup || 0);
        ore += (electConfig.grid_fee || 0);
        ore += (electConfig.energy_tax || 0);

        if (electConfig.include_vat !== false) {
            ore *= 1.25;
        }

        return parseFloat((ore / 100).toFixed(4));
    };

    // Calculate daily high and low using total price
    let high = -Infinity;
    let highTime = null;
    let low = Infinity;
    let lowTime = null;

    for (const entry of data) {
        const total = calculateTotal(entry.SEK_per_kWh);
        if (total > high) {
            high = total;
            highTime = entry.time_start;
        }
        if (total < low) {
            low = total;
            lowTime = entry.time_start;
        }
    }

    return {
        current: calculateTotal(currentEntry.SEK_per_kWh),
        high: high,
        high_time: highTime,
        low: low,
        low_time: lowTime,
        time_start: currentEntry.time_start,
        time_end: currentEntry.time_end
    };
}
