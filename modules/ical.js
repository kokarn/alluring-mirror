const IcalExpander = require( 'ical-expander' );
const moment = require( 'moment' );
const got = require( 'got' );

module.exports = function( url, image ){
    return got( url )
        .then( ( calendarResponse ) => {
            const icalExpander = new IcalExpander( {
                ics: calendarResponse.body,
                maxIterations: 1000,
            } );
            const start = new Date( `${ moment().format( 'Y-MM-DD' ) }T00:00:00.000Z` );
            const end = new Date( `${ moment().add( 40, 'days' ).format( 'Y-MM-DD' ) }T00:00:00.000Z` );
            const items = {};

            const events = icalExpander.between( start, end );
            const mappedEvents = events.events.map( ( event ) => {
                return {
                    startDate: event.startDate,
                    summary: event.summary
                };
            } );
            const mappedOccurrences = events.occurrences.map( ( event ) => {
                return {
                    startDate: event.startDate,
                    summary: event.item.summary
                };
            } );
            const allEvents = [].concat( mappedEvents, mappedOccurrences );

            for( const item of allEvents ) {
                const eventStart = moment( item.startDate.toJSDate() );
                const newItem = {
                    title: item.summary,
                    image,
                }

                if ( !items[ eventStart.format( 'Y-MM-DD' ) ] ) {
                    items[ eventStart.format( 'Y-MM-DD' ) ] = [];
                }

                if ( eventStart.format( 'HH:mm' ) !== '00:00' ) {
                    newItem.time = eventStart.format( 'HH:mm' );
                }

                items[ eventStart.format( 'Y-MM-DD' ) ].push( newItem );
            }

            return items;
        } )
        .catch( ( requestError ) => {
            console.error( requestError );
        } );
};
