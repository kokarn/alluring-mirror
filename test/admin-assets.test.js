const assert = require( 'assert' );
const fs = require( 'fs' );

const html = fs.readFileSync( 'public/admin.html', 'utf8' );
const css = fs.readFileSync( 'public/admin.css', 'utf8' );
const javascript = fs.readFileSync( 'public/admin.js', 'utf8' );

assert.match( html, /href="\/admin\.css"/, 'Admin stylesheet must resolve from /config/' );
assert.match( html, /src="\/admin\.js"/, 'Admin script must resolve from /config/' );
assert.match( html, /class="preview item-wrapper"/, 'Preview must use the mirror block class' );
assert.match( html, /class="footer"/, 'Preview must use the mirror footer structure' );
assert.match( css, /\.preview\s*\{[^}]*width:\s*160px;[^}]*height:\s*160px;/s, 'Preview must match the 160px square mirror block' );
assert.match( javascript, /preview-text.*form\.elements\.text\.value/s, 'Preview must render the custom block text' );
assert.match( javascript, /preview-time.*form\.elements\.time\.value/s, 'Preview must render the block time' );
console.log( '✓ admin assets and mirror-accurate preview are configured' );
