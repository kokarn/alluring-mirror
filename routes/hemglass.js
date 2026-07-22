const got = require('got');
const moment = require('moment');

const config = require('../data/config.json');

// Hemglass "Iceman" tracker API (same backend hitta.hemglass.se uses).
const API_BASE = 'https://hg-be-iceman-prod-cmb0g2c9g6fqadgs.swedencentral-01.azurewebsites.net/api/tracker';

const TILE_IMAGE = 'images/hemglass-tile.svg';

let cache = null;
let cacheStamp = 0;
const CACHE_MS = 30 * 60 * 1000;

// getNearestStops returns each stop's single next visit within the bbox.
// We box a small area around the configured point and pick the closest stop.
const haversine = function haversine(lat1, lon1, lat2, lon2) {
    const toRad = function toRad(deg) {
        return (deg * Math.PI) / 180;
    };

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(a));
};

const fetchNearestStop = function fetchNearestStop(lat, lon) {
    if (cache && Date.now() - cacheStamp < CACHE_MS) {
        return Promise.resolve(cache);
    }

    // ~1.7km bbox around the point.
    const pad = 0.015;
    const url = `${API_BASE}/getNearestStops` +
        `?minLong=${lon - pad}&minLat=${lat - pad}` +
        `&maxLong=${lon + pad}&maxLat=${lat + pad}&limit=500`;

    return got(url, { json: true })
        .then((response) => {
            const stops = (response.body && response.body.data) || [];
            let nearest = null;
            let best = Infinity;

            for (const stop of stops) {
                const km = haversine(lat, lon, stop.latitude, stop.longitude);

                if (km < best) {
                    best = km;
                    nearest = stop;
                }
            }

            cache = nearest;
            cacheStamp = Date.now();

            return nearest;
        });
};

module.exports = function (request, response) {
    const settings = config.hemglass;

    if (!settings || !settings.latitude || !settings.longitude) {
        response.send({});

        return;
    }

    fetchNearestStop(settings.latitude, settings.longitude)
        .then((stop) => {
            if (!stop || !stop.nextDate) {
                response.send({});

                return;
            }

            const when = moment(stop.nextDate);
            const date = when.format('YYYY-MM-DD');

            // nextTime is a "HH:mm - HH:mm" window; keep it as the block time
            // so the ended-items filter (endValue handles ranges) can expire it.
            const item = {
                title: 'Glassbilen',
                image: TILE_IMAGE,
                time: stop.nextTime || when.format('HH:mm'),
            };

            response.send({ [date]: [item] });
        })
        .catch((apiError) => {
            console.error(apiError);
            response.send({});
        });
};
