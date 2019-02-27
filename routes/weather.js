const got = require( 'got' );
const moment = require( 'moment' );

const WEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5';

const WEATHER_LOCATION = {
    gothenburg: '2711537',
};

const WEATHER_MAP = {
    '200': 'thunderstorms',
    '201': 'thunderstorms',
    '202': 'thunderstorms',
    '210': 'thunderstorms',
    '211': 'thunderstorms',
    '212': 'severe-thunderstorms',
    '221': 'isolated-thunderstorms',
    '230': 'thunderstorms',
    '231': 'thunderstorms',
    '232': 'thunderstorms',
    '300': 'drizzle',
    '301': 'drizzle',
    '302': 'drizzle',
    '310': 'drizzle',
    '311': 'drizzle',
    '312': 'drizzle',
    '313': 'drizzle',
    '314': 'drizzle',
    '321': 'drizzle',
    '500': 'showers',
    '501': 'showers',
    '502': 'showers',
    '503': 'showers',
    '504': 'showers',
    '511': 'freezing-rain',
    '520': 'scattered-showers',
    '521': 'showers',
    '522': 'showers',
    '531': 'showers',
    '600': 'snow',
    '601': 'snow',
    '602': 'heavy-snow',
    '611': 'sleet',
    '612': 'mixed-rain-and-sleet',
    '615': 'mixed-rain-and-snow',
    '616': 'mixed-rain-and-snow',
    '620': 'light-snow-showers',
    '621': 'scattered-snow-showers',
    '622': 'snow-showers',
    '701': 'foggy',
    '711': 'smoky',
    '721': 'haze',
    '731': 'dust',
    '741': 'foggy',
    '751': 'blustery',
    '761': 'dust',
    '762': 'smoky',
    '771': 'blustery',
    '781': 'tornado',
    '800': {
        '01d': 'sunny',
        '01n': 'clear-night',
        '02d': 'partly-cloudy-day',
        '02n': 'partly-cloudy-night',
    },
    '801': {
        '02d': 'partly-cloudy-day',
        '02n': 'partly-cloudy-night',
    },
    '802': {
        '03d': 'mostly-cloudy-day',
        '03n': 'mostly-cloudy-night',
    },
    '803': 'cloudy',
    '804': 'cloudy',
};

const getWeatherCode = function getWeatherCode( weatherPoint ) {
    if ( typeof WEATHER_MAP[ weatherPoint.weather[ 0 ].id ] === 'object' ) {
        return WEATHER_MAP[ weatherPoint.weather[ 0 ].id ][ weatherPoint.weather[ 0 ].icon ];
    }

    return WEATHER_MAP[ weatherPoint.weather[ 0 ].id ];
};

module.exports = function( request, response ){
    const returnData = {};

    got( `${ WEATHER_ENDPOINT }/weather`, {
        json: true,
        query: {
            appid: process.env.OPEN_WEATHER_MAP,
            id: WEATHER_LOCATION[ 'gothenburg' ],
            units: 'metric',
        },
    } )
    .then( ( weatherReturnData ) => {
        returnData.now = {
            code: getWeatherCode( weatherReturnData.body ),
            temperature: weatherReturnData.body.main.temp,
            high: weatherReturnData.body.main.temp_max,
            low: weatherReturnData.body.main.temp_min,
        };

        return got( `${ WEATHER_ENDPOINT }/forecast`, {
            json: true,
            query: {
                appid: process.env.OPEN_WEATHER_MAP,
                id: WEATHER_LOCATION[ 'gothenburg' ],
                units: 'metric',
            },
        } );
    } )
    .then( ( forecastData ) => {
        const measurements = [];

        for ( const weatherPoint of forecastData.body.list ) {
            const date = moment( weatherPoint.dt * 1000 );

            measurements.push( {
                date: date.format( 'YYYY-MM-DD' ),
                time: date.format( 'HH:mm' ),
                code: getWeatherCode( weatherPoint ),
                temperature: weatherPoint.main.temp,
            } );
        }

        const forecast = {};

        for ( const measurement of measurements ) {
            if ( !forecast[ measurement.date ] ) {
                forecast[ measurement.date ] = {
                    code: measurement.code,
                    temperature: measurement.temperature,
                    high: measurement.temperature,
                    low: measurement.temperature,
                };
            }

            if ( forecast[ measurement.date ].high < measurement.temperature ) {
                forecast[ measurement.date ].high = measurement.temperature;
            }

            if ( forecast[ measurement.date ].low > measurement.temperature ) {
                forecast[ measurement.date ].low = measurement.temperature;
            }
        }

        returnData.forecast = forecast;
    } )
    .then( () => {
        response.send( returnData );
    } )
    .catch( ( requestError ) => {
        console.error( requestError );
        response.send( requestError );
    } );
};
