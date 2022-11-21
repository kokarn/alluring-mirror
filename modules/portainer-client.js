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

    const response = await fetch(`${process.env.PORTAINER_URL}${apiPath}`, requestParams);

    return await response.json();
};

module.exports = portainerClient;