module.exports = {
    apps: [
        {
            name: 'alluring-mirror',
            script: './server.js',
            cwd: '/home/pi/alluring-mirror/current',
            env: {
                'NODE_ENV': 'development',
            },
            env_production: {
                'NODE_ENV': 'production',
            },
            watch: 'config.json',
        },
    ],
};