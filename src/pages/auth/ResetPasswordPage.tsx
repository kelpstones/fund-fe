import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "../../components/Logo";
import { apiClient } from "../../lib/api/client";
import axios from "axios";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [form, setForm] = useState({
    token: tokenFromUrl,
    new_password: "",
    password_confirmation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.new_password !== form.password_confirmation) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await apiClient.post("/user/reset-password", {
        token: form.token,
        new_password: form.new_password,
        password_confirmation: form.password_confirmation,
      });
      navigate("/login", { state: { message: "Password berhasil direset. Silakan login." } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Fitur reset password belum tersedia saat ini.");
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message as string);
      } else {
        setError("Gagal mereset password. Token mungkin sudah kadaluarsa.");
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
          <h1 className="text-3xl font-black tracking-normal">Reset Password</h1>
          <p className="mt-2 text-sm text-neutral/60">Masukkan password baru untuk akun kamu.</p>
        </div>
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          {!tokenFromUrl ? (
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Token Reset</span>
              <input
                className="input input-bordered rounded-md"
                value={form.token}
                onChange={update("token")}
                placeholder="Token dari email"
                required
              />
            </label>
          ) : null}
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Password Baru</span>
            <input
              type="password"
              className="input input-bordered rounded-md"
              value={form.new_password}
              onChange={update("new_password")}
              required
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Konfirmasi Password</span>
            <input
              type="password"
              className="input input-bordered rounded-md"
              value={form.password_confirmation}
              onChange={update("password_confirmation")}
              required
            />
          </label>
          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
          <button className="btn btn-primary h-12 rounded-md text-white" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
            Reset Password
          </button>
        </form>
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
