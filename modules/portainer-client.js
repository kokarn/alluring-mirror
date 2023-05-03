process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const portainerClient = async (apiPath, requestMethod) => {
    const requestParams = {
        method: requestMethod.toUpperCase(),
        // json: (typeof requestData === 'object') ? requestData : true,
        headers: {
            'x-api-key': process.env.PORTAINER_ACCESS_TOKEN,
        }
    };

    // if (typeof requestHeaders === 'object' && requestHeaders !== null) {
    //     requestParams.headers = requestHeaders;
    // }

    // console.log(requestParams);

    let response;

    try {
        response = await fetch(`${process.env.PORTAINER_URL}${apiPath}`, requestParams);
    } catch (requestError) {
        console.log(requestError);

        return [];
    }

    return await response.json();
};

module.exports = portainerClient;