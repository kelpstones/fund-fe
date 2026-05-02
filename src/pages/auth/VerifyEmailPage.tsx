import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Logo } from "../../components/Logo";
import { apiClient } from "../../lib/api/client";
import axios from "axios";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan di URL.");
      return;
    }

    apiClient
      .get(`/user/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
        setMessage("Email berhasil diverifikasi! Kamu sudah bisa login.");
      })
      .catch((err) => {
        setStatus("error");
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setMessage("Fitur verifikasi email belum tersedia saat ini.");
        } else if (axios.isAxiosError(err) && err.response?.data?.message) {
          setMessage(err.response.data.message as string);
        } else {
          setMessage("Verifikasi gagal. Token mungkin sudah kadaluarsa atau tidak valid.");
        }
      });
  }, [token]);

  const resend = async () => {
    if (!resendEmail) return;
    setIsResending(true);
    setResendMessage("");
    try {
      await apiClient.post("/user/resend-verify", { email: resendEmail });
      setResendMessage("Email verifikasi baru telah dikirim. Periksa inbox kamu.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setResendMessage("Fitur ini belum tersedia saat ini.");
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setResendMessage(err.response.data.message as string);
      } else {
        setResendMessage("Gagal mengirim ulang. Coba beberapa saat lagi.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-base-300 bg-white p-6 shadow-soft">
        <Logo />
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          {status === "loading" ? (
            <>
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="font-semibold text-neutral/70">Memverifikasi email kamu...</p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="text-success" size={40} />
              <h1 className="text-2xl font-black tracking-normal text-success">Email Terverifikasi</h1>
              <p className="text-sm text-neutral/60">{message}</p>
              <Link className="btn btn-primary mt-2 rounded-md text-white" to="/login">
                Masuk Sekarang
              </Link>
            </>
          ) : (
            <>
              <XCircle className="text-error" size={40} />
              <h1 className="text-2xl font-black tracking-normal text-error">Verifikasi Gagal</h1>
              <p className="text-sm text-neutral/60">{message}</p>

              <div className="mt-4 w-full rounded-md border border-base-300 p-4 text-left">
                <p className="mb-3 text-sm font-semibold">Kirim ulang email verifikasi:</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="input input-bordered flex-1 rounded-md text-sm"
                    placeholder="Email kamu"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                  <button
                    className="btn btn-primary rounded-md text-white"
                    onClick={resend}
                    disabled={isResending || !resendEmail}
                  >
                    {isResending ? <Loader2 className="animate-spin" size={16} /> : "Kirim"}
                  </button>
                </div>
                {resendMessage ? (
                  <p className="mt-2 text-xs font-semibold text-success">{resendMessage}</p>
                ) : null}
              </div>
            </>
          )}
        </div>

        {status !== "loading" ? (
          <p className="mt-6 text-center text-sm text-neutral/60">
            <Link className="font-bold text-primary" to="/login">
              Kembali ke Login
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
