import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

export function ContactPage() {
  const { t } = useLanguage();
  const [isSent, setIsSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSent(true);
    event.currentTarget.reset();
  };

  return (
    <main className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
            {t("contactHeroTitle")}
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral/65">
            {t("contactHeroBody")}
          </p>
          <div className="mt-8 aspect-[4/3] overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-sm">
            <img
              src="/images/contact.png"
              alt={t("contactImageAlt")}
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
        <form className="rounded-md border border-base-300 bg-white p-6 shadow-sm" onSubmit={submit}>
          {isSent ? (
            <div className="mb-5 flex gap-3 rounded-md border border-success/20 bg-success/10 p-4 text-success">
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-black">{t("contactFormSuccessTitle")}</p>
                <p className="mt-1 text-sm font-semibold opacity-80">{t("contactFormSuccessBody")}</p>
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("name")}</span>
              <input className="input input-bordered rounded-md" required />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("email")}</span>
              <input type="email" className="input input-bordered rounded-md" required />
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-2 font-semibold">{t("subject")}</span>
              <input className="input input-bordered rounded-md" required />
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-2 font-semibold">{t("message")}</span>
              <textarea className="textarea textarea-bordered min-h-40 rounded-md" required />
            </label>
          </div>
          <button className="btn btn-primary mt-6 rounded-md text-white">{t("sendMessage")}</button>
          <div className="mt-8 overflow-hidden rounded-md border border-base-300 bg-base-200">
            <div className="grid min-h-56 place-items-center p-6 text-center">
              <MapPin className="text-primary" size={32} />
              <h2 className="mt-4 text-xl font-black">{t("contactMapTitle")}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral/60">{t("contactMapBody")}</p>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
