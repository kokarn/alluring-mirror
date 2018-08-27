const fs = require( 'fs' );
const path = require( 'path' );

module.exports = function( request, response ){
    const imagesPath = path.join( __dirname, '..', 'image-cache' );

    if ( request.method === 'POST' ) {
        try {
            request.files.replace.mv( path.join( imagesPath, request.body.filename ), ( moveError ) => {
                if ( moveError ) {
                    return response.status( 500 ).send( moveError );
                }
            } );
        } catch ( parseError ) {
            console.error( parseError );
            displayError = parseError;
        }
    }

    fs.readdir( imagesPath, ( readError, files ) => {
        files = files.filter( ( item ) => {
            return !( /(^|\/)\.[^\/\.]/g ).test( item );
        } );

        if ( readError ) {
            response.send( readError );

            return false;
        }

        let imageHTML = files.map( ( filename ) => {
            const fileData = path.parse( filename );

            return `
            <div>
                <img src="/images/?query=${ fileData.name }" width="150x" height="150px">
                <span>${ filename }</span>
                <form method="post" action="." encType="multipart/form-data">
                    <input type="file" name="replace">
                    <input type="hidden" name="filename" value="${ filename }">
                    <input type="submit" value="Update image">
                </form>
            </div>
            `;
        } );

        console.log( files );

        let responseString = `
            <!DOCTYPE html>
            <head>
                <title>
                    View images
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
            ${ imageHTML.join( '' ) }
        `;

        response.send( responseString );
    } );
};
