"use client";

const shouldLogStorage =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" || process.env.NODE_ENV !== "production";

const logStorage = (...message: unknown[]) => {
  if (!shouldLogStorage) {
    return;
  }

  // eslint-disable-next-line no-console
  console.warn("[storage]", new Date().toISOString(), ...message);
};

const hasWindow = () => typeof window !== "undefined";

const getStorage = () => {
  if (!hasWindow()) {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    logStorage("access-error", error);
    return null;
  }
};

export const safeGetStorageItem = (key: string): string | null => {
  if (!key) {
    return null;
  }

  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    logStorage("get-error", { key, error });
    return null;
  }
};

export const safeSetStorageItem = (key: string, value: string | null | undefined) => {
  if (!key) {
    return;
  }

  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    if (typeof value === "string" && value.length > 0) {
      storage.setItem(key, value);
    } else {
      storage.removeItem(key);
    }
  } catch (error) {
    logStorage("set-error", { key, value, error });
  }
};

export const safeRemoveStorageItem = (key: string) => {
  if (!key) {
    return;
  }

  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch (error) {
    logStorage("remove-error", { key, error });
  }
};

export const safeClearStorageItems = (keys: string[]) => {
  if (!Array.isArray(keys) || keys.length === 0) {
    return;
  }

  const storage = getStorage();

  if (!storage) {
    return;
  }

  keys.forEach((key) => {
    if (!key) {
      return;
    }

    try {
      storage.removeItem(key);
    } catch (error) {
      logStorage("clear-error", { key, error });
    }
  });
};
