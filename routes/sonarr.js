const ical = require( '../modules/ical' );

const config = require( '../data/config.json' );

module.exports = function( request, response ){
    const calendarEvents = [];

    if ( !config.sonarr ) {
        response.send( {} );
    }

    if ( config.sonarr.length === 0 ) {
        response.send( {} );
    }

    ical( config.sonarr, 'none.jpg', false )
        .then( ( events ) => {
            for ( const date in events ) {
                for ( const event of events[ date ] ) {
                    const itemParts = event.title.match( /(.+?) -/ );

                    event.title = '';
                    event.image = `/images/?query=${ itemParts[ 1 ].trim() }`;
                }
            }

            response.send( events );
        } )
};
