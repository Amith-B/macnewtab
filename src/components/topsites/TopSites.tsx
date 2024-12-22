import React, { memo, useContext, useEffect, useRef, useState } from "react";
import "./TopSites.css";
import { ReactComponent as LeftArrow } from "./left-arrow.svg";
import { ReactComponent as RightArrow } from "./right-arrow.svg";
import EmptySiteImage from "./empty-site-image.png";
import { AppContext } from "../../context/provider";

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

  const [isOverflowLeft, setIsOverflowLeft] = useState(false);
  const [isOverflowRight, setIsOverflowRight] = useState(true);
  const { separatePageSite } = useContext(AppContext);

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

  useEffect(() => {
    checkOverflow();
  }, [topSites]);

  const containerRef = useRef(null);

  const checkOverflow = () => {
    const container = containerRef.current as unknown as HTMLDivElement;
    if (!container) return;
    setIsOverflowLeft(container.scrollLeft > 0);
    setIsOverflowRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  };

  const scroll = (direction: number) => {
    const container = containerRef.current as unknown as HTMLDivElement;
    if (!container) return;
    container.scrollLeft += direction * 100;
  };

  return (
    <div className="top-sites__container-wrapper">
      <button
        className="top-site__arrow arrow-left"
        onClick={() => scroll(-1)}
        disabled={!isOverflowLeft}
      >
        <LeftArrow />
      </button>
      {!!topSites.length && (
        <div
          className="top-sites__container"
          ref={containerRef}
          onScroll={checkOverflow}
        >
          {topSites.map((item, idx) => (
            <a
              rel="noreferrer"
              className="top-site__item"
              href={item.url}
              target={separatePageSite ? "_blank" : "_self"}
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
      )}
      <button
        className="top-site__arrow arrow-right"
        onClick={() => scroll(1)}
        disabled={!isOverflowRight}
      >
        <RightArrow />
      </button>
    </div>
  );
});

export default TopSites;
