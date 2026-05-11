import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "../../components/Logo";
import { apiClient } from "../../lib/api/client";
import axios from "axios";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await apiClient.post("/user/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Fitur reset password belum tersedia saat ini.");
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message as string);
      } else {
        setError("Gagal mengirim email. Periksa alamat email dan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-base-300 bg-white p-6 shadow-soft">
        <Logo />
        <div className="mt-8">
          <h1 className="text-3xl font-black tracking-normal">Lupa Password</h1>
          <p className="mt-2 text-sm text-neutral/60">
            Masukkan email terdaftar. Kami akan mengirimkan link reset password.
          </p>
        </div>

        {success ? (
          <div className="mt-8 rounded-md border border-success/20 bg-success/10 px-4 py-4 text-sm font-semibold text-success">
            Link reset password telah dikirim ke <strong>{email}</strong>. Periksa inbox atau folder spam kamu.
          </div>
        ) : (
          <form className="mt-8 grid gap-4" onSubmit={submit}>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Email</span>
              <input
                type="email"
                className="input input-bordered rounded-md"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                required
              />
            </label>
            {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
            <button className="btn btn-primary h-12 rounded-md text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
              Kirim Link Reset
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral/60">
          <Link className="inline-flex items-center gap-1 font-bold text-primary" to="/login">
            <ArrowLeft size={14} />
            Kembali ke Login
          </Link>
        </p>
      </div>
    </main>
  );
}
