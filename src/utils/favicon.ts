export const FAVICON_URL = "https://www.google.com/s2/favicons?sz=64&domain=";

export function faviconURL(url: string, size = "32") {
  if (!chrome.runtime || !chrome.runtime.getURL) {
    return FAVICON_URL + url;
  }
  const faviconUrl = new URL(chrome.runtime.getURL("/_favicon/"));
  faviconUrl.searchParams.set("pageUrl", url);
  faviconUrl.searchParams.set("size", size);
  return faviconUrl.toString();
}
