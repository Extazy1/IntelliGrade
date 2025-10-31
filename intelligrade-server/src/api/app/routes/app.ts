export default {
  routes: [
    {
      method: "GET",
      path: "/",
      handler: "app.index",
      config: {
        auth: false,
      },
    },
  ],
};
