import React, { memo, useEffect, useState } from "react";
import "./TopSites.css";
import EmptySiteImage from "./empty-site-image.png";

const SITE_IMAGE_URL = "https://www.google.com/s2/favicons?sz=64&domain=";
const FALLBACK_SITE_IMAGE = EmptySiteImage;

const topSitesDefaultList = [
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
];

const TopSites = memo(function TopSites() {
  const [topSites, setTopSites] = useState<
    Array<chrome.topSites.MostVisitedURL & { siteImage: string }>
  >([]);

  const replaceLowResImages = (
    topVisitedSites: chrome.topSites.MostVisitedURL[]
  ) => {
    topVisitedSites.forEach((item, idx) => {
      const siteURL = new URL(item.url);
      const img = new Image();
      img.src = SITE_IMAGE_URL + siteURL.hostname;
      img.onload = () => {
        if (img.width < 18 || img.height < 18) {
          setTopSites((prevState) => {
            const updatedList = [...prevState];
            updatedList[idx] = {
              ...updatedList[idx],
              siteImage: FALLBACK_SITE_IMAGE,
            };

            return updatedList;
          });
        }
      };
    });
  };

  useEffect(() => {
    async function fetchTopSites() {
      try {
        const topVisitedSites = await chrome.topSites.get();
        setTopSites(
          topVisitedSites.map((item) => {
            const siteURL = new URL(item.url);

            return {
              ...item,
              siteImage: SITE_IMAGE_URL + siteURL.hostname,
            };
          })
        );

        replaceLowResImages(topVisitedSites);
      } catch (e) {
        console.error(e);
      }
    }

    if (chrome && chrome.topSites) {
      fetchTopSites();
    } else {
      setTopSites(
        topSitesDefaultList.map((item) => {
          const siteURL = new URL(item.url);

          return {
            ...item,
            siteImage: SITE_IMAGE_URL + siteURL.hostname,
          };
        })
      );

      replaceLowResImages(topSitesDefaultList);
    }
  }, []);

  return !!topSites.length ? (
    <div className="top-sites__container">
      {topSites.map((item, idx) => (
        <a
          className="top-site__item"
          href={item.url}
          target="_blank"
          title={item.title}
          key={idx}
        >
          <img
            className="top-site__icon"
            src={item.siteImage}
            alt={item.title}
          />
          <span className="top-site__title">{item.title}</span>
        </a>
      ))}
    </div>
  ) : (
    <></>
  );
});

export default TopSites;
