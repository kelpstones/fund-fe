import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, CheckCircle2, ClipboardList, RefreshCw, Sparkles } from "lucide-react";
import { ResourcePage } from "../../components/ResourcePage";
import { resourceApi } from "../../lib/api/resources";
import { publishedSubmissionConfig } from "../../lib/resourceConfigs";
import { currency, percent, readPath, textValue } from "../../lib/format";
import type { Entity } from "../../types";

type SurveyAnswer = {
  sektor: string;
  targetNominal: number;
  returnMinimum: number;
  risiko: "low" | "moderate" | "high";
  tenor: "short" | "medium" | "long";
  preferensiDigital: number;
};

type MatchResult = Entity & {
  match_score: number;
  match_reason: string;
  risk_level: string;
};

const defaultSurvey: SurveyAnswer = {
  sektor: "kuliner",
  targetNominal: 150000000,
  returnMinimum: 15,
  risiko: "moderate",
  tenor: "medium",
  preferensiDigital: 7,
};

const sectorOptions = [
  { value: "kuliner", label: "Kuliner" },
  { value: "fashion", label: "Fashion" },
  { value: "teknologi", label: "Teknologi" },
  { value: "pendidikan", label: "Pendidikan" },
  { value: "pertanian", label: "Pertanian" },
  { value: "jasa", label: "Jasa" },
  { value: "lainnya", label: "Lainnya" },
];

const mockUmkm: Entity[] = [
  {
    id: "mock-1",
    bisnis: { nama_bisnis: "Kopi Nusa Rasa", kelas: { nama_kelas: "Growth" } },
    tipe_usaha: "kuliner",
    target_pendanaan: 180000000,
    per_anual_return: 17,
    digital_adoption_score: 8,
    risk_level: "moderate",
  },
  {
    id: "mock-2",
    bisnis: { nama_bisnis: "Batik Lestari", kelas: { nama_kelas: "Struggling" } },
    tipe_usaha: "fashion",
    target_pendanaan: 120000000,
    per_anual_return: 15,
    digital_adoption_score: 5,
    risk_level: "high",
  },
  {
    id: "mock-3",
    bisnis: { nama_bisnis: "Tani Segar Lokal", kelas: { nama_kelas: "Elite" } },
    tipe_usaha: "pertanian",
    target_pendanaan: 260000000,
    per_anual_return: 19,
    digital_adoption_score: 7,
    risk_level: "low",
  },
];

const riskWeight: Record<SurveyAnswer["risiko"], Record<string, number>> = {
  low: { low: 28, moderate: 16, high: 4 },
  moderate: { low: 18, moderate: 28, high: 14 },
  high: { low: 8, moderate: 18, high: 28 },
};

const riskValue = (item: Entity) =>
  textValue(readPath(item, ["risk_level", "matched_class", "bisnis.kelas.nama_kelas"]), "moderate").toLowerCase();

const sectorValue = (item: Entity) =>
  textValue(readPath(item, ["tipe_usaha", "bisnis.tipe_usaha", "sektor"]), "").toLowerCase();

const scoreItem = (item: Entity, answer: SurveyAnswer): MatchResult => {
  const sectorScore =
    answer.sektor === "lainnya" || sectorValue(item).includes(answer.sektor) ? 24 : 8;
  const nominal = Number(item.target_pendanaan || readPath(item, ["bisnis.target_pendanaan"], "0"));
  const nominalDistance = Math.abs(nominal - answer.targetNominal) / Math.max(answer.targetNominal, 1);
  const nominalScore = Math.max(4, 22 - Math.round(nominalDistance * 16));
  const returnScore = Number(item.per_anual_return || 0) >= answer.returnMinimum ? 18 : 8;
  const riskScore = riskWeight[answer.risiko][riskValue(item)] ?? 12;
  const digitalScore =
    Math.abs(Number(item.digital_adoption_score || 6) - answer.preferensiDigital) <= 2 ? 8 : 3;
  const total = Math.min(100, sectorScore + nominalScore + returnScore + riskScore + digitalScore);

  return {
    ...item,
    match_score: total,
    risk_level: riskValue(item),
    match_reason: `Cocok karena sektor ${textValue(sectorValue(item), "bisnis")} mendekati preferensi, target ${currency(
      nominal,
    )}, dan return ${percent(item.per_anual_return)}.`,
  };
};

