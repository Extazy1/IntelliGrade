export default {
    routes: [
        {
            method: 'GET',
            path: '/pdfs/:id',
            handler: 'pdf.find',
        },
    ],
};
