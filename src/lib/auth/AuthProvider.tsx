import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import type { AuthUser, LoginPayload, RegisterPayload, UserRole } from "../../types";
import { mockUsers } from "../mockData";
import { apiClient, unwrapToken } from "../api/client";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  updateUser: (updates: Partial<AuthUser>) => AuthUser | null;
  logout: () => void;
};

const userKey = "fundraise_user";
const tokenKey = "fundraise_token";
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

const normalizeUser = (
  rawUser: Record<string, unknown>,
  requestedRole: UserRole,
): AuthUser => ({
  id: (rawUser.id as number | string | undefined) ?? Date.now(),
  nama: String(rawUser.nama || rawUser.name || mockUsers[requestedRole].nama),
  email: String(rawUser.email || mockUsers[requestedRole].email),
  role: normalizeRole(rawUser, requestedRole),
  role_id:
    (rawUser.role_id as number | undefined) ??
    ((rawUser.role && typeof rawUser.role === "object"
      ? (rawUser.role as Record<string, unknown>).id
      : undefined) as number | undefined),
  level: rawUser.level as "admin" | "superadmin" | undefined,
  no_telp: rawUser.no_telp as string | undefined,
});

const saveSession = (user: AuthUser, token: string) => {
  localStorage.setItem(userKey, JSON.stringify(user));
  localStorage.setItem(tokenKey, token);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(userKey);
    return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenKey));

  const login = useCallback(async (payload: LoginPayload) => {
    const loginWithPath = async (path: string, fallbackRole: UserRole) => {
      const response = await apiClient.post(path, {
        email: payload.email,
        password: payload.password,
      });
      const { data, token: responseToken } = unwrapToken<Record<string, unknown>>(response.data);
      const nextUser = normalizeUser(data, payload.role ?? fallbackRole);
      const nextToken = responseToken || `mock-token-${nextUser.role}-${Date.now()}`;
      saveSession(nextUser, nextToken);
      setUser(nextUser);
      setToken(nextToken);
      return nextUser;
    };

    try {
      return await loginWithPath("/user/login", "umkm");
    } catch (userError) {
      if (axios.isAxiosError(userError) && userError.response) {
        return await loginWithPath("/admin/login", "admin");
      }

      const fallbackRole = payload.role ?? "umkm";
      const nextUser = {
        ...mockUsers[fallbackRole],
        email: payload.email || mockUsers[fallbackRole].email,
      };
      const nextToken = `mock-token-${nextUser.role}-${Date.now()}`;
      saveSession(nextUser, nextToken);
      setUser(nextUser);
      setToken(nextToken);
      return nextUser;
    }
  }, []);

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

    try {
      const response = await apiClient.post("/user/register", body);
      const created = response.data?.data ?? body;
      const user = normalizeUser({ ...created, role: payload.role, role_id }, payload.role);
      const token = `registered-${payload.role}-${Date.now()}`;
      saveSession(user, token);
      setUser(user);
      setToken(token);
      return user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) throw error;
      const user = normalizeUser({ ...body, role: payload.role }, payload.role);
      const token = `mock-register-${payload.role}-${Date.now()}`;
      saveSession(user, token);
      setUser(user);
      setToken(token);
      return user;
    }
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
    localStorage.removeItem(userKey);
    localStorage.removeItem(tokenKey);
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      updateUser,
      logout,
    }),
    [login, logout, register, token, updateUser, user],
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
