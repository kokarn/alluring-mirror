(function(){
    var config = {};
    var blocks = [];
    var form = document.querySelector( '#block-form' );

    function page( name ){
        document.querySelectorAll( '.page' ).forEach( function( el ){ el.classList.toggle( 'active', el.id === name ); } );
        document.querySelectorAll( '.tab' ).forEach( function( el ){ el.classList.toggle( 'active', el.dataset.page === name ); } );
    }
    document.querySelectorAll( '[data-page]' ).forEach( function( el ){ el.onclick = function(){ page( el.dataset.page ); }; } );
    document.querySelectorAll( '[data-open-page]' ).forEach( function( el ){ el.onclick = function(){ page( el.dataset.openPage ); }; } );

    function escapeHtml( value ){
        var div = document.createElement( 'div' ); div.textContent = value || ''; return div.innerHTML;
    }
    function loadBlocks(){
        return fetch( '/custom-blocks/' ).then( function( response ){ return response.json(); } ).then( function( data ){ blocks = data; renderBlocks(); } );
    }
    function renderBlocks(){
        var list = document.querySelector( '#block-list' );
        if( !blocks.length ){ list.innerHTML = '<div class="empty">No custom blocks yet.</div>'; return; }
        list.innerHTML = blocks.slice().sort( function( a,b ){ return a.date.localeCompare( b.date ); } ).map( function( block ){
            return '<article class="block"><img src="' + escapeHtml( block.image ) + '"><div><h3>' + escapeHtml( block.title ) + '</h3><p>' + escapeHtml( block.date + ( block.time ? ' · ' + block.time : '' ) ) + '</p><p>' + escapeHtml( block.text ) + '</p><div class="block-buttons"><button class="secondary" data-edit="' + block.id + '">Edit</button><button class="danger" data-delete="' + block.id + '">Delete</button></div></div></article>';
        } ).join( '' );
        list.querySelectorAll( '[data-edit]' ).forEach( function( button ){ button.onclick = function(){ editBlock( button.dataset.edit ); }; } );
        list.querySelectorAll( '[data-delete]' ).forEach( function( button ){ button.onclick = function(){ deleteBlock( button.dataset.delete ); }; } );
    }
    function editBlock( id ){
        var block = blocks.find( function( item ){ return item.id === id; } );
        [ 'id','date','time','title','text' ].forEach( function( key ){ form.elements[ key ].value = block[ key ] || ''; } );
        form.elements.imageUrl.value = block.image.indexOf( '/uploads/' ) === 0 ? '' : block.image;
        form.elements.imageUrl.dataset.current = block.image;
        form.elements.enabled.checked = block.enabled;
        document.querySelector( '#form-title' ).textContent = 'Edit day block';
        document.querySelector( '#cancel-edit' ).hidden = false;
        updatePreview( block.image ); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function resetForm(){
        form.reset(); form.elements.id.value = ''; form.elements.enabled.checked = true; form.elements.imageUrl.dataset.current = '';
        document.querySelector( '#form-title' ).textContent = 'Add a day block'; document.querySelector( '#cancel-edit' ).hidden = true; updatePreview();
    }
    function updatePreview( override ){
        var file = form.elements.imageFile.files[ 0 ];
        var image = override || ( file ? URL.createObjectURL( file ) : form.elements.imageUrl.value || form.elements.imageUrl.dataset.current );
        document.querySelector( '#preview' ).style.backgroundImage = image ? 'url("' + image.replace( /"/g, '' ) + '")' : '';
        document.querySelector( '#preview-caption' ).textContent = form.elements.title.value || 'Your block preview';
    }
    form.addEventListener( 'input', function(){ updatePreview(); } );
    form.addEventListener( 'submit', function( event ){
        event.preventDefault(); var data = new FormData( form ); var id = data.get( 'id' );
        data.set( 'enabled', form.elements.enabled.checked ? 'true' : 'false' );
        if( !data.get( 'imageUrl' ) && form.elements.imageUrl.dataset.current ){ data.set( 'image', form.elements.imageUrl.dataset.current ); }
        fetch( '/custom-blocks/' + ( id || '' ), { method: id ? 'PUT' : 'POST', body: data } ).then( jsonResponse ).then( function(){ status( 'block-status', 'Saved' ); resetForm(); return loadBlocks(); } ).catch( function( error ){ alert( error.message ); } );
    } );
    function deleteBlock( id ){
        if( !confirm( 'Delete this block?' ) ){ return; }
        fetch( '/custom-blocks/' + id, { method: 'DELETE' } ).then( jsonResponse ).then( loadBlocks ).catch( function( error ){ alert( error.message ); } );
    }
    document.querySelector( '#cancel-edit' ).onclick = resetForm;

    function jsonResponse( response ){ return response.json().then( function( data ){ if( !response.ok ){ throw new Error( data.error || 'Request failed' ); } return data; } ); }
    function status( id, text ){ var el = document.querySelector( '#' + id ); el.textContent = text; setTimeout( function(){ el.textContent = ''; }, 2500 ); }
    function loadConfig(){
        return fetch( '/config.json?ts=' + Date.now() ).then( function( response ){ return response.json(); } ).then( function( data ){
            config = data; document.querySelector( '#config-json' ).value = JSON.stringify( config, null, 4 );
            var f = document.querySelector( '#settings-form' );
            f.weather.value = config.weather || ''; f.openings.value = ( config.openings || [] ).join( ', ' );
            f.hemglassLatitude.value = config.hemglass && config.hemglass.latitude || ''; f.hemglassLongitude.value = config.hemglass && config.hemglass.longitude || '';
            f.electricityRegion.value = config.electricity && config.electricity.region || 'SE3'; f.electricityMarkup.value = config.electricity && config.electricity.markup || 0;
            f.worldCup.checked = config[ 'world-cup' ] === true; f.coop.checked = config.coop === true;
        } );
    }
    function saveConfig( next, statusId ){
        return fetch( '/config/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify( next ) } ).then( jsonResponse ).then( function( result ){ config = result.config; document.querySelector( '#config-json' ).value = JSON.stringify( config, null, 4 ); status( statusId, 'Saved and applied' ); } );
    }
    document.querySelector( '#settings-form' ).onsubmit = function( event ){
        event.preventDefault(); var f = event.target; var next = JSON.parse( JSON.stringify( config ) );
        next.weather = f.weather.value.trim(); next.openings = f.openings.value.split( ',' ).map( function( x ){ return x.trim(); } ).filter( Boolean );
        next.hemglass = { latitude: Number( f.hemglassLatitude.value ), longitude: Number( f.hemglassLongitude.value ) };
        next.electricity = Object.assign( {}, next.electricity, { region: f.electricityRegion.value, markup: Number( f.electricityMarkup.value ) } );
        next[ 'world-cup' ] = f.worldCup.checked; next.coop = f.coop.checked;
        saveConfig( next, 'settings-status' ).catch( function( error ){ alert( error.message ); } );
    };
    document.querySelector( '#format-json' ).onclick = function(){ try{ document.querySelector( '#config-json' ).value = JSON.stringify( JSON.parse( document.querySelector( '#config-json' ).value ), null, 4 ); }catch( error ){ alert( error.message ); } };
    document.querySelector( '#save-json' ).onclick = function(){ try{ saveConfig( JSON.parse( document.querySelector( '#config-json' ).value ), 'json-status' ).catch( function( error ){ alert( error.message ); } ); }catch( error ){ alert( error.message ); } };

    resetForm(); Promise.all([ loadBlocks(), loadConfig() ]).catch( function( error ){ alert( error.message ); } );
})();
