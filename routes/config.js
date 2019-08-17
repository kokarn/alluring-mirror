const fs = require( 'fs' );
const path = require( 'path' );

module.exports = function( request, response ){
    const configPath = path.join( __dirname, '..', 'data', 'config.json' );
    let displayError = false;

    if ( request.method === 'POST' ) {
        try {
            const data = JSON.parse( request.body.config );

            fs.writeFileSync( configPath, JSON.stringify( data, null, 4 ) );
        } catch ( parseError ) {
            console.error( parseError );
            displayError = parseError;
        }
    }

    fs.readFile( configPath, ( readError, fileContents ) => {
        if ( readError ) {
            response.send( readError );

            return false;
        }

        let responseString = `
            <!DOCTYPE html>
            <head>
                <title>
                    Edit config
                </title>
                <style>
                    * {
                        box-sizing: border-box;
                    }

                    html,
                    body {
                        min-height: 100%;
                        height: 100%;
                    }

                    body {
                        overflow: hidden;
                    }

                    textarea {
                        min-height: 600px;
                        width: 100%;
                    }
                </style>
            </head>
            <body>
            <form method="post" action=".">
                <textarea name="config">${ fileContents }</textarea>
                <input type="submit" value="Save">
            </form>
        `;

        if ( displayError ) {
            responseString = `${ responseString }<pre>${ displayError }</pre>`;
        }

        response.send( responseString );
    } );
};
