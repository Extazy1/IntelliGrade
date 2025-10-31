'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import { AuthContextObject } from "@/types/types";
import { axiosInstance } from "@/lib/axios";
import {
  safeClearStorageItems,
  safeGetStorageItem,
  safeSetStorageItem,
} from "@/lib/storage";

type StoredUser = {
  userName: string;
  email: string;
  id: string;
  documentId: string;
};

const STORAGE_KEYS: StoredUser & { jwt: string } = {
  userName: "userName",
  email: "email",
  id: "id",
  documentId: "documentId",
  jwt: "jwt",
};

const isBrowser = () => typeof window !== "undefined";

const shouldLogAuth =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" || process.env.NODE_ENV !== "production";

const logAuth = (...message: unknown[]) => {
  if (!shouldLogAuth) {
    return;
  }

  // eslint-disable-next-line no-console
  console.info("[auth]", new Date().toISOString(), ...message);
};

const writeAuthSnapshot = (state: Record<string, unknown>) => {
  if (typeof window === "undefined") {
    return;
  }

  const target = window as typeof window & {
    __INTELLIGRADE_AUTH_STATE__?: Record<string, unknown>;
  };

  target.__INTELLIGRADE_AUTH_STATE__ = {
    ...(target.__INTELLIGRADE_AUTH_STATE__ ?? {}),
    ...state,
    timestamp: new Date().toISOString(),
  };
};

const writeStorage = (key: string, value: string) => {
  if (!isBrowser() || !key) {
    return;
  }

  safeSetStorageItem(key, value);
};

const readStoredUser = (): StoredUser | null => {
  if (!isBrowser()) {
    return null;
  }

  const storedUserName = safeGetStorageItem(STORAGE_KEYS.userName);
  const storedEmail = safeGetStorageItem(STORAGE_KEYS.email);
  const storedId = safeGetStorageItem(STORAGE_KEYS.id);
  const storedDocumentId = safeGetStorageItem(STORAGE_KEYS.documentId);

  if (storedUserName && storedEmail && storedId && storedDocumentId) {
    return {
      userName: storedUserName,
      email: storedEmail,
      id: storedId,
      documentId: storedDocumentId,
    };
  }

  return null;
};

const readStoredJwt = () => {
  if (!isBrowser()) {
    return null;
  }

  return safeGetStorageItem(STORAGE_KEYS.jwt);
};

