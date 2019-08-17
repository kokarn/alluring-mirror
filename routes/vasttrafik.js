const vasttrafik = require( 'vasttrafik-api' );
const moment = require( 'moment' );

const config = require( '../data/config.json' );

module.exports = function( request, response ){
    if ( !config.vasttrafik ) {
        return response.send( [] );
    }

    if ( !config.vasttrafik.to ) {
        return response.send( [] )
    }

    vasttrafik.authorize( process.env.VASTTRAFIK_KEY, process.env.VASTTRAFIK_SECRET )
        .then( () => {
            const api = new vasttrafik.TripApi();
            const destinations = [];

            for ( const destinationID of config.vasttrafik.to ) {
                destinations.push( api.getTrip( {
                    originId: config.vasttrafik.from,
                    destId: destinationID,
                } ) );
            }

            return Promise.all( destinations );
        } )
        .then( ( apiResponses ) => {
            const trips = [];

            for ( const apiResponse of apiResponses ) {
                trips.push( apiResponse.body.TripList.Trip );
            }

            return trips;
        } )
        .then( ( destinations ) => {
            const countdowns = {};

            for ( const destination of destinations ) {
                // Found no trips to destination
                if ( !destination ) {
                    continue;
                }

                for ( let trip of destination ) {
                    const stops = [];
                    const identifierParts = [];

                    // handle inconsistent returns
                    if ( !Array.isArray( trip.Leg ) ) {
                        trip.Leg = [
                            trip.Leg,
                        ];
                    }

                    // Skip some trips missing real time updates
                    if ( !trip.Leg[ 0 ].Origin.rtDate ) {
                        continue;
                    }

                    for ( const leg of trip.Leg ) {
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
                    const departure = moment( `${ trip.Leg[ 0 ].Origin.rtDate } ${ trip.Leg[ 0 ].Origin.rtTime }` );
                    const minutesFromNow = departure.diff( moment(), 'minutes' );

                    // Skip things leaving now or over an hour from now
                    if ( minutesFromNow <= 0 || minutesFromNow > 60 ) {
                        continue;
                    }

                    if ( !countdowns[ identifier ] ) {
                        countdowns[ identifier ] = {
                            ttl: [],
                            destination: trip.Leg[ trip.Leg.length - 1 ].Destination.name.replace( ', Göteborg', '' ),
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
