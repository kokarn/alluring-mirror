(function () {
    const maxDays = 5;

    function setWeather() {
        $.ajax({
            url: 'weather/',
        })
            .then(function (weather) {
                html = '';

                // SMHI warnings split by severity:
                //  - MESSAGE (Meddelande / info-level advisories) -> compact chip
                //    ticker on the top bar, next to the electricity price.
                //  - YELLOW / ORANGE / RED (real warnings) -> full cards under
                //    the forecast, so they actually stand out.
                let tickerHtml = '';
                let cardsHtml = '';
                if (weather.warnings && weather.warnings.length > 0) {
                    // Turn "Risk för vattenbrist - Grundvatten och vattendrag" into "Vattenbrist".
                    const shortLabel = function (description) {
                        let label = description
                            .replace(/^Risk för\s+/i, '')
                            .replace(/\s*[-–—].*$/, '')
                            .trim();
                        return label.charAt(0).toUpperCase() + label.slice(1);
                    };

                    const formatRange = function (warning) {
                        const start = new Date(warning.approximateStart);
                        const end = new Date(warning.approximateEnd);
                        const isValid = (d) => d instanceof Date && !isNaN(d.getTime());
                        const formatTime = (d) => d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
                        const formatDate = (d) => d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });

                        if (!isValid(start)) {
                            return isValid(end) ? 'till ' + formatDate(end) + ' ' + formatTime(end) : '';
                        } else if (!isValid(end)) {
                            return formatDate(start) + ' ' + formatTime(start) + ' - tills vidare';
                        } else if (start.toDateString() === end.toDateString()) {
                            return formatDate(start) + ' ' + formatTime(start) + ' - ' + formatTime(end);
                        }
                        return formatDate(start) + ' ' + formatTime(start) + ' - ' + formatDate(end) + ' ' + formatTime(end);
                    };

                    weather.warnings.forEach(function (warning) {
                        const level = (warning.levelCode || 'message').toLowerCase();

                        if (level === 'message') {
                            tickerHtml += '<span class="warning-chip level-' + level + '">' + shortLabel(warning.description) + '</span>';
                        } else {
                            const displayRange = formatRange(warning);
                            cardsHtml += '<div class="weather-warning level-' + level + '">';
                            cardsHtml += warning.description + '<br>';
                            if (displayRange) {
                                cardsHtml += '<small>' + displayRange + '</small>';
                            }
                            cardsHtml += '</div>';
                        }
                    });

                    if (tickerHtml) {
                        tickerHtml = '<span class="warnings-lead">&#9888; SMHI</span>' + tickerHtml;
                    }
                    if (cardsHtml) {
                        cardsHtml = '<div class="weather-warnings">' + cardsHtml + '</div>';
                    }
                }
                $('.js-warnings').html(tickerHtml);

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
                html = html + cardsHtml;

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
