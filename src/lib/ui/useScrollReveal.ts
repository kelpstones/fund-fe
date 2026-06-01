import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal]";

export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
    );
    if (nodes.length === 0) return;

    const isInViewport = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.98 && rect.bottom > 0;
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    nodes.forEach((node) => {
      const delayMs = Number(node.dataset.revealDelay ?? 0);
      const durationMs = Number(node.dataset.revealDuration ?? 220);
      node.style.transitionDelay = `${Math.max(0, delayMs)}ms`;
      node.style.transitionDuration = `${Math.max(100, durationMs)}ms`;
      const shouldShowImmediately = prefersReducedMotion || isInViewport(node);
      node.setAttribute("data-reveal-state", shouldShowImmediately ? "visible" : "hidden");
    });

    if (prefersReducedMotion) return;

    const hiddenNodes = nodes.filter(
      (node) => node.getAttribute("data-reveal-state") !== "visible",
    );
    if (hiddenNodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.setAttribute("data-reveal-state", "visible");
          observer.unobserve(target);
        });
      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    hiddenNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);
}
