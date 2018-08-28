module.exports = function( shipit ) {
    // Load shipit-deploy tasks
    require( 'shipit-deploy' )( shipit );

    shipit.initConfig( {
        default: {
            repositoryUrl: 'https://kokarn@github.com/kokarn/alluring-mirror.git',
            keepReleases: 2,
        },
        production: {
            servers: [
                {
                    host: '192.168.0.195',
                    user: 'pi',
                },
            ],
            deployTo: '/home/pi/alluring-mirror',
            branch: 'master',
        },
    } );

    shipit.blTask( 'startOrRestart', async () => {
        await shipit.remote( `cd ${ shipit.config.deployTo } && sudo pm2 startOrRestart --env ${ shipit.environment } current/ecosystem.config.js` )
    } );

    shipit.blTask( 'install', async () => {
        await shipit.remote( `cd ${ shipit.releasePath }; npm install --production` );
    } );

    shipit.blTask( 'assets', async () => {
        await shipit.remote( `cp -a ${ shipit.config.deployTo }/static/. ${ shipit.releasePath }` );
        await shipit.remote( `rsync -a ${ shipit.releasesPath }/${ shipit.previousRelease }/image-cache/ ${ shipit.releasePath }/image-cache/` );
    } );

    shipit.on( 'deployed', async () => {
        await shipit.start( 'install', 'assets', 'startOrRestart' );
    } );
};
