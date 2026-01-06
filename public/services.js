(function () {
    function setStatus() {
        $.ajax({
            url: 'portainer/'
        })
            .then(function (data) {
                if (typeof data === 'string') {
                    return true;
                }

                let $portainer = $('.service.js-portainer-service');
                if ($portainer.length === 0) {
                    $('.js-services').prepend('<div class="service js-portainer-service"></div>');
                    $portainer = $('.js-portainer-service');
                }

                $portainer.html(`Portainer: ${data.up}↑ ${data.down}↓`);
            });
    }

    function setElectricity() {
        $.ajax({
            url: 'electricity/',
        })
            .then(function (data) {
                if (!data || data.current === undefined) {
                    return;
                }

                const current = parseFloat(data.current).toFixed(2);
                const formatTime = (iso) => {
                    const date = new Date(iso);
                    return date.getHours().toString().padStart(2, '0') + ':' +
                        date.getMinutes().toString().padStart(2, '0');
                };

                let $electricity = $('.service.js-electricity-service');
                if ($electricity.length === 0) {
                    $('.js-services').append('<div class="service js-electricity-service"></div>');
                    $electricity = $('.js-electricity-service');
                }

                $electricity.html(`<div class="electricity-current">⚡ ${current} <span class="unit">sek/kwh</span></div>`);
            })
            .catch(function (error) {
                console.error('Error fetching electricity price:', error);
            });
    }

    setElectricity();
    // Update every 15 minutes
    setInterval(setElectricity, 900000);

    setStatus();
    setInterval(setStatus, 60000);
})();
