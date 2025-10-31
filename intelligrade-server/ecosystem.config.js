module.exports = {
    apps: [{
        name: 'intelligrade-server',
        script: 'pnpm',
        args: 'run start',
        env: {
            NODE_ENV: 'production',
        },
        interpreter: 'none',
        watch: '.'
    }],
};