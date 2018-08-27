const fs = require( 'fs' );
const path = require( 'path' );

const got = require( 'got' );

const IMAGE_CACHE_PATH = path.join( __dirname, '..', 'image-cache' );

module.exports = function( request, response ){
    if ( request.params[ '0' ] ) {
        const imagePath = path.join( IMAGE_CACHE_PATH, `${ request.params[ '0' ] }` );

        if ( fs.existsSync( imagePath ) ) {
            response.sendFile( imagePath );

            return true;
        }
    }

    const search = request.query.query;
    const imagePath = path.join( IMAGE_CACHE_PATH, `${ search }.jpg` );
    const results = [];

    let entity = request.query.entity || 'tvSeason';
    let country = request.query.country || 'us';
    let shortFilm = false;

    if ( entity == 'shortFilm' ) {
        shortFilm = true;
        entity = 'movie';
    }

    let query = {
        term: encodeURIComponent( search ),
        country,
        entity,
    };
    let url = 'http://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch?';

    if ( shortFilm ) {
        query.attribute = 'shortFilmTerm';
    }

    if ( fs.existsSync( imagePath ) ) {
        response.sendFile( imagePath );

        return true;
    }

    got( url, {
        query,
    } )
        .then( ( itunesResponse ) => {
            const itunesData = JSON.parse( itunesResponse.body );
            let url = 'https://i.imgur.com/fuVi5It.png';

            if ( itunesData.results[ 0 ] ) {
                url = itunesData.results[ 0 ].artworkUrl100.replace( '100x100', '600x600' );
            }

            const writeStream = got.stream( url ).pipe( fs.createWriteStream( imagePath ) );

            writeStream.on( 'close', () => {
                response.sendFile( imagePath );
            } );
        } )
        .catch( ( requestError ) => {
            console.error( requestError );
        } );
};
