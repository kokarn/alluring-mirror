(function () {
    const maxDays = 5;

    function setWeather() {
        $.ajax({
            url: 'weather/',
        })
            .then(function (weather) {
                html = '';

                let warningsHtml = '';
                if (weather.warnings && weather.warnings.length > 0) {
                    warningsHtml += '<div class="weather-warnings">';
                    weather.warnings.forEach(function (warning) {
                        const start = new Date(warning.approximateStart);
                        const end = new Date(warning.approximateEnd);
                        const formatTime = (d) => d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
                        const formatDate = (d) => d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });

                        let displayRange = '';
                        if (start.toDateString() === end.toDateString()) {
                            displayRange = formatDate(start) + ' ' + formatTime(start) + ' - ' + formatTime(end);
                        } else {
                            displayRange = formatDate(start) + ' ' + formatTime(start) + ' - ' + formatDate(end) + ' ' + formatTime(end);
                        }

                        warningsHtml += '<div class="weather-warning level-' + warning.levelCode.toLowerCase() + '">';
                        warningsHtml += warning.areaName + ': ' + warning.description + '<br>';
                        warningsHtml += '<small>' + displayRange + '</small>';
                        warningsHtml += '</div>';
                    });
                    warningsHtml += '</div>';
                }

                html +=
                    '<div class="current-weather-wrapper">' +
                    '<i class="icon-' + weather.now.code + '"></i> ' +
                    '<span>' + Math.ceil(weather.now.temperature) + '&deg;C</span>' +
                    '</div>';

                html = html + '<div class="foreacasts-wrapper">';

                var numDays = 0;
                for (var date in weather.forecast) {
                    const dateObject = new Date(date + 'T03:24:00');
                    html = html + '<div class="foreacast-wrapper">';
                    html = html + '<i class="icon-' + weather.forecast[date].code + '"></i>';
                    html = html + '<div class="forecast-weather-wrapper">' + dateObject.toLocaleString('en-us', { weekday: 'short' }) + '<br>' + Math.ceil(weather.forecast[date].high) + '&deg;C</div>';
                    html = html + '</div>';
                    numDays = numDays + 1;

                    if (numDays >= maxDays) {
                        break;
                    }
                }

                html = html + '</div>';
                html = html + warningsHtml;

                $('.js-weather').html(html);
            })
            .catch(function (promiseError) {
                $('.js-weather').html('<pre>' + JSON.stringify(promiseError, null, 4) + '</pre>');
                console.log(promiseError);
            });
    }

    $(function () {
        setWeather();

        setInterval(setWeather, 60000);
    });
})();
