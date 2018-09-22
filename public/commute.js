(function( $ ){
    var trips;
    var display = {
        from: {
            hour: 7,
            minute: 15,
            day: 1
        },
        to: {
            hour: 8,
            minute: 30,
            day: 5,
        }
    };

    function shouldDisplay(){
        var now = new Date();
        var currentHour = now.getHours();
        var currentMinute = now.getMinutes();
        var dayOfWeek = now.getDay();

        if ( dayOfWeek < display.from.day ) {
            return false;
        }

        if ( dayOfWeek > display.to.day ) {
            return false;
        }

        if( currentHour < display.from.hour ){
            return false;
        }

        if( currentHour > display.to.hour ){
            return false;
        }

        if( currentHour === display.from.hour && currentMinute < display.from.minute ){
            return false;
        }

        if( currentHour == display.to.hour && currentMinute > display.to.minute ){
            return false;
        }

        return true;
    }

    function cssIfyString( string ){
        return string.toLowerCase().replace( /\s+/gim, '-' ).replace( /[^a-z\-]/gim, '' );
    }

    function printTrips( trips ){
        var $wrapper = $( '.js-commute' );
        var $destinationWrapper;
        var tripName;
        var i;
        var $route;

        $wrapper.empty();

        if( !shouldDisplay() ){
            return false;
        }

        for( var identifier in trips ){
            if( trips.hasOwnProperty( identifier ) ){
                tripName = [];
                for( i = 0; i < trips[ identifier ].route.length; i = i + 1 ){
                    if( trips[ identifier ].route[ i ].destination === trips[ identifier ].destination ){
                        tripName.push( trips[ identifier ].route[ i ].name );
                        continue;
                    }

                    tripName.push( trips[ identifier ].route[ i ].name + ' --> ' + trips[ identifier ].route[ i ].destination );
                }

                tripName = tripName.join( ' --> ' );

                $route = $( '<div class="route-wrapper"><span class="trip-name">' + tripName + '</span></div>' );

                for( i = 0; i < trips[ identifier ][ 'ttl' ].length; i = i + 1 ){
                    $route.append( '<span class="trip-time">' + trips[ identifier ][ 'ttl' ][ i ] + '</span>' );
                }

                $destinationWrapper = $( '.js-destination-' + cssIfyString( trips[ identifier ].destination ) );

                if( $destinationWrapper.length <= 0 ){
                    $destinationWrapper = $( '<div class="destination-wrapper js-destination-' + cssIfyString( trips[ identifier ].destination ) + '"></div>' );
                    $wrapper.append( $destinationWrapper );

                    $destinationWrapper.before( '<h2>' + trips[ identifier ].destination + '</h2>' );
                }

                $destinationWrapper.append( $route );
            }
        }
    }

    function getTrips(){
        var xhr = $.ajax({
            url: 'vasttrafik/'
        });

        xhr.done( function( response ){
            printTrips( response );
        });
    }

    $(function(){
        getTrips();

        setInterval( getTrips, 60000 );
    });
})( $ );
