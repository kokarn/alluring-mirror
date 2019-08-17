const path = require( 'path' );

const express = require( 'express' );
const cors = require( 'cors' );
const fileUpload = require( 'express-fileupload' );

const routes = require( './routes' );

const app = express();

const DEFAULT_PORT = 4000;

app.use( cors() );
app.use( fileUpload() );
app.use( express.urlencoded( { extended: true } ) );
app.use( express.static( 'public' ) );

for ( const route in routes ) {
    app.use( `/${ route }/*`, routes[ route ] );
}

app.get( '/config.json', ( request, response ) => {
    response.sendFile( path.join( __dirname, 'data', 'config.json' ) );
} );

app.listen( process.env.PORT || DEFAULT_PORT, () => {
    console.log( `Webserver listening on ${ process.env.PORT || DEFAULT_PORT }` );
} );