const matchColumns = [
  {
    label: "UMKM",
    render: (item: Entity) => (
      <div>
        <p className="font-black">
          {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama"]))}
        </p>
        <p className="mt-1 text-sm text-neutral/55">
          {textValue(readPath(item, ["bisnis.kelas.nama_kelas", "risk_level"]))}
        </p>
      </div>
    ),
  },
  { label: "Target", render: (item: Entity) => currency(item.target_pendanaan) },
  { label: "Return", render: (item: Entity) => percent(item.per_anual_return) },
  {
    label: "Skor",
    render: (item: Entity) => (
      <span className="badge badge-secondary badge-lg text-white">{percent(item.match_score)}</span>
    ),
  },
  {
    label: "Alasan",
    render: (item: Entity) => <span className="text-sm text-neutral/60">{textValue(item.match_reason)}</span>,
  },
];

const matchConfig = (items: MatchResult[]) => ({
  key: "survey-matches",
  listPath: "/mock-investor-survey",
  fallback: items,
});

export function InvestorSurveyPage() {
  const [form, setForm] = useState<SurveyAnswer>(defaultSurvey);
  const [submitted, setSubmitted] = useState(false);
  const opportunitiesQuery = useQuery({
    queryKey: ["survey-opportunities"],
    queryFn: () => resourceApi.list(publishedSubmissionConfig),
    retry: false,
  });

  const sourceItems = opportunitiesQuery.data && opportunitiesQuery.data.length > 0
    ? opportunitiesQuery.data
    : mockUmkm;

  const matches = useMemo(
    () =>
      sourceItems
        .map((item) => scoreItem(item, form))
        .sort((a, b) => b.match_score - a.match_score),
    [form, sourceItems],
  );

  const update = <K extends keyof SurveyAnswer>(key: K, value: SurveyAnswer[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
              <ClipboardList size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-normal text-neutral">Survey Investor</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral/60">
              Mock survey untuk menangkap preferensi investor sebelum sistem menampilkan UMKM yang paling cocok.
              Flow ini disiapkan agar nanti mudah disambungkan ke backend matchmaking.
            </p>
          </div>
          <div className="rounded-md border border-info/20 bg-info/10 px-4 py-3 text-sm font-semibold text-info">
            Mode mock: memakai data peluang backend jika tersedia, lalu contoh UMKM lokal jika backend masih kosong.
          </div>
        </div>
      </div>

      <form className="rounded-md border border-base-300 bg-white p-6 shadow-sm" onSubmit={submit}>
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Sektor yang paling diminati</span>
            <select
              className="select select-bordered rounded-md"
              value={form.sektor}
              onChange={(event) => update("sektor", event.target.value)}
            >
              {sectorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Nominal investasi ideal</span>
            <input
              className="input input-bordered rounded-md"
              type="number"
              min={10000000}
              step={5000000}
              value={form.targetNominal}
              onChange={(event) => update("targetNominal", Number(event.target.value))}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Minimum return tahunan</span>
            <input
              className="range range-primary"
              type="range"
              min={8}
              max={30}
              value={form.returnMinimum}
              onChange={(event) => update("returnMinimum", Number(event.target.value))}
            />
            <span className="mt-2 text-sm font-bold text-primary">{form.returnMinimum}%</span>
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Toleransi risiko</span>
            <select
              className="select select-bordered rounded-md"
              value={form.risiko}
              onChange={(event) => update("risiko", event.target.value as SurveyAnswer["risiko"])}
            >
              <option value="low">Konservatif</option>
              <option value="moderate">Seimbang</option>
              <option value="high">Agresif</option>
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Horizon investasi</span>
            <select
              className="select select-bordered rounded-md"
              value={form.tenor}
              onChange={(event) => update("tenor", event.target.value as SurveyAnswer["tenor"])}
            >
              <option value="short">Kurang dari 1 tahun</option>
              <option value="medium">1-3 tahun</option>
              <option value="long">Lebih dari 3 tahun</option>
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Preferensi adopsi digital UMKM</span>
            <input
              className="range range-secondary"
              type="range"
              min={1}
              max={10}
              value={form.preferensiDigital}
              onChange={(event) => update("preferensiDigital", Number(event.target.value))}
            />
            <span className="mt-2 text-sm font-bold text-secondary">{form.preferensiDigital}/10</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="btn btn-primary rounded-md text-white">
            <BrainCircuit size={18} />
            Lihat Match
          </button>
          <button
            className="btn btn-outline rounded-md"
            type="button"
            onClick={() => {
              setForm(defaultSurvey);
              setSubmitted(false);
            }}
          >
            <RefreshCw size={18} />
            Reset
          </button>
          {submitted ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 size={18} />
              Survey tersimpan sementara di halaman ini.
            </span>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        {matches.slice(0, 3).map((item, index) => (
          <article key={item.id} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-neutral/40">Match #{index + 1}</p>
                <h3 className="mt-2 text-xl font-black">
                  {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama"]))}
                </h3>
              </div>
              <Sparkles className="text-secondary" size={22} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-neutral/55">Skor kecocokan</p>
                <p className="text-3xl font-black text-secondary">{percent(item.match_score)}</p>
              </div>
              <span className="badge badge-outline">{textValue(item.risk_level)}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral/60">{item.match_reason}</p>
          </article>
        ))}
      </div>

      {submitted ? (
        <ResourcePage
          title="Hasil Matching Survey"
          description="Ranking UMKM berdasarkan jawaban survey investor. Data ini masih mock dan siap disambungkan ke endpoint backend matchmaking."
          config={matchConfig(matches)}
          columns={matchColumns}
          readonly
          staticData={matches}
          emptyTitle="Belum ada hasil matching"
          emptyDescription="Isi survey terlebih dahulu untuk melihat rekomendasi UMKM."
          searchableFields={["match_reason", "risk_level", (item) => readPath(item, ["bisnis.nama_bisnis", "bisnis.nama"])]}
        />
      ) : null}
    </section>
  );
}
