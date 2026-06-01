import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import type { AuthUser, LoginPayload, RegisterPayload, UserRole } from "../../types";
import {
  apiClient,
  authSessionExpiredEvent,
  authSessionRefreshedEvent,
  unwrap,
  unwrapToken,
} from "../api/client";
import { useLanguage } from "../i18n/LanguageProvider";
import { useToast } from "../../components/ToastProvider";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  updateUser: (updates: Partial<AuthUser>) => AuthUser | null;
  logout: () => void;
};

const userKey = "fundraise_user";
const tokenKey = "fundraise_token";
const refreshTokenKey = "fundraise_refresh_token";
const registerHintKey = "fundraise_register_hint";
const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeRole = (user: Record<string, unknown>, requestedRole: UserRole): UserRole => {
  const roleObject =
    user.role && typeof user.role === "object" ? (user.role as Record<string, unknown>) : null;
  const role = String(
    roleObject?.nama_role ||
      roleObject?.name ||
      user.role_name ||
      user.level ||
      user.role ||
      requestedRole,
  ).toLowerCase();
  if (["umkm", "investor", "admin", "superadmin"].includes(role)) return role as UserRole;
  const roleId = Number(user.role_id ?? roleObject?.id);
  if (roleId === 2) return "investor";
  if (roleId === 1) return "umkm";
  return requestedRole;
};

const fallbackName = (role: UserRole) => {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Admin";
  if (role === "investor") return "Investor";
  return "UMKM";
};

const normalizeUser = (
  rawUser: Record<string, unknown>,
  requestedRole: UserRole,
): AuthUser => ({
  id: (rawUser.id as number | string | undefined) ?? Date.now(),
  nama: String(rawUser.nama || rawUser.name || fallbackName(requestedRole)),
  email: String(rawUser.email || ""),
  role: normalizeRole(rawUser, requestedRole),
  role_id:
    (rawUser.role_id as number | undefined) ??
    ((rawUser.role && typeof rawUser.role === "object"
      ? (rawUser.role as Record<string, unknown>).id
      : undefined) as number | undefined),
  level: rawUser.level as "admin" | "superadmin" | undefined,
  no_telp: rawUser.no_telp as string | undefined,
});

const saveSession = (
  user: AuthUser,
  token: string,
  refreshToken: string | null,
) => {
  localStorage.setItem(userKey, JSON.stringify(user));
  localStorage.setItem(tokenKey, token);
  if (refreshToken) {
    localStorage.setItem(refreshTokenKey, refreshToken);
  } else {
    localStorage.removeItem(refreshTokenKey);
  }
};

