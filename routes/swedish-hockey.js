const ical = require( '../modules/ical' );

const config = require( '../config.json' );

const ICAL_BASE = 'https://hockey-mchockeyface.herokuapp.com/calendar?team=';

const getShortName = function getShortName( team ) {
    switch ( team ) {
        case 'AIK':
            return 'AIK';
        case 'Almtuna':
        case 'Almtuna IS':
            return 'AIS';
        case 'Björklöven':
            return 'IFB';
        case 'Karlskoga':
        case 'BIK Karlskoga':
            return 'BIK';
        case 'Karlskrona HK':
            return 'KHK';
        case 'Leksand':
        case 'Leksands IF':
            return 'LIF';
        case 'MODO':
        case 'MODO Hockey':
            return 'MODO';
        case 'IK Oskarshamn':
        case 'Oskarshamn':
            return 'IKO';
        case 'Pantern':
        case 'IK Pantern':
            return 'PAN';
        case 'Södertälje':
        case 'Södertälje SK':
            return 'SSK';
        case 'Timrå':
        case 'Timrå IK':
            return 'TIK';
        case 'Tingsryd':
        case 'Tingsryds AIF':
            return 'TAIF';
        case 'Troja/Ljungby':
        case 'Troja-Ljungby':
        case 'IF Troja-Ljungby':
            return 'TRO';
        case 'HC Vita Hästen':
        case 'Vita Hästen':
            return 'VIT';
        case 'Västerås':
            return 'VIK';
        case 'Frölunda HC':
            return 'FHC';
        case 'HV71':
            return 'HV71';
        case 'Brynäs IF':
            return 'BIF';
        case 'Rögle BK':
            return 'RBK';
        case 'Mora IK':
            return 'MIK';
        case 'Växjö Lakers':
            return 'VLH';
        case 'Malmö Redhawks':
            return 'MIF';
        case 'Linköping HC':
            return 'LHC';
        case 'Djurgården Hockey':
            return 'DIF';
        case 'Luleå Hockey':
            return 'LHF';
        case 'Örebro Hockey':
            return 'ÖRE';
        case 'Färjestad BK':
            return 'FBK';
        case 'Skellefteå AIK':
            return 'SKE';
        case 'Västerviks IK':
            return 'VIK';
        default:
            console.log( `Undefined team ${ team }` );
            return team;
    }
};

const getTeamMatches = function getTeamMatches( teamName, image ){
    const uppercaseName = teamName.toUpperCase();

    return new Promise( ( resolve, reject ) => {
        ical( `${ ICAL_BASE }${ uppercaseName }`, image )
            .then( ( items ) => {
                for ( const day in items ) {
                    for ( const item of items[ day ] ) {
                        const teams = item.title.split( ' - ' );

                        if ( getShortName( teams[ 0 ] ) == uppercaseName ) {
                            title = getShortName( teams[ 1 ] );
                        } else {
                            title = getShortName( teams[ 0 ] );
                        }

                        item.title = title;
                    }
                }

                resolve( items );
            } );
    } );
}

module.exports = function( request, response ){
    const teamMatches = [];

    if ( config[ 'swedish-hockey' ].length === 0 ) {
        response.send( {} );
    }

    for ( const team of config[ 'swedish-hockey' ] ) {
        teamMatches.push( getTeamMatches( team.name, team.image ) );
    }

    Promise.all( teamMatches )
        .then( ( matches ) => {
            const fullList = {};

            for ( const teamDays of matches ) {
                for ( const date in teamDays ) {
                    if ( !fullList[ date ] ) {
                        fullList[ date ] = [];
                    }

                    fullList[ date ] = fullList[ date ].concat( teamDays[ date ] );
                }
            }

            response.send( fullList );
        } )
};
