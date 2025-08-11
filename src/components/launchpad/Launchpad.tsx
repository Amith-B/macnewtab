import { ChangeEvent, useContext, useEffect, useMemo, useState } from "react";
import { launchpadList } from "../../static/launchpad";
import "./Launchpad.css";
import { AppContext } from "../../context/provider";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";

function filterBookmarksTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  searchTerm: string
): chrome.bookmarks.BookmarkTreeNode[] {
  const lowerSearch = searchTerm.toLowerCase();

  function filterNode(
    node: chrome.bookmarks.BookmarkTreeNode
  ): chrome.bookmarks.BookmarkTreeNode | null {
    const matches =
      (node.title && node.title.toLowerCase().includes(lowerSearch)) ||
      (node.url && node.url.toLowerCase().includes(lowerSearch));

    let filteredChildren: chrome.bookmarks.BookmarkTreeNode[] = [];
    if (node.children && node.children.length > 0) {
      filteredChildren = node.children
        .map(filterNode)
        .filter(
          (child): child is chrome.bookmarks.BookmarkTreeNode => child !== null
        );
    }

    if (matches || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }

    return null;
  }

  return nodes
    .map(filterNode)
    .filter((node): node is chrome.bookmarks.BookmarkTreeNode => node !== null);
}

export default function Launchpad({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [modalAccessible, setModalAccessible] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDebouncedValue, setSearchDebouncedValue] = useState("");
  const [selectedTab, setSelectedTab] = useState<"google_apps" | "bookmarks">(
    "google_apps"
  );
  const { bookmarksVisible, locale } = useContext(AppContext);
  const [bookmarksTree, setBookmarksTree] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);

  useEffect(() => {
    if (bookmarksVisible && visible) {
      chrome.bookmarks.getTree().then((tree) => {
        const rootTree = tree[0].children || [];
        if (rootTree.length) {
          setBookmarksTree(rootTree);
          setSelectedTab("bookmarks");
        }
      });
    } else {
      const timeoutRef = setTimeout(() => {
        setBookmarksTree([]);
        setSelectedTab("google_apps");
      }, 500);

      return () => clearTimeout(timeoutRef);
    }
  }, [bookmarksVisible, visible]);

  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      setSearchDebouncedValue(search);
    }, 200);

    return () => clearTimeout(timeoutRef);
  }, [search]);

  const filteredLaunchpadList = useMemo(() => {
    const searchStr = searchDebouncedValue.trim().toLowerCase();

    if (searchStr === "") {
      return launchpadList;
    }
    return launchpadList.filter(
      (item) =>
        item.label.toLowerCase().includes(searchStr) ||
        item.href.toLowerCase().includes(searchStr)
    );
  }, [searchDebouncedValue]);

  const filteredBookmarksTree = useMemo(() => {
    const searchStr = searchDebouncedValue.trim();

    if (searchStr === "") {
      return bookmarksTree;
    }
    return filterBookmarksTree(bookmarksTree, searchStr);
  }, [bookmarksTree, searchDebouncedValue]);

  // this is to prevent keyboard accessibility when modal is closed
  useEffect(() => {
    if (visible) {
      setModalAccessible(true);
    } else {
      const timerRef = setTimeout(() => {
        setModalAccessible(false);
      }, 600);

      return () => clearTimeout(timerRef);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [visible, onClose]);

  const handleTabSelect =
    (tabId: "google_apps" | "bookmarks") =>
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      setSelectedTab(tabId);
    };

  const handleSearch = (evt: ChangeEvent<HTMLInputElement>) => {
    setSearch(evt.target.value);
  };

  return (
    <div
      className={
        "launchpad__overlay" +
        (visible ? " visible" : "") +
        (modalAccessible ? " modal-accessible" : " modal-inaccessible")
      }
      onClick={onClose}
    >
      {!!bookmarksTree.length && (
        <div className="launchpad__tab">
          <button
            className={
              "launchpad__tab__button" +
              (selectedTab === "google_apps" ? " selected" : "")
            }
            onClick={handleTabSelect("google_apps")}
          >
            <Translation value="google_apps" />
          </button>
          <button
            className={
              "launchpad__tab__button" +
              (selectedTab === "bookmarks" ? " selected" : "")
            }
            onClick={handleTabSelect("bookmarks")}
          >
            <Translation value="bookmarks" />
          </button>
        </div>
      )}
      <div className="launchpad__search-container">
        <input
          id="search-launchpad"
          name="Search launchpad"
          value={search}
          placeholder={translation[locale]["search"]}
          onChange={handleSearch}
          onClick={(evt) => evt.stopPropagation()}
        />
      </div>
      {selectedTab === "google_apps" && (
        <div className="launchpad__container">
          {filteredLaunchpadList.map((item, idx) => (
            <a
              href={item.href}
              className="launchpad-item"
              key={idx}
              title={item.label}
            >
              <div className="launchpad-item__logo">{<item.icon />}</div>
              <span className="launchpad-item__label">{item.label}</span>
            </a>
          ))}
        </div>
      )}

      {selectedTab === "bookmarks" && (
        <div className="launchpad__bookmarks__container">
          {filteredBookmarksTree.map((item) => (
            <BookmarkGroup data={item} />
          ))}
        </div>
      )}
    </div>
  );
}

const SITE_IMAGE_URL = "https://www.google.com/s2/favicons?sz=64&domain=";

function BookmarkGroup({ data }: { data: chrome.bookmarks.BookmarkTreeNode }) {
  if (data?.children?.length) {
    return (
      <fieldset className="bookmark-group">
        <legend className="bookmark-group-title">{data.title}</legend>
        {data.children.map((item) => (
          <BookmarkGroup data={item} />
        ))}
      </fieldset>
    );
  }

  if (!data.url) {
    return null;
  }

  return (
    <a
      href={data.url}
      className="bookmark-item"
      key={data.id}
      title={data.title}
    >
      <img
        className="bookmark-item__icon"
        src={SITE_IMAGE_URL + data.url}
        alt={data.title}
      />
      <span className="bookmark-item__label">{data.title}</span>
    </a>
  );
}
