import { Mail, MapPin, Phone } from "lucide-react";

export function ContactPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
            Hubungkan tim, UMKM, dan investor
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral/65">
            FundRaise disiapkan sebagai platform MVP yang dapat berkembang
            mengikuti kebutuhan operasional pendanaan.
          </p>
          <div className="mt-8 aspect-[4/3] overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-sm">
            <img
              src="/images/contact.png"
              alt="Tim FundRaise"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-10 grid gap-4">
            {[
              [Mail, "hello@fundraise.id"],
              [Phone, "+62 21 5566 7788"],
              [MapPin, "Jakarta, Indonesia"],
            ].map(([Icon, value]) => (
              <div key={String(value)} className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
                <span className="font-semibold">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
        <form className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Nama</span>
              <input className="input input-bordered rounded-md" />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Email</span>
              <input type="email" className="input input-bordered rounded-md" />
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-2 font-semibold">Subjek</span>
              <input className="input input-bordered rounded-md" />
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-2 font-semibold">Pesan</span>
              <textarea className="textarea textarea-bordered min-h-40 rounded-md" />
            </label>
          </div>
          <button className="btn btn-primary mt-6 rounded-md text-white">Kirim Pesan</button>
        </form>
      </section>
    </main>
  );
}
