import { BrainCircuit, Building2, ShieldCheck, Users } from "lucide-react";

const values = [
  {
    title: "Konteks bisnis dibaca utuh",
    body: "Profil UMKM tidak hanya dilihat dari nominal pendanaan, tapi juga performa, kelas bisnis, dan sinyal risiko.",
    icon: Building2,
  },
  {
    title: "Preferensi investor dihormati",
    body: "Investor dapat memprioritaskan sektor, target return, nominal, dan toleransi risiko yang masuk akal.",
    icon: Users,
  },
  {
    title: "Rekomendasi berbasis skor",
    body: "Matchmaking menampilkan skor kecocokan agar keputusan investasi lebih transparan.",
    icon: BrainCircuit,
  },
  {
    title: "Proses terkontrol admin",
    body: "Admin menjaga kualitas data bisnis, approval pengajuan, invoice, investasi, dan profit sharing.",
    icon: ShieldCheck,
  },
];

const teamMembers = [
  {
    name: "M. Danendra Prawiraamijoyo",
    role: "Full-Stack Web Developer",
    image: "/team/muhamad-danendra-prawiraamijoyo.png",
  },
  {
    name: "Azra Hudaya",
    role: "Full-Stack Web Developer",
    image: "/team/azra-hudaya.png",
  },
  {
    name: "Adam Kevin",
    role: "Data Scientist",
    image: "/team/adam-kevin.png",
  },
  {
    name: "Andika Ardiansyah",
    role: "Data Scientist",
    image: "/team/andika-ardiansyah.png",
  },
  {
    name: "Aldi Kurnia Fadillah",
    role: "AI Engineer",
    image: "/team/aldi-kurnia-fadillah.png",
  },
  {
    name: "Yazid Hilmi Allamsyah",
    role: "AI Engineer",
    image: "/team/yazid-hilmi-allamsyah.png",
  },
];

export function AboutPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
              Infrastruktur pendanaan untuk UMKM dan investor modern
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral/65">
              FundRaise dibuat untuk mempertemukan pemilik usaha dan investor
              melalui data bisnis, preferensi investasi, negosiasi yang jelas,
              dan monitoring investasi yang rapi.
            </p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-sm">
            <img
              src="/images/about-new.png"
              alt="Ekosistem FundRaise"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
      <section className="border-y border-base-300 bg-base-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black tracking-normal">
              Capstone Project Tim Kelpstone
            </h2>
            <p className="mt-5 text-base leading-7 text-neutral/65">
              FundRaise adalah capstone project dari tim Kelpstone. Proyek ini
              dikembangkan untuk Coding Camp 2026 powered by DBS Foundation.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-6">
            {teamMembers.map((member) => (
              <article
                key={member.name}
                className="group overflow-hidden rounded-md border border-base-300 bg-white shadow-sm"
              >
                <div className="aspect-square bg-base-300">
                  <img
                    src={member.image}
                    alt={`Foto ${member.name}`}
                    className="h-full w-full object-cover grayscale transition duration-300 group-hover:grayscale-0"
                    loading="lazy"
                  />
                </div>
                <div className="min-h-28 p-4">
                  <h3 className="text-base font-black leading-6 text-neutral">
                    {member.name}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {member.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-base-300 bg-base-200">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-md bg-white p-6 shadow-sm"
              >
                <Icon className="text-primary" size={24} />
                <h2 className="mt-5 font-black">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral/60">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
