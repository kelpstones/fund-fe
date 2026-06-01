import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "../../components/Logo";
import { apiClient } from "../../lib/api/client";
import axios from "axios";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useToast } from "../../components/ToastProvider";

export function ResetPasswordPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [form, setForm] = useState({
    token: tokenFromUrl,
    new_password: "",
    password_confirmation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.new_password !== form.password_confirmation) {
      toast.warning(t("passwordConfirmationMismatch"));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/user/reset-password", {
        token: form.token,
        new_password: form.new_password,
        password_confirmation: form.password_confirmation,
      });
      navigate("/login", { state: { message: t("resetPasswordSuccess") } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.error(t("resetUnavailable"));
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message as string, {
          title: t("resetPasswordError"),
        });
      } else {
        toast.error(t("resetPasswordError"));
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
          <h1 className="text-3xl font-black tracking-normal">{t("resetPasswordTitle")}</h1>
          <p className="mt-2 text-sm text-neutral/60">{t("resetPasswordSubtitle")}</p>
        </div>
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          {!tokenFromUrl ? (
            <label className="form-control" htmlFor="reset-password-token">
              <span className="label-text mb-2 font-semibold">{t("resetToken")}</span>
              <input
                id="reset-password-token"
                className="input input-bordered rounded-md"
                value={form.token}
                onChange={update("token")}
                placeholder={t("tokenFromEmail")}
                required
              />
            </label>
          ) : null}
          <label className="form-control" htmlFor="reset-password-new">
            <span className="label-text mb-2 font-semibold">{t("newPassword")}</span>
            <input
              id="reset-password-new"
              type="password"
              className="input input-bordered rounded-md"
              value={form.new_password}
              onChange={update("new_password")}
              required
            />
          </label>
          <label className="form-control" htmlFor="reset-password-confirm">
            <span className="label-text mb-2 font-semibold">{t("confirmPassword")}</span>
            <input
              id="reset-password-confirm"
              type="password"
              className="input input-bordered rounded-md"
              value={form.password_confirmation}
              onChange={update("password_confirmation")}
              required
            />
          </label>
          <button className="btn btn-primary h-12 rounded-md text-white" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
            {t("resetPasswordButton")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral/60">
          <Link className="inline-flex items-center gap-1 font-bold text-primary" to="/login">
            <ArrowLeft size={14} />
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
