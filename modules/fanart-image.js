const got = require( 'got' );

module.exports = async (title) => {
    const apiResponse = await got('https://sheetdb.io/api/v1/kydv66df0fplr');
    const mappingList = JSON.parse(apiResponse.body);
    const mappedSeries = mappingList.find(mappingItem => mappingItem.Name === title );

    if(!mappedSeries){
        console.log(`Found no series mapped to ${title} in the API`);

        return false;
    }

    const url = `http://webservice.fanart.tv/v3/tv/${ mappedSeries['TVDB ID'] }?api_key=${process.env.FANART_TV_API}`;
    let data;

    try {
        const response = await got( url );
        data = JSON.parse(response.body);
    } catch ( requestError ) {
        console.error(requestError);
        console.log( `Image ${ url } doesn't exist` );

        return false;
    }

    let sortedImages;

    if(data.tvthumb){
        sortedImages = data.tvthumb.sort((a, b) => {
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
    }

    if(!sortedImages && data.showbackground){
        sortedImages = data.showbackground.sort((a, b) => {
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
    }


    if(!sortedImages[0]){
        return false;
    }

    return `https://images.weserv.nl/?url=${encodeURIComponent(sortedImages[0].url)}&w=600&h=600&fit=cover&cbg=black`;
};
