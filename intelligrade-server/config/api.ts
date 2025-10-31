const DEFAULT_REST_PREFIX = "/api";

export default ({ env }) => ({
  rest: {
    prefix: env("STRAPI_REST_PREFIX", DEFAULT_REST_PREFIX),
    defaultLimit: 100,
    maxLimit: 1000,
    withCount: true,
  },
});
