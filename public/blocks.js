(function(){
    var printed = 0;
    var max_printed = 5;
    function loadDays( callback ){
        var promises = [];

        promises.push( $.ajax({
            url: 'sonarr/'
        }));

        promises.push( $.ajax({
            url: 'swedish-hockey/'
        }));

        promises.push( $.ajax({
            url: 'world-cup/'
        }));

        promises.push( $.ajax({
            url: 'calendar/'
        }));

        promises.push( $.ajax({
            url: 'openings/'
        }));

        Promise.all( promises )
            .then( function( values ){
                console.log( 'got all promises ' );
                $( '.js-error' ).empty();
                callback( values );
            } )
            .catch( function( promiseError ){
                $( '.js-error' ).html( '<pre>' + JSON.stringify( promiseError, null, 4 ) + '</pre>' );
                console.log( promiseError );
            } );
    }

    function zeroPad(number, length) {
        var str = String( number );

        while ( str.length < length ) {
            str = '0' + str;
        }

        return str;
    }

    function getTodayDate(){
        var today = new Date();

        return today.getFullYear() + '-' + zeroPad( today.getMonth() + 1, 2 ) + '-' + zeroPad( today.getDate(), 2 );
    }

    function getTomorrowDate(){
        var tomorrow = new Date();
        tomorrow.setDate( tomorrow.getDate() + 1 );

        return tomorrow.getFullYear() + '-' + zeroPad( tomorrow.getMonth() + 1, 2 ) + '-' + zeroPad( tomorrow.getDate(), 2 );
    }

    // Parse the start time into a comparable HHMM number. Handles clock times
    // like "19:00" and opening-hour ranges like "08-13" (which Number() alone
    // turns into NaN, breaking the sort).
    function timeValue( time ){
        if( !time ){
            return 0;
        }

        var match = String( time ).match( /(\d{1,2})[:.]?(\d{2})?/ );

        if( !match ){
            return 0;
        }

        return Number( match[ 1 ] ) * 100 + Number( match[ 2 ] || 0 );
    }

    // Current wall-clock time as a comparable HHMM number.
    function nowValue(){
        var now = new Date();

        return now.getHours() * 100 + now.getMinutes();
    }

    // The time at which an item is considered "over". For an opening-hour range
    // like "08-13" that's the end (13:00); for a single clock time like "19:00"
    // it's that time (matching how ical feeds drop events at their start).
    // Returns null for all-day items (no time) so they never expire.
    function endValue( time ){
        if( !time ){
            return null;
        }

        var range = String( time ).match( /(\d{1,2})[:.]?(\d{2})?\s*-\s*(\d{1,2})[:.]?(\d{2})?/ );

        if( range ){
            return Number( range[ 3 ] ) * 100 + Number( range[ 4 ] || 0 );
        }

        return timeValue( time );
    }

    function getDayName( date ){
        var dayDate = new Date( date );

        if( getTodayDate() == date ){
            return 'Today';
        }

        if( getTomorrowDate() == date ){
            return 'Tomorrow';
        }

        switch( dayDate.getDay() ){
            case 0:
                return 'Sunday';
            case 1:
                return 'Monday';
            case 2:
                return 'Tuesday';
            case 3:
                return 'Wednesday';
            case 4:
                return 'Thursday';
            case 5:
                return 'Friday';
            case 6:
                return 'Saturday';
            default:
                return '???';
        }
    }

    function printDay( day, items ){
        var dayDate = new Date( day );
        var currentDate = new Date();
        var startOfTodayDate = new Date( currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() );

        var $outerWrapper = $( '.js-blocks' );
        var $titleWrapper = $( '<div class="day-title">' + getDayName( day ) + '</div>' )
        var $blockElement;

        if( dayDate.getTime() < startOfTodayDate.getTime() ){
            return false;
        }

        if( dayDate.getTime() > startOfTodayDate.getTime() + 7 * 24 * 60 * 60 * 1000 ){
            return false;
        }

        // For today, drop items that have already ended (timed items only;
        // all-day items with no time are kept). Other feeds' day-level filter
        // handles past days, but ical feeds already omit past events by
        // starting their window at "now" — this brings world-cup/openings and
        // any future timed feed in line for the current day.
        if( getTodayDate() == day ){
            var current = nowValue();

            items = items.filter( function( item ){
                var ends = endValue( item.time );

                return ends === null || ends >= current;
            } );
        }

        items.sort( function( a, b ){
            return timeValue( a.time ) - timeValue( b.time );
        } );

        for( var i = 0; i < items.length && printed < max_printed; i = i + 1 ){
            $blockElement = printBlock( $outerWrapper, items[ i ] );

            if( i === 0 ){
                $titleWrapper.css({
                    top: $blockElement.position().top + 17,
                    left: $blockElement.position().left
                });

                $outerWrapper.append( $titleWrapper );
            }
        }
    }

    function printBlock( $wrapper, item ){
        var $element;

        if( item.flags && item.flags.length === 2 ){
            $element = $( '<div class="item-wrapper wc-block">' +
                '<div class="wc-flags">' +
                    '<img class="wc-flag" src="' + item.flags[ 0 ] + '">' +
                    '<img class="wc-flag" src="' + item.flags[ 1 ] + '">' +
                '</div></div>' );
        } else {
            $element = $( '<div class="item-wrapper"><img src="' + item.image + '"></div>' );
        }

        var $footer = $( '<div class="footer"></div>' );

        if( item.title ){
            $footer.append( '<span class="title"> ' + item.title + '</span>' );
        }

        if( item.time ){
            $footer.append( '<time>' + item.time + '</time>' );
        }

        if( item.title || item.time ){
            $element.append( $footer );
        }

        $wrapper.append( $element );

        printed = printed + 1;

        return $element;
    }

    function printAllBlocks( items ){
        var days = {};
        var dayList = [];
        printed = 0;
        $( '.js-blocks' ).empty();

        for( var i = 0; i < items.length; i = i + 1 ){
            for( var day in items[ i ] ){
                if( items[ i ].hasOwnProperty( day ) ){
                    if( typeof days[ day ] === 'undefined' ){
                        days[ day ] = [];
                        dayList.push( day );
                    }

                    for( var x = 0; x < items[ i ][ day ].length; x = x + 1 ){
                        days[ day ].push( items[ i ][ day ][ x ] );
                    }
                }
            }
        }

        dayList.sort();

        for( var i = 0; i < dayList.length; i = i + 1 ){
            printDay( dayList[ i ], days[ dayList[ i ] ] );
        }
    }

    $(function(){
        loadDays( printAllBlocks );

        setInterval( function(){
            loadDays( printAllBlocks );
        }, 60000 );
    });
})();
