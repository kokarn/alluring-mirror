const portainerClient = require('../modules/portainer-client');

module.exports = async function(request, response) {
    if (!process.env.PORTAINER_URL || !process.env.PORTAINER_ACCESS_TOKEN) {
        return response.send('Portainer not configured');
    }
    let up = 0;
    let down = 0;

    let environments = await portainerClient('/api/endpoints?start=1&limit=50&provisioned=true&edgeDevice=false&tagsPartialMatch=true', 'get');

    for(const environment of environments) {
        let environmentContainers;
        try {
            environmentContainers = await portainerClient(`/api/endpoints/${environment.Id}/docker/containers/json`, 'get');
        } catch (requestError) {
            console.log(requestError);
        }

        environmentContainers?.map((container) => {
            if (container.State === 'running') {
                up = up + 1;
            } else {
                down = down + 1;
            }
        });
    }

    response.send({
        up: up,
        down: down,
    });
};