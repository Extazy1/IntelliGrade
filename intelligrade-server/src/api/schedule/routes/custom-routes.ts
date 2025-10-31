export default {
    routes: [
        {
            method: 'POST',
            path: '/schedules/:documentId/startMatching',
            handler: 'api::schedule.schedule.startMatching',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/schedules/:documentId/startObjective',
            handler: 'api::schedule.schedule.startObjective',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/schedules/:documentId/startSubjective',
            handler: 'api::schedule.schedule.startSubjective',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/schedules/askSubjective',
            handler: 'api::schedule.schedule.askSubjective',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/schedules/:documentId/calcResult',
            handler: 'api::schedule.schedule.calcResult',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}; 