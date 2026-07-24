const fs = require( 'fs' );
const path = require( 'path' );
const storeModule = require( '../modules/custom-blocks-store' );

const DATA_PATH = path.join( __dirname, '..', 'data', 'custom-blocks.json' );
const UPLOAD_PATH = path.join( __dirname, '..', 'data', 'custom-block-uploads' );
const store = storeModule.createStore( DATA_PATH );
const allowedTypes = [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml' ];

function uploadedImage( request ){
    if( !request.files || !request.files.imageFile ){
        return null;
    }
    const file = request.files.imageFile;
    if( !allowedTypes.includes( file.mimetype ) ){
        throw new Error( 'Image must be JPEG, PNG, GIF, WebP, or SVG' );
    }
    if( file.size > 8 * 1024 * 1024 ){
        throw new Error( 'Image must be smaller than 8 MB' );
    }
    fs.mkdirSync( UPLOAD_PATH, { recursive: true } );
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg' };
    const extension = extensions[ file.mimetype ];
    const filename = `${ Date.now() }-${ Math.random().toString( 16 ).slice( 2 ) }${ extension }`;
    fs.writeFileSync( path.join( UPLOAD_PATH, filename ), file.data );
    return `/uploads/${ filename }`;
}

function inputWithImage( request, existing ){
    const input = Object.assign( {}, request.body );
    const upload = uploadedImage( request );
    input.image = upload || input.imageUrl || input.image || ( existing && existing.image );
    input.enabled = input.enabled === true || input.enabled === 'true' || input.enabled === 'on';
    return input;
}

module.exports = function( request, response ){
    const action = request.params[ '0' ] || '';
    try {
        if( request.method === 'GET' && action === 'feed' ){
            return response.send( storeModule.toDayMap( store.list() ) );
        }
        if( request.method === 'GET' ){
            return response.send( store.list() );
        }
        if( request.method === 'POST' ){
            return response.status( 201 ).send( store.create( inputWithImage( request ) ) );
        }
        if( request.method === 'PUT' ){
            const current = store.list().find( block => block.id === action );
            return response.send( store.update( action, inputWithImage( request, current ) ) );
        }
        if( request.method === 'DELETE' ){
            store.remove( action );
            return response.send({ success: true });
        }
        return response.status( 405 ).send({ error: 'Method not allowed' });
    } catch( error ){
        return response.status( /not found/i.test( error.message ) ? 404 : 400 ).send({ error: error.message });
    }
};
