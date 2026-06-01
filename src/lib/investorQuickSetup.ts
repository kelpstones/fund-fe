export const INVESTOR_QUICK_SETUP_OPEN_EVENT = "fundraise:investor-quick-setup-open";

export const openInvestorQuickSetupPrompt = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INVESTOR_QUICK_SETUP_OPEN_EVENT));
};
