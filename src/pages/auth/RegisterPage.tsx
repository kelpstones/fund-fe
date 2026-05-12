import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Logo } from "../../components/Logo";
import { useAuth } from "../../lib/auth/AuthProvider";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import type { RegisterPayload } from "../../types";

export function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RegisterPayload>({
    nama: "",
    email: "",
    password: "",
    password_confirmation: "",
    nik: "",
    no_telp: "",
    role: "umkm",
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError(t("passwordConfirmationMismatch"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await register(form);
      navigate("/login", {
        replace: true,
        state: { message: t("registerSuccessVerifyEmail") },
      });
    } catch (err) {
      import("axios").then(({ default: axios }) => {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          setError(err.response.data.message as string);
        } else {
          setError(t("registerError"));
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (key: keyof RegisterPayload, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-md border border-base-300 bg-white p-6 shadow-soft">
        <Logo />
        <div className="mt-8">
          <h1 className="text-3xl font-black tracking-normal">{t("registerTitle")}</h1>
          <p className="mt-2 text-sm text-neutral/60">{t("registerSubtitle")}</p>
        </div>
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          <div className="join grid grid-cols-2">
            {[
              ["umkm", t("roleUmkm")],
              ["investor", t("roleInvestor")],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`btn join-item rounded-md ${form.role === value ? "btn-primary text-white" : "btn-outline"}`}
                onClick={() => update("role", value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-4">
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("name")}</span>
              <input
                className="input input-bordered rounded-md"
                value={form.nama}
                onChange={(event) => update("nama", event.target.value)}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("email")}</span>
              <input
                type="email"
                className="input input-bordered rounded-md"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("nik")}</span>
              <input
                className="input input-bordered rounded-md"
                value={form.nik}
                onChange={(event) => update("nik", event.target.value)}
                minLength={16}
                maxLength={16}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("phone")}</span>
              <input
                className="input input-bordered rounded-md"
                value={form.no_telp}
                onChange={(event) => update("no_telp", event.target.value)}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("password")}</span>
              <input
                type="password"
                className="input input-bordered rounded-md"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                minLength={6}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("confirmPassword")}</span>
              <input
                type="password"
                className="input input-bordered rounded-md"
                value={form.password_confirmation}
                onChange={(event) => update("password_confirmation", event.target.value)}
                minLength={6}
                required
              />
            </label>
          </div>
          {error ? (
            <p className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary h-12 rounded-md text-white" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
            {t("registerButton")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral/60">
          {t("hasAccount")}{" "}
          <Link to="/login" className="font-bold text-primary">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
