const portainerClient = require('../modules/portainer-client');

module.exports = async function(request, response) {
    if (!process.env.PORTAINER_URL || !process.env.PORTAINER_ACCESS_TOKEN) {
        return response.send('Portainer not configured');
    }
    let containers;
    try {
        containers = await portainerClient('/api/endpoints/2/docker/containers/json', 'get');
    } catch (requestError) {
        console.log(requestError);
    }

    let up = 0;
    let down = 0;

    containers.map((container) => {
        if (container.State === 'running') {
            up = up + 1;
        } else {
            down = down + 1;
        }
    });

    response.send({
        up: up,
        down: down,
    });
};