const got = require('got');


module.exports = async (title) => {
    // https://bendodson.com/projects/apple-tv-movies-artwork-finder/

    let url = `https://uts-api.itunes.apple.com/uts/v2/search/incremental?sf=143441&locale=en-GB&caller=wta&utsk=c90b62a3458fde7%3A%3A%3A%3A%3A%3Ab659e02d87afc13&v=34&pfm=desktop&q=${title.toLowerCase().replace(/\s/g, '+')}`;

    const response = await got( url );

    const searchData = JSON.parse(response.body);

    for(const shelve of searchData.data.canvas.shelves){
        for(const item of shelve.items){
            if(item.title !== title){
                continue;
            }

            for(const imageKey in item.images){
                if(item.images[imageKey].width !== item.images[imageKey].height){
                    continue;
                }

                return item.images[imageKey].url.replace('{w}', 600).replace('{h}', 600).replace('{f}', 'jpg');
            }
        }
    }

    return false;
};

