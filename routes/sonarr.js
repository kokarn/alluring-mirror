const ical = require( '../modules/ical' );



module.exports = function( request, response ){
    const config = require( '../data/config.json' );

    if ( !config.sonarr ) {
        response.send( {} );
    }

    if ( config.sonarr.length === 0 ) {
        response.send( {} );
    }

    console.log(`Loading Sonarr from ${config.sonarr}`);

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
