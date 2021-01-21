const got = require( 'got' );

module.exports = async (title) => {
    const response = await got('https://sheetdb.io/api/v1/kydv66df0fplr');
    const mappingList = JSON.parse(response.body);
    const url = `http://webservice.fanart.tv/v3/tv/${ mappingList.find(mappingItem => mappingItem.Name === title )['TVDB ID'] }?api_key=${process.env.FANART_TV_API}`;
    let data;

    try {
        const response = await got( url );
        data = JSON.parse(response.body);
    } catch ( requestError ) {
        console.error(requestError);
        console.log( `Image ${ url } doesn't exist` );

        return false;
    }

    const sortedBackgrounds = data.showbackground.sort((a, b) => {
        const aLikes = Number(a.likes);
        const bLikes = Number(b.likes);
        if(aLikes < bLikes){
            return 1;
        }

        if(aLikes > bLikes){
            return -1;
        }

        return 0;
    });

    return `https://images.weserv.nl/?url=${encodeURIComponent(sortedBackgrounds[0].url)}&w=600&h=600&fit=contain&cbg=black`;
};
