const vasttrafik = require( 'vasttrafik-api' );
const moment = require( 'moment' );

const config = require( '../config.json' );

module.exports = function( request, response ){
    vasttrafik.authorize( process.env.VASTTRAFIK_KEY, process.env.VASTTRAFIK_SECRET )
        .then( () => {
            const api = new vasttrafik.TripApi();
            const destinations = [];

            // for ( const destinatioID of config.vasttrafik.to ) {
            for( let i = 0; i < config.vasttrafik.to.length; i = i + 1 ) {
                const destinatioID = config.vasttrafik.to[ i ];

                destinations.push( api.getTrip( {
                    originId: config.vasttrafik.from,
                    destId: destinatioID,
                } ) );
            }

            return Promise.all( destinations );
        } )
        .then( ( apiResponses ) => {
            const trips = [];

            // for ( const apiResponse of apiResponses ) {
            for ( let i = 0; i < apiResponses.length; i = i + 1 ) {
                const apiResponse = apiResponses[ i ];

                trips.push( apiResponse.body.TripList.Trip );
            }

            return trips;
        } )
        .then( ( destinations ) => {
            const countdowns = {};

            // for ( const destination of destinations ) {
            for( let i = 0; i < destinations.length; i = i + 1 ){
                const destination = destinations[ i ];

                // for ( let trip of destination ) {
                for ( let x = 0; x < destination.length; x = x + 1 ) {
                    const trip = destination[ x ];
                    const stops = [];
                    const identifierParts = [];

                    // handle inconsistent returns
                    if ( !Array.isArray( trip.Leg ) ) {
                        trip.Leg = [
                            trip.Leg,
                        ];
                    }

                    // Skip some trips missing real time updates
                    if ( !trip.Leg[ 0 ].Origin.rtDate ) {
                        continue;
                    }

                    // for ( const leg of trip.Leg ) {
                    for ( let y = 0; y < trip.Leg.length; y = y + 1 ) {
                        const leg = trip.Leg[ y ];
                        // Filter all walks out
                        if ( leg.type === 'WALK' ) {
                            continue;
                        }

                        stops.push( {
                            name: leg.sname,
                            destination: leg.Destination.name.replace( ', Göteborg', '' ),
                        } );

                        identifierParts.push( leg.sname );
                    }

                    const identifier = identifierParts.join( '-' );
                    const departure = moment( `${ trip.Leg[ 0 ].Origin.rtDate } ${ trip.Leg[ 0 ].Origin.rtTime }` );
                    const minutesFromNow = departure.diff( moment(), 'minutes' );

                    // Skip things leaving now or over an hour from now
                    if ( minutesFromNow <= 0 || minutesFromNow > 60 ) {
                        continue;
                    }

                    if ( !countdowns[ identifier ] ) {
                        countdowns[ identifier ] = {
                            ttl: [],
                            destination: trip.Leg[ trip.Leg.length - 1 ].Destination.name.replace( ', Göteborg', '' ),
                            route: stops,
                        }
                    }

                    countdowns[ identifier ].ttl.push( minutesFromNow );
                }
            }

            response.send( countdowns );
        } )
        .catch( ( apiError ) => {
            console.error( apiError );
        } );
}
