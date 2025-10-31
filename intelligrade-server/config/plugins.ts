import fs from "node:fs";
import path from "node:path";

const ensureUploadDirectory = () => {
  const uploadDir = path.resolve(__dirname, "../public/uploads");

  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    throw new Error(
      `Unable to create the Strapi upload directory at ${uploadDir}: ${error}`
    );
  }

  return uploadDir;
};

export default () => {
  const uploadDir = ensureUploadDirectory();

  return {
    "users-permissions": {
      config: {
        jwt: {
          expiresIn: "7d", // Eg: 60, "45m", "10h", "2 days", "7d", "2y"
        }
      }
    },
    upload: {
      config: {
        sizeLimit: 1024 * 1024 * 1024, // 1GB
        providerOptions: {
          localServer: {
            maxage: 300000, // 强制缓存5 minutes
          }
        },
        breakpoints: null,
      }
    }
  };
};
