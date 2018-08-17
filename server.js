require( 'dotenv' ).config();

const express = require( 'express' );
const cors = require( 'cors' );

const routes = require( './routes' );

const app = express();

const DEFAULT_PORT = 4000;

app.use( cors() );
app.use( express.urlencoded( { extended: true } ) );
app.use( express.static( 'public' ) );

for ( const route in routes ) {
    app.use( `/${ route }/*`, routes[ route ] );
}

app.listen( process.env.PORT || DEFAULT_PORT, () => {
    console.log( `Webserver listening on ${ process.env.PORT || DEFAULT_PORT }` );
} );
