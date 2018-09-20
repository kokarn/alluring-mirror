const cheerio = require( 'cheerio' );
const got = require( 'got' );
const { CookieJar } = require( 'tough-cookie' );

const LOGIN_PAGE = 'https://www.coop.se/logga-in/';
const AUTH_URL = 'https://www.coop.se/api/auth/login';
const DATA_PAGE = 'https://www.coop.se/mitt-coop/';

const LOGIN_PAYLOAD = {
    email: process.env.COOP_USERNAME,
    password: process.env.COOP_PASSWORD,
    rememberMe: 'true',
};

const cookieJar = new CookieJar();

module.exports = function( request, response ){
    console.log( 'Loading login page' );
    got( LOGIN_PAGE, {
        cookieJar: cookieJar,
    } )
    .then( ( pageResponse ) => {
        console.log( 'got login page' );
        const $ = cheerio.load( pageResponse.body );

        const token = $( '[name="__RequestVerificationToken"]' ).attr( 'value' );

        console.log( `Got token ${ token }. Authing` );
        return got( AUTH_URL, {
            method: 'POST',
            headers: {
                __RequestVerificationToken: token,
                'content-type': 'application/json',
            },
            body: JSON.stringify( LOGIN_PAYLOAD ),
            cookieJar: cookieJar,
        } );
    } )
    .then( ( loginResponse ) => {
        console.log( 'Got auth' );

        console.log( 'Loading data page' );
        return got( DATA_PAGE, {
            cookieJar: cookieJar,
        } );
    } )
    .then( ( dataResponse ) => {
        console.log( 'Got data page' );
        const $ = cheerio.load( dataResponse.body );
        const dataset = $( '.Dashboard-heading' );


        response.json( {
            points: dataset.first().text().trim(),
            cash: dataset.last().text().trim(),
        } );
    } )
    .catch( ( requestError ) => {
        response.send( requestError );
    } );
};