const tokenExpiryMs = (token: string): number | null => {
  try {
    const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
    const payload = raw.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as { exp?: number };
    if (!decoded.exp) return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useLanguage();
  const lastSessionExpiredToast = useRef(0);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(userKey);
    return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenKey));
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem(refreshTokenKey),
  );

  const applySession = useCallback(
    (
      nextUser: AuthUser,
      nextToken: string,
      nextRefreshToken: string | null,
    ) => {
      let mergedUser = { ...nextUser };
      const storedUserRaw = localStorage.getItem(userKey);
      if (storedUserRaw) {
        try {
          const storedUser = JSON.parse(storedUserRaw) as Partial<AuthUser>;
          if (
            storedUser.email &&
            storedUser.email === mergedUser.email &&
            storedUser.no_telp &&
            !mergedUser.no_telp
          ) {
            mergedUser = { ...mergedUser, no_telp: storedUser.no_telp };
          }
        } catch {
          // Ignore malformed local session data.
        }
      }

      const registerHintRaw = localStorage.getItem(registerHintKey);
      if (registerHintRaw) {
        try {
          const registerHint = JSON.parse(registerHintRaw) as {
            email?: string;
            no_telp?: string;
          };
          if (
            registerHint.email &&
            registerHint.email === mergedUser.email &&
            registerHint.no_telp &&
            !mergedUser.no_telp
          ) {
            mergedUser = { ...mergedUser, no_telp: registerHint.no_telp };
          }
        } catch {
          // Ignore malformed register hint data.
        } finally {
          localStorage.removeItem(registerHintKey);
        }
      }

      saveSession(mergedUser, nextToken, nextRefreshToken);
      setUser(mergedUser);
      setToken(nextToken);
      setRefreshToken(nextRefreshToken);
    },
    [],
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const loginWithPath = async (path: string, fallbackRole: UserRole) => {
      const response = await apiClient.post(path, {
        email: payload.email,
        password: payload.password,
      });
      const {
        data,
        token: responseToken,
        refreshToken: responseRefreshToken,
      } = unwrapToken<Record<string, unknown>>(response.data);
      let nextUser = normalizeUser(data, payload.role ?? fallbackRole);
      if (path === "/user/login") {
        try {
          const meResponse = await apiClient.get("/user/me");
          const mePayload = unwrap<Record<string, unknown>>(meResponse.data);
          nextUser = normalizeUser({ ...mePayload, ...data }, payload.role ?? fallbackRole);
        } catch {
          // Fallback to login payload if /user/me is unavailable.
        }
      }
      if (!responseToken) throw new Error("Login response does not include token");
      applySession(nextUser, responseToken, responseRefreshToken ?? null);
      return nextUser;
    };

    try {
      return await loginWithPath("/user/login", "umkm");
    } catch (userError) {
      if (axios.isAxiosError(userError) && userError.response?.status === 401) {
        return await loginWithPath("/admin/login", "admin");
      }
      throw userError;
    }
  }, [applySession]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const role_id = payload.role === "investor" ? 2 : 1;
    const body = {
      nama: payload.nama,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      nik: payload.nik,
      no_telp: payload.no_telp,
      role_id,
    };

    const response = await apiClient.post("/user/register", body);
    const created = response.data?.data ?? body;
    return normalizeUser({ ...created, role: payload.role, role_id }, payload.role);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    let nextUser: AuthUser | null = null;
    setUser((current) => {
      if (!current) return current;
      nextUser = { ...current, ...updates };
      localStorage.setItem(userKey, JSON.stringify(nextUser));
      return nextUser;
    });
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    const activeRefreshToken = localStorage.getItem(refreshTokenKey);
    const activeRole = user?.role;
    if (activeRefreshToken) {
      const logoutPath =
        activeRole === "admin" || activeRole === "superadmin"
          ? "/admin/logout"
          : "/user/logout";
      void apiClient.post(logoutPath, { refreshToken: activeRefreshToken }).catch(() => undefined);
    }

    localStorage.removeItem(userKey);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  }, [user?.role]);

  useEffect(() => {
    if (!user || !token || !refreshToken) return;

    let cancelled = false;

    const refreshSession = async () => {
      try {
        const isAdmin = user.role === "admin" || user.role === "superadmin";
        const response = await apiClient.post(
          isAdmin ? "/admin/refresh" : "/user/refresh",
          { refreshToken },
        );
        const {
          data,
          token: refreshedToken,
          refreshToken: refreshedRefreshToken,
        } = unwrapToken<Record<string, unknown>>(response.data);
        if (!refreshedToken) throw new Error("Refresh response does not include token");
        if (cancelled) return;
        const nextUser = normalizeUser(data, user.role);
        applySession(nextUser, refreshedToken, refreshedRefreshToken ?? refreshToken);
      } catch {
        if (cancelled) return;
        logout();
      }
    };

    const expiresAt = tokenExpiryMs(token);
    const refreshDelay = expiresAt
      ? Math.max(10_000, expiresAt - Date.now() - 60_000)
      : 8 * 60_000;
    const timeoutId = window.setTimeout(() => {
      void refreshSession();
    }, refreshDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [applySession, logout, refreshToken, token, user]);

  useEffect(() => {
    const authPaths = new Set([
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
    ]);

    const onSessionExpired = () => {
      setUser(null);
      setToken(null);
      setRefreshToken(null);

      const now = Date.now();
      if (now - lastSessionExpiredToast.current > 1_500) {
        toast.warning(t("sessionExpiredMessage"), {
          title: t("sessionExpiredTitle"),
        });
        lastSessionExpiredToast.current = now;
      }

      if (!authPaths.has(location.pathname)) {
        navigate("/login", {
          replace: true,
          state: {
            from: {
              pathname: `${location.pathname}${location.search}`,
            },
          },
        });
      }
    };

    const onSessionRefreshed = (event: Event) => {
      const detail = (event as CustomEvent<{
        user?: Record<string, unknown>;
        token?: string;
        refreshToken?: string | null;
      }>).detail;
      if (!detail?.user || !detail.token) return;
      const fallbackRole = user?.role ?? normalizeRole(detail.user, "umkm");
      applySession(
        normalizeUser(detail.user, fallbackRole),
        detail.token,
        detail.refreshToken ?? localStorage.getItem(refreshTokenKey),
      );
    };

    window.addEventListener(authSessionExpiredEvent, onSessionExpired);
    window.addEventListener(authSessionRefreshedEvent, onSessionRefreshed);

    return () => {
      window.removeEventListener(authSessionExpiredEvent, onSessionExpired);
      window.removeEventListener(authSessionRefreshedEvent, onSessionRefreshed);
    };
  }, [applySession, location.pathname, location.search, navigate, t, toast, user?.role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      refreshToken,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      updateUser,
      logout,
    }),
    [login, logout, refreshToken, register, token, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const dashboardPathFor = (role: UserRole) => {
  if (role === "admin" || role === "superadmin") return "/dashboard/admin";
  if (role === "investor") return "/dashboard/investor";
  return "/dashboard/umkm";
};
