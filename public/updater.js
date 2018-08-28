'use strict';

(function( $ ){
    var hash = false;

    $.ajax( {
        dataType: 'json',
        url: '/checksum/',
        cache: false,
        success: function( data ){
            hash = data;
        }
    } );

    setInterval( checkIfUpdated, 60000 );

    function checkIfUpdated(){
        $.ajax( {
            dataType: 'json',
            url: '/checksum/',
            cache: false,
            success: function( data ){
                if( hash !== data ){
                    hash = data;
                    document.location.reload( true );
                }
            }
        } );
    }
})( $ );
