export default {
  async index(ctx) {
    ctx.body = {
      status: "ok",
      message: "Strapi API is running",
      timestamp: new Date().toISOString(),
    };
  },
};