export const AuthContext = createContext<AuthContextObject>({} as AuthContextObject);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [jwt, setJwt] = useState("");
  const [authenticated, setAuthenticatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const updateAuthenticated = useCallback(
    (value: SetStateAction<boolean>, reason: string) => {
      setAuthenticatedState((previous) => {
        const nextValue = typeof value === "function" ? value(previous) : value;

        if (previous === nextValue) {
          logAuth(`auth unchanged (${reason})`, { value: nextValue });
          return previous;
        }

        logAuth(`auth updated (${reason})`, { from: previous, to: nextValue });
        return nextValue;
      });
    },
    [],
  );

  const setAuthenticated = useCallback<AuthContextObject["setAuthenticated"]>(
    (value) => {
      updateAuthenticated(value, "context-setter");
    },
    [updateAuthenticated],
  );

  const clearStoredSession = useCallback(() => {
    if (!isBrowser()) {
      return;
    }

    safeClearStorageItems(Object.values(STORAGE_KEYS));
  }, []);

  const applyUser = useCallback(
    ({ userName, email, id, documentId }: StoredUser, source: string) => {
      const safeUserName = userName && userName !== "undefined" ? userName : "";
      const safeEmail = email && email !== "undefined" ? email : "";
      const safeId = id && id !== "undefined" ? id : "";
      const safeDocumentId =
        documentId && documentId !== "undefined" ? documentId : "";

      setUserName(safeUserName);
      setEmail(safeEmail);
      setId(safeId);
      setDocumentId(safeDocumentId);

      writeStorage(STORAGE_KEYS.userName, safeUserName);
      writeStorage(STORAGE_KEYS.email, safeEmail);
      writeStorage(STORAGE_KEYS.id, safeId);
      writeStorage(STORAGE_KEYS.documentId, safeDocumentId);

      const hasCompleteProfile = Boolean(safeUserName && safeEmail && safeId);

      updateAuthenticated(
        (previous) => (hasCompleteProfile ? true : previous),
        `applyUser:${source}`,
      );

      logAuth("applied user profile", {
        source,
        hasCompleteProfile,
        safeUserName,
        safeEmail,
        safeId,
        safeDocumentId,
      });
    },
    [updateAuthenticated],
  );

  const clearSession = useCallback(() => {
    Cookies.remove("jwt");
    clearStoredSession();
    updateAuthenticated(false, "clearSession");
    setUserName("");
    setEmail("");
    setId("");
    setDocumentId("");
    setJwt("");
    logAuth("session cleared");
    writeAuthSnapshot({ authenticated: false, jwt: null, user: null, phase: "clear-session" });
  }, [clearStoredSession, updateAuthenticated]);

  const logout = useCallback(async () => {
    clearSession();
    router.push("/");
  }, [clearSession, router]);

  const hydrateSession = useCallback(async () => {
    try {
      const cookieJwt = Cookies.get("jwt");
      const storedJwt = readStoredJwt();
      const activeJwt = cookieJwt ?? storedJwt ?? "";

      logAuth("hydrateSession:start", {
        hasCookieJwt: Boolean(cookieJwt),
        hasStoredJwt: Boolean(storedJwt),
      });

      if (!activeJwt) {
        clearSession();
        logAuth("hydrateSession:missing-jwt");
        writeAuthSnapshot({ phase: "missing-jwt" });
        return;
      }

      setJwt(activeJwt);
      writeStorage(STORAGE_KEYS.jwt, activeJwt);

      if (!cookieJwt && activeJwt) {
        Cookies.set("jwt", activeJwt);
        logAuth("hydrateSession:set-cookie-from-storage");
      }

      updateAuthenticated(true, "hydrateSession:jwt-present");
      writeAuthSnapshot({ phase: "jwt-present", jwt: activeJwt });

      const storedUser = readStoredUser();
      if (storedUser) {
        applyUser(storedUser, "localStorage");
        writeAuthSnapshot({ phase: "local-storage", user: storedUser });
      } else {
        logAuth("hydrateSession:no-stored-user");
        writeAuthSnapshot({ phase: "local-storage-miss" });
      }

      try {
        const response = await axiosInstance.get("/users/me");

        const profile = response?.data as
          | (Partial<StoredUser> & {
              id?: number | string;
              username?: string;
              email?: string;
              documentId?: string;
              error?: unknown;
              success?: boolean;
            })
          | undefined;

        const status = response?.status ?? 0;
        const hasValidStatus = status >= 200 && status < 300;
        const isNotModified = status === 304;
        const isErrorPayload = profile?.success === false || profile?.error;

        if (!hasValidStatus && !isNotModified) {
          throw new Error(`Failed to load user profile (status: ${status || "n/a"})`);
        }

        if (isErrorPayload) {
          throw new Error("Failed to load user profile (payload error)");
        }

        if (isNotModified) {
          if (storedUser) {
            logAuth("hydrateSession:profile-not-modified");
            applyUser(storedUser, "not-modified");
            writeAuthSnapshot({ phase: "profile-not-modified", user: storedUser });
          } else {
            logAuth("hydrateSession:profile-not-modified-no-cache");
            writeAuthSnapshot({ phase: "profile-not-modified-no-cache" });
          }
          return;
        }

        if (!profile) {
          throw new Error("Failed to load user profile (empty body)");
        }

        const appliedUser = {
          userName: profile.username ?? storedUser?.userName ?? "",
          email: profile.email ?? storedUser?.email ?? "",
          id:
            typeof profile.id === "number"
              ? String(profile.id)
              : profile.id ?? storedUser?.id ?? "",
          documentId: profile.documentId ?? storedUser?.documentId ?? "",
        };

        applyUser(appliedUser, "remote");
        logAuth("hydrateSession:profile-loaded");
        writeAuthSnapshot({ phase: "profile-loaded", user: appliedUser });
      } catch (error) {
        logAuth("hydrateSession:error", error);
        clearSession();
        router.replace("/auth/login");
        writeAuthSnapshot({ phase: "error", error: String(error) });
        return;
      }
    } catch (error) {
      logAuth("hydrateSession:unexpected-error", error);
      clearSession();
      router.replace("/auth/login");
      writeAuthSnapshot({ phase: "unexpected-error", error: String(error) });
    } finally {
      setIsLoading(false);
      logAuth("hydrateSession:complete");
      writeAuthSnapshot({ phase: "complete", isLoading: false });
    }
  }, [applyUser, clearSession, router, updateAuthenticated]);

  useEffect(() => {
    hydrateSession();
    writeAuthSnapshot({ phase: "hydrate-session-effect" });
  }, [hydrateSession]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) {
        return;
      }

      if (!Object.values(STORAGE_KEYS).includes(event.key)) {
        return;
      }

      const storedUser = readStoredUser();

      if (storedUser) {
        logAuth("storage-event:apply-user", { key: event.key });
        applyUser(storedUser, "storage-event");
      } else {
        logAuth("storage-event:clear-session", { key: event.key });
        clearSession();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [applyUser, clearSession]);

  const contextValue = useMemo(
    () => ({
      userName,
      email,
      id,
      jwt,
      authenticated,
      isLoading,
      setUserName,
      setEmail,
      setId,
      setJwt,
      setAuthenticated,
      logout,
      documentId,
      setDocumentId,
    }),
    [
      userName,
      email,
      id,
      jwt,
      authenticated,
      isLoading,
      setAuthenticated,
      logout,
      documentId,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
