const ical = require( '../modules/ical' );

const config = require( '../data/config.json' );

module.exports = function( request, response ){
    const calendarEvents = [];

    if ( config.calendar.length === 0 ) {
        response.send( {} );
    }

    for ( const calendar of config.calendar ) {
        calendarEvents.push( ical( calendar.source, calendar.image ) );
    }

    Promise.all( calendarEvents )
        .then( ( events ) => {
            const fullList = {};

            for ( const days of events ) {
                for ( const date in days ) {
                    if ( !fullList[ date ] ) {
                        fullList[ date ] = [];
                    }

                    fullList[ date ] = fullList[ date ].concat( days[ date ] );
                }
            }

            response.send( fullList );
        } )
};
