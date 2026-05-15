import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "../../components/Logo";
import { apiClient } from "../../lib/api/client";
import axios from "axios";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useToast } from "../../components/ToastProvider";

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/user/forgot-password", { email });
      setSuccess(true);
      toast.success(
        `${t("forgotPasswordSuccessPrefix")} ${email}. ${t("forgotPasswordSuccessSuffix")}`,
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.error(t("resetUnavailable"));
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message as string, {
          title: t("forgotPasswordError"),
        });
      } else {
        toast.error(t("forgotPasswordError"));
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
          <h1 className="text-3xl font-black tracking-normal">{t("forgotPasswordTitle")}</h1>
          <p className="mt-2 text-sm text-neutral/60">
            {t("forgotPasswordSubtitle")}
          </p>
        </div>

        {success ? (
          <div className="mt-8 rounded-md border border-success/20 bg-success/10 px-4 py-4 text-sm font-semibold text-success">
            {t("forgotPasswordSuccessPrefix")} <strong>{email}</strong>. {t("forgotPasswordSuccessSuffix")}
          </div>
        ) : (
          <form className="mt-8 grid gap-4" onSubmit={submit}>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("email")}</span>
              <input
                type="email"
                className="input input-bordered rounded-md"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                required
              />
            </label>
            <button className="btn btn-primary h-12 rounded-md text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
              {t("sendResetLink")}
            </button>
          </form>
        )}

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
