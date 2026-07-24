const assert = require( 'assert' );
const fs = require( 'fs' );

const html = fs.readFileSync( 'public/admin.html', 'utf8' );

assert.match( html, /href="\/admin\.css"/, 'Admin stylesheet must resolve from /config/' );
assert.match( html, /src="\/admin\.js"/, 'Admin script must resolve from /config/' );
console.log( '✓ admin assets use root-relative URLs' );
