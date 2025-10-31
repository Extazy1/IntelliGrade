const DEFAULT_ADMIN_AUTH_SECRET = "IntelliGradeAdminAuthSecretDefault";
const DEFAULT_API_TOKEN_SALT = "IntelliGradeApiTokenSaltDefault";
const DEFAULT_TRANSFER_TOKEN_SALT = "IntelliGradeTransferTokenSaltDefault";

const readConfigString = (env, key: string, fallback: string) => {
  const rawValue = env(key);
  const trimmed =
    typeof rawValue === "string" && rawValue.trim().length > 0
      ? rawValue.trim()
      : fallback.trim();

  if (trimmed.length === 0) {
    throw new Error(
      `${key} must be configured with a non-empty string. ` +
        `Set ${key} in your environment or update config/admin.ts.`
    );
  }

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    process.env[key] = trimmed;
  }

  return trimmed;
};

export default ({ env }) => ({
  auth: {
    secret: readConfigString(env, "ADMIN_JWT_SECRET", DEFAULT_ADMIN_AUTH_SECRET),
  },
  apiToken: {
    salt: readConfigString(env, "API_TOKEN_SALT", DEFAULT_API_TOKEN_SALT),
  },
  transfer: {
    token: {
      salt: readConfigString(env, "TRANSFER_TOKEN_SALT", DEFAULT_TRANSFER_TOKEN_SALT),
    },
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
});
