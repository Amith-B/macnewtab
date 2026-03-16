export const getBodyZoomScale = (): number => {
  if (typeof window === "undefined" || !document?.body) return 1;
  const zoomValue = (
    window.getComputedStyle(document.body) as CSSStyleDeclaration & {
      zoom?: string;
    }
  ).zoom;
  if (!zoomValue || zoomValue === "normal") return 1;

  if (zoomValue.endsWith("%")) {
    const percent = parseFloat(zoomValue);
    return Number.isFinite(percent) ? percent / 100 : 1;
  }

  const scale = parseFloat(zoomValue);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};
