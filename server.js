const fs = require('fs');
const path = require( 'path' );

const express = require( 'express' );
const cors = require( 'cors' );
const fileUpload = require( 'express-fileupload' );

const routes = require( './routes' );

const app = express();

const DEFAULT_PORT = 4000;

const IMAGE_CACHE_PATH = path.join( __dirname, '.', 'data', 'image-cache' );
const CUSTOM_UPLOAD_PATH = path.join( __dirname, '.', 'data', 'custom-block-uploads' );

try {
    fs.mkdirSync(IMAGE_CACHE_PATH);
} catch (folderCreateError){
    if(folderCreateError.code !== 'EEXIST'){
        console.error(folderCreateError);
    }
}

app.use( cors() );
app.use( fileUpload() );
app.use( express.json({ limit: '1mb' }) );
app.use( express.urlencoded( { extended: true } ) );
app.use( express.static( 'public' ) );
app.use( '/uploads', express.static( CUSTOM_UPLOAD_PATH ) );

for ( const route in routes ) {
    app.use( `/${ route }/*`, routes[ route ] );
}

app.get( '/config.json', ( request, response ) => {
    response.sendFile( path.join( __dirname, 'data', 'config.json' ) );
} );

app.listen( process.env.PORT || DEFAULT_PORT, () => {
    console.log( `Webserver listening on http://localhost:${ process.env.PORT || DEFAULT_PORT }` );
} );
