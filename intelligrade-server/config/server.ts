const DEFAULT_APP_KEYS = [
  "IntelliGradeSessionKeyA",
  "IntelliGradeSessionKeyB",
  "IntelliGradeSessionKeyC",
  "IntelliGradeSessionKeyD",
];

module.exports = ({ env }) => {
  const configuredKeys = env.array("APP_KEYS") ?? [];
  const appKeys = (configuredKeys.length > 0 ? configuredKeys : DEFAULT_APP_KEYS)
    .map((key) => key?.trim())
    .filter(Boolean);

  if (appKeys.length < 2) {
    throw new Error(
      "Strapi app.keys configuration requires at least two non-empty values. " +
        "Provide APP_KEYS in your environment or update config/server.ts."
    );
  }

  return {
    host: env("HOST", "0.0.0.0"),
    port: env.int("PORT", 1337),
    url: env("PUBLIC_URL", "https://47.82.94.221/strapi"),
    app: {
      keys: appKeys,
    },
  };
};
