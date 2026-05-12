import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Logo } from "../../components/Logo";
import { apiClient } from "../../lib/api/client";
import axios from "axios";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export function VerifyEmailPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const requestedTokenRef = useRef<string | null>(null);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(token ? "" : "verifyTokenMissing");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendMessageKey, setResendMessageKey] = useState("");

  useEffect(() => {
    if (!token || requestedTokenRef.current === token) {
      return;
    }
    requestedTokenRef.current = token;

    apiClient
      .get(`/user/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
        setMessage("");
        setMessageKey("verifySuccessMessage");
      })
      .catch((err) => {
        setStatus("error");
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setMessage("");
          setMessageKey("verifyUnavailable");
        } else if (axios.isAxiosError(err) && err.response?.data?.message) {
          setMessage(err.response.data.message as string);
          setMessageKey("");
        } else {
          setMessage("");
          setMessageKey("verifyFailedMessage");
        }
      });
  }, [token]);

  const resend = async () => {
    if (!resendEmail) return;
    setIsResending(true);
    setResendMessage("");
    setResendMessageKey("");
    try {
      await apiClient.post("/user/resend-verify", { email: resendEmail });
      setResendMessageKey("verifyResendSuccess");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setResendMessageKey("featureUnavailable");
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setResendMessage(err.response.data.message as string);
      } else {
        setResendMessageKey("verifyResendError");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-md border border-base-300 bg-white p-6 shadow-soft">
        <Logo />
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          {status === "loading" ? (
            <>
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="font-semibold text-neutral/70">{t("verifyLoading")}</p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="text-success" size={40} />
              <h1 className="text-2xl font-black tracking-normal text-success">{t("verifySuccessTitle")}</h1>
              <p className="text-sm text-neutral/60">{messageKey ? t(messageKey) : message}</p>
              <Link className="btn btn-primary mt-2 rounded-md text-white" to="/login">
                {t("loginNow")}
              </Link>
            </>
          ) : (
            <>
              <XCircle className="text-error" size={40} />
              <h1 className="text-2xl font-black tracking-normal text-error">{t("verifyFailedTitle")}</h1>
              <p className="text-sm text-neutral/60">{messageKey ? t(messageKey) : message}</p>

              <div className="mt-4 w-full rounded-md border border-base-300 p-4 text-left">
                <p className="mb-3 text-sm font-semibold">{t("verifyResendLabel")}</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="input input-bordered flex-1 rounded-md text-sm"
                    placeholder={t("yourEmail")}
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                  <button
                    className="btn btn-primary rounded-md text-white"
                    onClick={resend}
                    disabled={isResending || !resendEmail}
                  >
                    {isResending ? <Loader2 className="animate-spin" size={16} /> : t("send")}
                  </button>
                </div>
                {resendMessage || resendMessageKey ? (
                  <p className="mt-2 text-xs font-semibold text-success">
                    {resendMessageKey ? t(resendMessageKey) : resendMessage}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>

        {status !== "loading" ? (
          <p className="mt-6 text-center text-sm text-neutral/60">
            <Link className="font-bold text-primary" to="/login">
              {t("backToLogin")}
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
