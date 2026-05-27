import type { Entity } from "../../types";
import type { PortfolioOpportunity } from "./portfolioData";

const sectorMap: Record<string, string> = {
  kuliner: "portfolioSectorFoodBeverage",
  fashion: "portfolioSectorFashion",
  pertanian: "portfolioSectorAgribusiness",
};

const defaultImageBySector: Record<string, string> = {
  kuliner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
  fashion: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
  pertanian: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80",
  default: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1400&q=80",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const titleCase = (value: string) =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const slugify = (name: string, id: string | number) =>
  `${name}-${id}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const riskFromClass = (classLabel: string) => {
  const value = classLabel.toLowerCase();
  if (value === "elite") return "Low" as const;
  if (value === "growth") return "Moderate" as const;
  if (value === "struggling" || value === "critical") return "High" as const;
  return "Moderate" as const;
};

const sectorLabel = (tipeUsaha: string) =>
  sectorMap[tipeUsaha] ?? titleCase(tipeUsaha || "Lainnya");

const getCityFromAddress = (address: string) => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || "Indonesia";
};

const getCoverImage = (coversValue: unknown, tipeUsaha: string, index: number) => {
  const covers = Array.isArray(coversValue) ? coversValue.map(asObject) : [];
  const cover = covers[index];
  if (cover && typeof cover.image_url === "string" && cover.image_url.trim()) {
    return cover.image_url;
  }
  return defaultImageBySector[tipeUsaha] ?? defaultImageBySector.default;
};

const readinessFromBusiness = (business: Record<string, unknown>) => {
  const readiness: string[] = [];
  const profile = asObject(business.profile);
  const docs = Array.isArray(business.docs) ? business.docs : [];

  if (docs.length > 0) readiness.push("readinessLegal");
  if (asNumber(profile.repeat_order_rate, 0) >= 40) readiness.push("readinessSales");
  if (asNumber(profile.tim_operasional, 0) > 0) readiness.push("readinessTeam");
  if (asNumber(profile.digital_adoption_score, 0) >= 5) readiness.push("readinessReporting");

  const fallback = ["readinessSales", "readinessTeam", "readinessReporting"];
  while (readiness.length < 3) {
    readiness.push(fallback[readiness.length]);
  }

  return Array.from(new Set(readiness)).slice(0, 3);
};

const fundsTemplate = (tipeUsaha: string): PortfolioOpportunity["funds"] => {
  if (tipeUsaha === "kuliner") {
    return [
      { labelKey: "fundPlanEquipment", percentage: 40 },
      { labelKey: "fundPlanOperations", percentage: 35 },
      { labelKey: "fundPlanMarketing", percentage: 25 },
    ];
  }
  if (tipeUsaha === "fashion") {
    return [
      { labelKey: "fundPlanInventory", percentage: 45 },
      { labelKey: "fundPlanTraining", percentage: 20 },
      { labelKey: "fundPlanMarketing", percentage: 35 },
    ];
  }
  return [
    { labelKey: "fundPlanSupplyChain", percentage: 35 },
    { labelKey: "fundPlanOperations", percentage: 35 },
    { labelKey: "fundPlanTechnology", percentage: 30 },
  ];
};

export const mapPreviewBusinessesToPortfolios = (
  previewBusinesses: unknown,
): PortfolioOpportunity[] => {
  if (!Array.isArray(previewBusinesses)) return [];

  return previewBusinesses
    .map((item) => {
      const business = asObject(item);
      const profile = asObject(business.profile);
      const id = String(business.id ?? "");
      const name = String(business.nama_bisnis ?? business.nama ?? "").trim();
      const tipeUsaha = String(business.tipe_usaha ?? "").trim().toLowerCase();
      const address = String(business.alamat ?? "").trim();

      if (!id || !name) return null;

      const yearRevenue = Math.max(100_000_000, asNumber(profile.year_revenue, 300_000_000));
      const target = Math.round(yearRevenue * 0.35);
      const repeatOrderRate = clamp(asNumber(profile.repeat_order_rate, 55), 15, 90);
      const raised = Math.round(target * (repeatOrderRate / 100));
      const netProfitMargin = clamp(asNumber(profile.net_profit_margin, 14), 8, 35);
      const returnRate = Math.round(clamp(netProfitMargin, 8, 26));
      const score = Math.round(clamp(asNumber(profile.digital_adoption_score, 7) * 10, 50, 98));
      const classLabel = String(
        business.class_label ?? (asObject(business.kelas).nama_kelas ?? ""),
      );

      const image = getCoverImage(business.covers, tipeUsaha, 0);
      const heroImage = getCoverImage(business.covers, tipeUsaha, 1) || image;

      return {
        slug: slugify(name, id),
        name,
        sectorKey: sectorLabel(tipeUsaha),
        city: getCityFromAddress(address),
        raised,
        target,
        score,
        returnRate,
        risk: riskFromClass(classLabel),
        image,
        heroImage,
        funds: fundsTemplate(tipeUsaha),
        readiness: readinessFromBusiness(business),
      } satisfies PortfolioOpportunity;
    })
    .filter((item): item is PortfolioOpportunity => Boolean(item));
};

export const unwrapPreviewList = (value: unknown): Entity[] => {
  if (Array.isArray(value)) return value as Entity[];
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (Array.isArray(objectValue.items)) return objectValue.items as Entity[];
    if (Array.isArray(objectValue.rows)) return objectValue.rows as Entity[];
    if (Array.isArray(objectValue.results)) return objectValue.results as Entity[];
  }
  return [];
};
