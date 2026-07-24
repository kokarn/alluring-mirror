const crypto = require( 'crypto' );
const fs = require( 'fs' );
const path = require( 'path' );

function clean( input, id ){
    const block = {
        id: id || crypto.randomBytes( 8 ).toString( 'hex' ),
        date: String( input.date || '' ).trim(),
        title: String( input.title || '' ).trim(),
        text: String( input.text || '' ).trim(),
        time: String( input.time || '' ).trim(),
        image: String( input.image || '' ).trim(),
        enabled: input.enabled !== false && input.enabled !== 'false'
    };

    if( !/^\d{4}-\d{2}-\d{2}$/.test( block.date ) ){
        throw new Error( 'A valid date is required' );
    }

    if( !block.title ){
        throw new Error( 'A title is required' );
    }

    if( !block.image ){
        throw new Error( 'An image is required' );
    }

    if( block.time && !/^\d{1,2}:\d{2}$/.test( block.time ) ){
        throw new Error( 'Time must use HH:MM' );
    }

    return block;
}

function createStore( filePath ){
    function list(){
        try {
            const data = JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
            return Array.isArray( data ) ? data : [];
        } catch ( error ){
            if( error.code === 'ENOENT' ){
                return [];
            }
            throw error;
        }
    }

    function save( blocks ){
        fs.mkdirSync( path.dirname( filePath ), { recursive: true } );
        const temporaryPath = `${ filePath }.tmp`;
        fs.writeFileSync( temporaryPath, JSON.stringify( blocks, null, 4 ) );
        fs.renameSync( temporaryPath, filePath );
    }

    return {
        list,
        create( input ){
            const blocks = list();
            const block = clean( input );
            blocks.push( block );
            save( blocks );
            return block;
        },
        update( id, input ){
            const blocks = list();
            const index = blocks.findIndex( block => block.id === id );
            if( index === -1 ){
                throw new Error( 'Custom block not found' );
            }
            blocks[ index ] = clean( input, id );
            save( blocks );
            return blocks[ index ];
        },
        remove( id ){
            const blocks = list();
            const remaining = blocks.filter( block => block.id !== id );
            if( remaining.length === blocks.length ){
                throw new Error( 'Custom block not found' );
            }
            save( remaining );
        }
    };
}

function toDayMap( blocks ){
    return blocks.reduce( ( days, block ) => {
        if( !block.enabled ){
            return days;
        }
        if( !days[ block.date ] ){
            days[ block.date ] = [];
        }
        days[ block.date ].push({
            title: block.title,
            text: block.text || '',
            time: block.time || '',
            image: block.image
        });
        return days;
    }, {} );
}

module.exports = { createStore, toDayMap };
