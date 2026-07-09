const got = require('got');
const moment = require('moment');

const config = require('../data/config.json');

const FEED_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

// ISO 3166-1 alpha-2 codes for flagcdn (gb-eng / gb-sct for home nations).
const FLAG = {
    'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at',
    'Belgium': 'be', 'Bosnia & Herzegovina': 'ba', 'Brazil': 'br', 'Canada': 'ca',
    'Cape Verde': 'cv', 'Colombia': 'co', 'Croatia': 'hr', 'Curaçao': 'cw',
    'Czech Republic': 'cz', 'DR Congo': 'cd', 'Ecuador': 'ec', 'Egypt': 'eg',
    'England': 'gb-eng', 'France': 'fr', 'Germany': 'de', 'Ghana': 'gh',
    'Haiti': 'ht', 'Iran': 'ir', 'Iraq': 'iq', 'Ivory Coast': 'ci',
    'Japan': 'jp', 'Jordan': 'jo', 'Mexico': 'mx', 'Morocco': 'ma',
    'Netherlands': 'nl', 'New Zealand': 'nz', 'Norway': 'no', 'Panama': 'pa',
    'Paraguay': 'py', 'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa',
    'Scotland': 'gb-sct', 'Senegal': 'sn', 'South Africa': 'za', 'South Korea': 'kr',
    'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch', 'Tunisia': 'tn',
    'Turkey': 'tr', 'USA': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz',
    'Wales': 'gb-wls', 'Denmark': 'dk', 'Poland': 'pl', 'Nigeria': 'ng',
    'Cameroon': 'cm', 'Costa Rica': 'cr', 'Honduras': 'hn', 'Peru': 'pe',
    'Chile': 'cl', 'Serbia': 'rs', 'Ukraine': 'ua', 'Greece': 'gr',
};

// 3-letter codes for the footer matchup label.
const CODE = {
    'Algeria': 'ALG', 'Argentina': 'ARG', 'Australia': 'AUS', 'Austria': 'AUT',
    'Belgium': 'BEL', 'Bosnia & Herzegovina': 'BIH', 'Brazil': 'BRA', 'Canada': 'CAN',
    'Cape Verde': 'CPV', 'Colombia': 'COL', 'Croatia': 'CRO', 'Curaçao': 'CUW',
    'Czech Republic': 'CZE', 'DR Congo': 'COD', 'Ecuador': 'ECU', 'Egypt': 'EGY',
    'England': 'ENG', 'France': 'FRA', 'Germany': 'GER', 'Ghana': 'GHA',
    'Haiti': 'HAI', 'Iran': 'IRN', 'Iraq': 'IRQ', 'Ivory Coast': 'CIV',
    'Japan': 'JPN', 'Jordan': 'JOR', 'Mexico': 'MEX', 'Morocco': 'MAR',
    'Netherlands': 'NED', 'New Zealand': 'NZL', 'Norway': 'NOR', 'Panama': 'PAN',
    'Paraguay': 'PAR', 'Portugal': 'POR', 'Qatar': 'QAT', 'Saudi Arabia': 'KSA',
    'Scotland': 'SCO', 'Senegal': 'SEN', 'South Africa': 'RSA', 'South Korea': 'KOR',
    'Spain': 'ESP', 'Sweden': 'SWE', 'Switzerland': 'SUI', 'Tunisia': 'TUN',
    'Turkey': 'TUR', 'USA': 'USA', 'Uruguay': 'URU', 'Uzbekistan': 'UZB',
};

const flagUrl = function flagUrl(team) {
    const iso = FLAG[team];

    if (!iso) {
        return 'https://flagcdn.com/w320/un.png';
    }

    return `https://flagcdn.com/w320/${iso}.png`;
};

const shortName = function shortName(team) {
    return CODE[team] || team.slice(0, 3).toUpperCase();
};

// A placeholder team is an unresolved bracket slot like "W97" or "L101".
const isPlaceholder = function isPlaceholder(team) {
    return /^[WL]\d+$/.test(team);
};

// openfootball times look like "16:00 UTC-4". Convert to Europe/Stockholm.
// The tournament runs Jun–Jul 2026, so Stockholm is always CEST (UTC+2).
const toStockholm = function toStockholm(date, time) {
    const match = String(time || '').match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d+)/);

    if (!match) {
        return { date, time: null };
    }

    const offsetHours = Number(match[3]);
    const stockholm = moment
        .utc(`${date} ${match[1]}:${match[2]}`, 'YYYY-MM-DD HH:mm')
        .subtract(offsetHours, 'hours') // -> real UTC
        .add(2, 'hours');               // -> CEST

    return {
        date: stockholm.format('YYYY-MM-DD'),
        time: stockholm.format('HH:mm'),
    };
};

let cache = null;
let cacheStamp = 0;
const CACHE_MS = 5 * 60 * 1000;

const fetchFeed = function fetchFeed() {
    if (cache && Date.now() - cacheStamp < CACHE_MS) {
        return Promise.resolve(cache);
    }

    return got(FEED_URL, { json: true })
        .then((response) => {
            cache = response.body;
            cacheStamp = Date.now();

            return cache;
        });
};

module.exports = function (request, response) {
    if (!config['world-cup']) {
        response.send({});

        return;
    }

    fetchFeed()
        .then((feed) => {
            const items = {};

            for (const match of feed.matches) {
                if (isPlaceholder(match.team1) || isPlaceholder(match.team2)) {
                    continue;
                }

                const when = toStockholm(match.date, match.time);
                const ft = match.score && match.score.ft;
                let title;

                if (ft && ft.length === 2) {
                    title = `${shortName(match.team1)} ${ft[0]}-${ft[1]} ${shortName(match.team2)}`;
                } else {
                    title = `${shortName(match.team1)} - ${shortName(match.team2)}`;
                }

                const item = {
                    title,
                    flags: [flagUrl(match.team1), flagUrl(match.team2)],
                    image: flagUrl(match.team1),
                };

                if (when.time) {
                    item.time = when.time;
                }

                if (!items[when.date]) {
                    items[when.date] = [];
                }

                items[when.date].push(item);
            }

            response.send(items);
        })
        .catch((feedError) => {
            console.error(feedError);
            response.send({});
        });
};
