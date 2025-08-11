import { memo, useContext, useEffect, useRef, useState } from "react";
import "./TopSites.css";
import { ReactComponent as LeftArrow } from "../../assets/left-arrow.svg";
import { ReactComponent as RightArrow } from "../../assets/right-arrow.svg";
import EmptySiteImage from "../../assets/empty-site-image.png";
import { AppContext } from "../../context/provider";
import { FAVICON_URL, faviconURL } from "../../utils/favicon";

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
    Array<chrome.topSites.MostVisitedURL>
  >([]);

  const [isOverflowLeft, setIsOverflowLeft] = useState(false);
  const [isOverflowRight, setIsOverflowRight] = useState(true);
  const { separatePageSite } = useContext(AppContext);

  useEffect(() => {
    async function fetchTopSites() {
      try {
        const topVisitedSites = await chrome.topSites.get();
        setTopSites(topVisitedSites);
      } catch (e) {
        console.error(e);
      }
    }

    if (chrome && chrome.topSites) {
      fetchTopSites();
    } else {
      setTopSites(topSitesDefaultList);
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
                src={faviconURL(item.url)}
                onError={({ currentTarget }) => {
                  currentTarget.src = FAVICON_URL + item.url;
                  currentTarget.onerror = () => {
                    currentTarget.src = FALLBACK_SITE_IMAGE;
                    currentTarget.onerror = null;
                  };
                }}
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
