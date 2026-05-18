import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { dashboardPathFor, useAuth } from "../../lib/auth/AuthProvider";
import { Logo } from "../../components/Logo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useToast } from "../../components/ToastProvider";

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = (location.state as { message?: string } | null)?.message ?? "";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      const blockedAuthPaths = new Set([
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ]);
      const targetPath = from && !blockedAuthPaths.has(from) ? from : dashboardPathFor(user.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(String(err.response.data.message), { title: t("loginError") });
      } else {
        toast.error(t("loginError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-md border border-base-300 bg-white p-6 shadow-soft">
        <Logo />
        <div className="mt-8">
          <h1 className="text-3xl font-black tracking-normal">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-neutral/60">{t("loginSubtitle")}</p>
        </div>
        {successMessage ? (
          <div className="mt-6 rounded-md border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
            {successMessage}
          </div>
        ) : null}
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("email")}</span>
            <input
              type="email"
              className="input input-bordered rounded-md"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("password")}</span>
            <input
              type="password"
              className="input input-bordered rounded-md"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <div className="flex justify-end">
            <Link className="text-sm font-semibold text-primary" to="/forgot-password">
              {t("forgotPasswordLink")}
            </Link>
          </div>
          <button className="btn btn-primary h-12 rounded-md text-white" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
            {t("loginButton")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral/60">
          {t("noAccount")}{" "}
          <Link className="font-bold text-primary" to="/register">
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
