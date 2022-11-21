(function(){
    function setStatus(){
        $.ajax( {
            url: 'portainer/'
        } )
            .then( function( data ){
                if(typeof data === 'string'){
                    return true;
                }

                document.querySelectorAll( '.js-services' )[ 0 ].innerHTML = `Portainer: ${data.up}↑ ${data.down}↓`;
            } );
    }

    setStatus();
    setInterval( setStatus, 60000 );
})();
