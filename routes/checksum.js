const dirsum = require( 'dirsum' );
const path = require( 'path' );

module.exports = function( request, response ){
    dirsum.digest( path.join( __dirname, '..', 'public' ), 'sha1', ( error, hashes ) => {
        if ( error ) {
            throw error;
        }

        response.json( hashes.hash );
    } );
};
