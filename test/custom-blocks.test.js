const assert = require( 'assert' );
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );

const customBlocks = require( '../modules/custom-blocks-store' );

function test( name, callback ){
    try {
        callback();
        console.log( `✓ ${ name }` );
    } catch ( error ) {
        console.error( `✗ ${ name }` );
        throw error;
    }
}

test( 'create validates and persists a custom block', () => {
    const directory = fs.mkdtempSync( path.join( os.tmpdir(), 'mirror-blocks-' ) );
    const store = customBlocks.createStore( path.join( directory, 'custom-blocks.json' ) );
    const block = store.create({
        date: '2026-07-25',
        title: 'Beach day',
        text: 'Pack towels',
        time: '10:30',
        image: 'https://example.com/beach.jpg'
    });

    assert.ok( block.id );
    assert.strictEqual( block.title, 'Beach day' );
    assert.deepStrictEqual( store.list(), [ block ] );
} );

test( 'create rejects missing date, title, or image', () => {
    const directory = fs.mkdtempSync( path.join( os.tmpdir(), 'mirror-blocks-' ) );
    const store = customBlocks.createStore( path.join( directory, 'custom-blocks.json' ) );

    assert.throws( () => store.create({ title: 'No date', image: '/x.jpg' }), /date/i );
    assert.throws( () => store.create({ date: '2026-07-25', image: '/x.jpg' }), /title/i );
    assert.throws( () => store.create({ date: '2026-07-25', title: 'No image' }), /image/i );
} );

test( 'update and remove modify persisted blocks', () => {
    const directory = fs.mkdtempSync( path.join( os.tmpdir(), 'mirror-blocks-' ) );
    const storePath = path.join( directory, 'custom-blocks.json' );
    const store = customBlocks.createStore( storePath );
    const block = store.create({ date: '2026-07-25', title: 'Old', image: '/old.jpg' });

    const updated = store.update( block.id, { date: '2026-07-26', title: 'New', image: '/new.jpg' } );
    assert.strictEqual( updated.title, 'New' );
    assert.strictEqual( customBlocks.createStore( storePath ).list()[ 0 ].date, '2026-07-26' );

    store.remove( block.id );
    assert.deepStrictEqual( store.list(), [] );
} );

test( 'toDayMap returns enabled blocks using the mirror feed contract', () => {
    const blocks = [
        { id: '1', date: '2026-07-25', title: 'Beach day', text: 'Pack towels', time: '10:30', image: '/uploads/beach.jpg', enabled: true },
        { id: '2', date: '2026-07-25', title: 'Hidden', image: '/hidden.jpg', enabled: false }
    ];

    assert.deepStrictEqual( customBlocks.toDayMap( blocks ), {
        '2026-07-25': [ {
            title: 'Beach day',
            text: 'Pack towels',
            time: '10:30',
            image: '/uploads/beach.jpg'
        } ]
    } );
} );
