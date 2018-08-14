(function(){
    function tick(){
        document.querySelectorAll( '.js-clock' )[ 0 ].innerText = getCurrentTime();
    }

    function zeroPad(number, length) {
        var str = String( number );

        while ( str.length < length ) {
            str = '0' + str;
        }

        return str;
    }

    function getCurrentTime(){
        var currentTime = new Date();

        return zeroPad( currentTime.getHours(), 2 ) + ':' + zeroPad( currentTime.getMinutes(), 2 ) + ':' + zeroPad( currentTime.getSeconds(), 2 );
    }

    setInterval( tick, 100 );
})();
