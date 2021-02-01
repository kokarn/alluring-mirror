const got = require( 'got' );

module.exports = async (title) => {
    const url = `https://raw.githack.com/kokarn/alluring-mirror-images/master/${ encodeURIComponent( title ) }.jpg`;
    try {
        await got( url, {
            method: 'HEAD',
        } );
    } catch ( requestError ) {
        console.log( `Image ${ url } doesn't exist` );

        return false;
    }

    return url;
};
