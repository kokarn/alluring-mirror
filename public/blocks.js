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
            url: 'calendar/'
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

    function getDayName( date ){
        var dayDate = new Date( date );

        if( getTodayDate() == date ){
            return 'Today';
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

        items.sort( function( a, b ){
            var aTime;
            var bTime;

            if( a.time ){
                aTime = Number( a.time.replace( /:/gim, '' ) );
            } else {
                aTime = 0;
            }

            if( b.time ){
                bTime = Number( b.time.replace( /:/gim, '' ) );
            } else {
                bTime = 0;
            }

            if ( aTime < bTime ){
                return -1;
            }

            if ( aTime > bTime ) {
                return 1;
            }

            return 0;
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
        var $element = $( '<div class="item-wrapper"><img src="' + item.image + '"></div>' );
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
