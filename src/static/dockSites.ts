export const DOCK_SITES_LOCAL_STORAGE_KEY = "dock_sites";

const SITE_IMAGE_URL = "https://www.google.com/s2/favicons?sz=64&domain=";

export const dockBarDefaultSites = [
  {
    title: "YouTube",
    url: "https://www.youtube.com/",
  },
  {
    title: "Instagram",
    url: "https://www.instagram.com/",
  },
  {
    title: "Facebook",
    url: "https://www.facebook.com",
  },
  {
    title: "ChatGPT",
    url: "https://chat.openai.com/",
  },
].map((item) => {
  const siteURL = new URL(item.url);

  return {
    ...item,
    siteImage: SITE_IMAGE_URL + siteURL.hostname,
  };
});
