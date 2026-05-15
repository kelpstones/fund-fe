import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";
import { Logo } from "../components/Logo";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-base-200 px-4 py-16 text-center">
      <Logo />

      <div className="mt-12 w-full max-w-md">
        {/* ilustrasi placeholder */}
        <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-full border-2 border-dashed border-base-300 bg-white">
          <span className="text-8xl font-black text-base-300 select-none">404</span>
        </div>

        <h1 className="mt-10 text-3xl font-black tracking-normal text-neutral">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral/60">
          URL yang kamu akses tidak tersedia atau sudah dipindahkan. Coba kembali ke beranda atau hubungi tim kami.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/" className="btn btn-primary h-12 rounded-md px-7 text-white">
            <Home size={18} /> Kembali ke Beranda
          </Link>
          <button
            className="btn btn-outline h-12 rounded-md px-7"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} /> Halaman Sebelumnya
          </button>
        </div>

        <div className="mt-6">
          <Link to="/bantuan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <HelpCircle size={15} /> Butuh bantuan?
          </Link>
        </div>
      </div>
    </main>
  );
}
