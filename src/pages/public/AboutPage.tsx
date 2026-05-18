import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

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

const capstonePartners = [
  {
    name: "Coding Camp 2026",
    logo: "/partners/coding-camp.png",
  },
  {
    name: "DBS Foundation",
    logo: "/partners/dbs-foundation.png",
  },
  {
    name: "Dicoding",
    logo: "/partners/dicoding.png",
  },
];

export function AboutPage() {
  const { t } = useLanguage();
  const [showThanksPopup, setShowThanksPopup] = useState(false);
  const tapStateRef = useRef<{ count: number; timeoutId?: number }>({ count: 0 });

  useEffect(() => {
    return () => {
      if (tapStateRef.current.timeoutId) {
        window.clearTimeout(tapStateRef.current.timeoutId);
      }
    };
  }, []);

  const handleProfileTap = () => {
    const state = tapStateRef.current;

    if (state.timeoutId) {
      window.clearTimeout(state.timeoutId);
    }

    state.count += 1;

    if (state.count >= 3) {
      state.count = 0;
      state.timeoutId = undefined;
      setShowThanksPopup(true);
      return;
    }

    state.timeoutId = window.setTimeout(() => {
      tapStateRef.current.count = 0;
      tapStateRef.current.timeoutId = undefined;
    }, 900);
  };

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
              {t("aboutHeroTitle")}
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral/65">
              {t("aboutHeroBody")}
            </p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-sm">
            <img
              src="/images/about-new.png"
              alt={t("aboutImageAlt")}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
      <section className="border-y border-base-300 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-[0.7fr_1.3fr] md:items-center lg:px-8">
          <p className="mt-2 text-sm leading-6 text-neutral/60">
            FundRaise dibuat sebagai capstone project Coding Camp 2026 dari DBS Foundation dan Dicoding.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {capstonePartners.map((partner) => (
              <div
                key={partner.name}
                className="flex h-14 items-center justify-center rounded-md bg-white px-2 sm:h-16 sm:px-5"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-8 w-full object-contain sm:max-h-16"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-base-300 bg-base-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black tracking-normal">
              {t("aboutTeamTitle")}
            </h2>
            <p className="mt-5 text-base leading-7 text-neutral/65">
              {t("aboutTeamBody")}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-6">
            {teamMembers.map((member) => (
              <article
                key={member.name}
                className="group cursor-pointer overflow-hidden rounded-md border border-base-300 bg-white shadow-sm"
                onPointerUp={handleProfileTap}
                title="Klik 3x"
              >
                <div className="aspect-square bg-base-300">
                  <img
                    src={member.image}
                    alt={t("aboutMemberAlt", { name: member.name })}
                    className="h-full w-full object-cover grayscale transition duration-300 group-hover:grayscale-0"
                    loading="lazy"
                  />
                </div>
                <div className="min-h-28 p-4">
                  <h3 className="text-base font-black leading-6 text-neutral">
                    {member.name}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {t(member.role)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {showThanksPopup ? (
        <div
          className="fixed inset-0 z-[1200] grid place-items-center bg-black/55 p-4"
          onClick={() => setShowThanksPopup(false)}
        >
          <div
            className="w-full max-w-md rounded-md border border-base-300 bg-white p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overflow-hidden rounded-md border border-base-300 bg-base-200">
              <img
                src="/images/meong.png"
                alt="Meong"
                className="h-72 w-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="mt-4 text-center text-xl font-black tracking-normal">
              Terimakasih
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
              {capstonePartners.map((partner) => (
                <div
                  key={partner.name}
                  className="flex h-14 items-center justify-center rounded-md bg-white px-2 sm:h-16 sm:px-5"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-8 w-full object-contain sm:max-h-16"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary mt-5 w-full rounded-md text-white"
              onClick={() => setShowThanksPopup(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
