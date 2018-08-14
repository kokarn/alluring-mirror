const got = require( 'got' );
const FeedMe = require( 'feedme' );
const moment = require( 'moment' );

module.exports = function( request, response ){
    const url = `https://www.myepisodes.com/rss.php?feed=mylist&uid=mirrorer&pwdmd5=${ process.env.MYEPISODES }`;
    got( url )
        .then( ( myEpisodesResponse ) => {
            const parser = new FeedMe();
            const items = {};

            parser.on( 'item', ( item ) => {
                const itemParts = item.title.match( /\[(.+?)\]\[(.+?)\]\[(.+?)\]\[(.+?)\]/ );
                const dateStart = moment( itemParts[ 4 ], 'DD-MMM-YYYY' );

                if ( !items[ dateStart.format( 'Y-MM-DD' ) ] ) {
                    items[ dateStart.format( 'Y-MM-DD' ) ] = [];
                }

                items[ dateStart.format( 'Y-MM-DD' ) ].push( {
                    image: `/images/?query=${ itemParts[ 1 ].trim() }`,
                } );
            } );

            parser.write( myEpisodesResponse.body );

            response.send( items );
        } )
        .catch( ( requestError ) => {
            console.error( requestError );
            response.send( requestError );
        } );
};
