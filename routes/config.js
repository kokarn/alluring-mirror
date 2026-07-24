const fs = require( 'fs' );
const path = require( 'path' );

module.exports = function( request, response ){
    const configPath = path.join( __dirname, '..', 'data', 'config.json' );

    if( request.method === 'GET' ){
        return response.sendFile( path.join( __dirname, '..', 'public', 'admin.html' ) );
    }

    if( request.method !== 'POST' ){
        return response.status( 405 ).send({ error: 'Method not allowed' });
    }

    try {
        const data = typeof request.body.config === 'string' ? JSON.parse( request.body.config ) : request.body;
        fs.writeFileSync( configPath, JSON.stringify( data, null, 4 ) );

        // Routes hold a reference to Node's cached JSON export. Mutating that object
        // applies settings immediately without restarting the mirror container.
        const cachedConfig = require( configPath );
        Object.keys( cachedConfig ).forEach( key => delete cachedConfig[ key ] );
        Object.assign( cachedConfig, data );

        return response.send({ success: true, config: data });
    } catch( error ){
        return response.status( 400 ).send({ error: error.message });
    }
};
