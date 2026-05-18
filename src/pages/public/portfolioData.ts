export type FundingSplit = {
  labelKey: string;
  percentage: number;
};

export type PortfolioOpportunity = {
  slug: string;
  name: string;
  sectorKey: string;
  city: string;
  raised: number;
  target: number;
  score: number;
  returnRate: number;
  risk: "Low" | "Moderate" | "High";
  image: string;
  heroImage: string;
  funds: FundingSplit[];
  readiness: string[];
};

export const portfolios: PortfolioOpportunity[] = [
  {
    slug: "kopi-nusa-rasa",
    name: "Kopi Nusa Rasa",
    sectorKey: "portfolioSectorFoodBeverage",
    city: "Bandung",
    raised: 164000000,
    target: 250000000,
    score: 92,
    returnRate: 18,
    risk: "Moderate",
    image: "https://unsplash.com/photos/8jlQWO01vGU/download?force=true&w=1200",
    heroImage: "https://unsplash.com/photos/8jlQWO01vGU/download?force=true&w=1800",
    funds: [
      { labelKey: "fundPlanEquipment", percentage: 45 },
      { labelKey: "fundPlanOperations", percentage: 30 },
      { labelKey: "fundPlanMarketing", percentage: 25 },
    ],
    readiness: [
      "readinessSales",
      "readinessTeam",
      "readinessReporting",
    ],
  },
  {
    slug: "batik-lestari",
    name: "Batik Lestari",
    sectorKey: "portfolioSectorFashion",
    city: "Solo",
    raised: 48000000,
    target: 120000000,
    score: 81,
    returnRate: 15,
    risk: "High",
    image: "https://unsplash.com/photos/XOvNsILkVCo/download?force=true&w=1200",
    heroImage: "https://unsplash.com/photos/XOvNsILkVCo/download?force=true&w=1800",
    funds: [
      { labelKey: "fundPlanInventory", percentage: 40 },
      { labelKey: "fundPlanTraining", percentage: 30 },
      { labelKey: "fundPlanMarketing", percentage: 30 },
    ],
    readiness: [
      "readinessLegal",
      "readinessSales",
      "readinessReporting",
    ],
  },
  {
    slug: "tanihub-lokal",
    name: "TaniHub Lokal",
    sectorKey: "portfolioSectorAgribusiness",
    city: "Malang",
    raised: 310000000,
    target: 400000000,
    score: 88,
    returnRate: 21,
    risk: "Low",
    image: "https://unsplash.com/photos/9zMPGHBiFxg/download?force=true&w=1200",
    heroImage: "https://unsplash.com/photos/9zMPGHBiFxg/download?force=true&w=1800",
    funds: [
      { labelKey: "fundPlanSupplyChain", percentage: 50 },
      { labelKey: "fundPlanOperations", percentage: 30 },
      { labelKey: "fundPlanTechnology", percentage: 20 },
    ],
    readiness: [
      "readinessSales",
      "readinessTeam",
      "readinessLegal",
    ],
  },
];

export const riskOptions = ["Low", "Moderate", "High"] as const;
export const riskLabelKey = (risk: string) => `risk${risk}`;
