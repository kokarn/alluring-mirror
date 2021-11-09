const fs = require( 'fs' );
const path = require( 'path' );

const got = require( 'got' );

const appleImage = require('../modules/apple-image');
const githubImage = require( '../modules/github-image' );
const fanartTvImage = require( '../modules/fanart-image' );

const IMAGE_CACHE_PATH = path.join( __dirname, '..', 'data', 'image-cache' );

module.exports = async function( request, response ){
    if ( request.params[ '0' ] ) {
        const imagePath = path.join( IMAGE_CACHE_PATH, `${ request.params[ '0' ] }` );

        if ( fs.existsSync( imagePath ) ) {
            response.sendFile( imagePath );

            return true;
        }
    }

    const fallbackUrl = 'https://i.imgur.com/fuVi5It.png'
    const search = request.query.query;
    const imagePath = path.join( IMAGE_CACHE_PATH, `${ search }.jpg` );

    if ( fs.existsSync( imagePath ) ) {
        response.sendFile( imagePath );

        return true;
    }

    let url;

    try {
        console.log(`Loading ${search} from AppleTV`);
        url = await appleImage(search);
    } catch ( githubError ) {
        console.error( githubError );
    }

    if(!url){
        try {
            console.log(`Loading ${search} from Github`);
            url = await githubImage( search );
        } catch ( githubError ) {
            console.error( githubError );
        }
    }

    if(!url){
        try {
            console.log(`Loading ${search} from fanart`);
            url = await fanartTvImage( search );
        } catch ( fanartError ) {
            console.error( fanartError );
        }
    }

    if(!url){
        return response.redirect(fallbackUrl);
    }

    const writeStream = got.stream( url ).pipe( fs.createWriteStream( imagePath ) );

    writeStream.on( 'close', () => {
        response.sendFile( imagePath );
    } );
};
