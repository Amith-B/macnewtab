import { ChangeEvent, useContext, useEffect, useMemo, useState } from "react";
import { launchpadList } from "../../static/launchpad";
import "./Launchpad.css";
import { AppContext } from "../../context/provider";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";
import { FAVICON_URL, faviconURL } from "../../utils/favicon";
import EmptySiteImage from "../../assets/empty-site-image.png";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import ConfirmDialog from "../confirm/ConfirmDialog";
import { DockIcon } from "../dock/DockIcon";
import { useLocalStorage } from "../../utils/localStorage";

const FALLBACK_SITE_IMAGE = EmptySiteImage;

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
  const [selectedTab, setSelectedTab] = useLocalStorage<
    "google_apps" | "bookmarks" | "my_apps"
  >("launchpad_selected_tab", "google_apps");
  const { bookmarksVisible, locale, separatePageSite, customLaunchpadLinks } = useContext(AppContext);
  const [bookmarksTree, setBookmarksTree] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([]);
  const [bookmarkIdToBeDeleted, setBookmarkIdToBeDeleted] = useState("");
  const [bookmarkToBeEdited, setBookmarkToBeEdited] = useState<chrome.bookmarks.BookmarkTreeNode | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (bookmarksVisible && visible) {
      refreshBookmark();
    } else {
      const timeoutRef = setTimeout(() => {
        setBookmarksTree([]);
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

  const filteredCustomLinks = useMemo(() => {
    const searchStr = searchDebouncedValue.trim().toLowerCase();
    if (searchStr === "") return customLaunchpadLinks;
    return (customLaunchpadLinks || []).filter(
      (item: any) =>
        item.title.toLowerCase().includes(searchStr) ||
        item.url.toLowerCase().includes(searchStr)
    );
  }, [searchDebouncedValue, customLaunchpadLinks]);

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
    (tabId: "google_apps" | "bookmarks" | "my_apps") =>
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      setSelectedTab(tabId);
    };

  const handleSearch = (evt: ChangeEvent<HTMLInputElement>) => {
    setSearch(evt.target.value);
  };

  const handleBookmarkRemove = (bookmarkId: string) => {
    setBookmarkIdToBeDeleted(bookmarkId);
  };

  const refreshBookmark = () => {
    if (chrome?.bookmarks?.getTree) {
      chrome.bookmarks.getTree().then((tree) => {
        const rootTree = tree[0].children || [];
        if (rootTree.length) {
          setBookmarksTree(rootTree);
        }
      });
    }
  };

  const handleConfirmDelete = () => {
    if (chrome?.bookmarks?.remove) {
      chrome.bookmarks.remove(bookmarkIdToBeDeleted).then(() => {
        refreshBookmark();
        setBookmarkIdToBeDeleted("");
      });
    }
  };

  const handleBookmarkEdit = (bookmark: chrome.bookmarks.BookmarkTreeNode) => {
    setBookmarkToBeEdited(bookmark);
    setEditName(bookmark.title || "");
    setEditUrl(bookmark.url || "");
    setEditError("");
  };

  const handleConfirmEdit = () => {
    setEditError("");
    if (chrome?.bookmarks?.update && bookmarkToBeEdited) {
      chrome.bookmarks.update(bookmarkToBeEdited.id, { title: editName, url: editUrl })
        .then(() => {
          refreshBookmark();
          setBookmarkToBeEdited(null);
        })
        .catch((error) => {
          setEditError(error?.message || "Failed to update bookmark.");
        });
    }
  };

  const activeTab = useMemo(() => {
    const hasBookmarks = !!bookmarksTree.length;
    const hasCustomLinks = !!customLaunchpadLinks?.length;
    if (selectedTab === "bookmarks" && !hasBookmarks) return "google_apps";
    if (selectedTab === "my_apps" && !hasCustomLinks) return "google_apps";
    if (selectedTab !== "google_apps" && selectedTab !== "bookmarks" && selectedTab !== "my_apps") return "google_apps";
    return selectedTab;
  }, [selectedTab, bookmarksTree.length, customLaunchpadLinks?.length]);

  return (
    <div
      className={
        "launchpad__overlay" +
        (visible ? " visible" : "") +
        (modalAccessible ? " modal-accessible" : " modal-inaccessible")
      }
      onClick={onClose}
    >
      {(!!bookmarksTree.length || !!customLaunchpadLinks?.length) && (
        <div className="launchpad__tab">
          <button
            className={
              "launchpad__tab__button" +
              (activeTab === "google_apps" ? " selected" : "")
            }
            onClick={handleTabSelect("google_apps")}
          >
            <Translation value="google_apps" />
          </button>
          {!!customLaunchpadLinks?.length && (
            <button
              className={
                "launchpad__tab__button" +
                (activeTab === "my_apps" ? " selected" : "")
              }
              onClick={handleTabSelect("my_apps")}
            >
              <Translation value="my_apps" />
            </button>
          )}
          {!!bookmarksTree.length && (
            <button
              className={
                "launchpad__tab__button" +
                (activeTab === "bookmarks" ? " selected" : "")
              }
              onClick={handleTabSelect("bookmarks")}
            >
              <Translation value="bookmarks" />
            </button>
          )}
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
      {activeTab === "google_apps" && (
        <div className="launchpad__container">
          {filteredLaunchpadList.map((item, idx) => (
            <a
              href={item.href}
              rel="noreferrer"
              target={separatePageSite ? "_blank" : "_self"}
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

      {activeTab === "my_apps" && (
        <div className="launchpad__container">
          {filteredCustomLinks?.map((item: any, idx: number) => (
            <a
              href={item.url}
              rel="noreferrer"
              target={separatePageSite ? "_blank" : "_self"}
              className="launchpad-item"
              key={item.id || idx}
              title={item.title}
            >
              <div className="launchpad-item__logo">
                {item.hasCustomIcon ? (
                  <DockIcon
                    id={item.id}
                    hasCustomIcon={true}
                    url={item.url}
                    title={item.title}
                    iconDbPrefix="launchpad_custom_icon"
                  />
                ) : (
                  <img
                    className="launchpad-item__icon"
                    src={faviconURL(item.url)}
                    onError={({ currentTarget }) => {
                      currentTarget.src = FAVICON_URL + item.url;
                      currentTarget.onerror = () => {
                        currentTarget.src = FALLBACK_SITE_IMAGE;
                        currentTarget.onerror = null;
                      };
                    }}
                    alt={item.title}
                    style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover" }}
                  />
                )}
              </div>
              <span className="launchpad-item__label">{item.title}</span>
            </a>
          ))}
        </div>
      )}

      {activeTab === "bookmarks" && (
        <>
          <div className="launchpad__bookmarks__container">
            {filteredBookmarksTree.map((item) => (
              <BookmarkGroup
                data={item}
                onBookmarkRemove={handleBookmarkRemove}
                onBookmarkEdit={handleBookmarkEdit}
                separatePageSite={separatePageSite}
              />
            ))}
          </div>
          <ConfirmDialog
            open={!!bookmarkIdToBeDeleted}
            title={<Translation value="delete_bookmark" />}
            description={<Translation value="delete_bookmark_confirm" />}
            confirmText={<Translation value="delete" />}
            cancelText={<Translation value="keep" />}
            onConfirm={handleConfirmDelete}
            onCancel={() => setBookmarkIdToBeDeleted("")}
          />
          <ConfirmDialog
            open={!!bookmarkToBeEdited}
            title="Edit Bookmark"
            confirmText="Save"
            cancelText="Cancel"
            onConfirm={handleConfirmEdit}
            onCancel={() => setBookmarkToBeEdited(null)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label htmlFor="edit-name" style={{ fontSize: "12px", fontWeight: 600 }}>Name</label>
                <div className="cd-input__container">
                  <input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label htmlFor="edit-url" style={{ fontSize: "12px", fontWeight: 600 }}>URL</label>
                <div className="cd-input__container">
                  <input
                    id="edit-url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              {editError && (
                <div style={{ color: "#ff4d4d", fontSize: "12px", marginTop: "4px" }}>
                  {editError}
                </div>
              )}
            </div>
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}

function BookmarkGroup({
  data,
  onBookmarkRemove,
  onBookmarkEdit,
  separatePageSite,
}: {
  data: chrome.bookmarks.BookmarkTreeNode;
  onBookmarkRemove: (id: string) => void;
  onBookmarkEdit: (bookmark: chrome.bookmarks.BookmarkTreeNode) => void;
  separatePageSite?: boolean;
}) {
  if (data?.children?.length) {
    return (
      <fieldset className="bookmark-group">
        <legend className="bookmark-group-title">{data.title}</legend>
        {data.children.map((item) => (
          <BookmarkGroup data={item} onBookmarkRemove={onBookmarkRemove} onBookmarkEdit={onBookmarkEdit} separatePageSite={separatePageSite} />
        ))}
      </fieldset>
    );
  }

  if (!data.url) {
    return null;
  }

  const handleBookmarkDelete = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    bookmarkId: string
  ) => {
    event.stopPropagation();
    event.preventDefault();
    onBookmarkRemove(bookmarkId);
  };

  const handleContextMenu = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onBookmarkEdit(data);
  };

  return (
    <a
      href={data.url}
      rel="noreferrer"
      target={separatePageSite ? "_blank" : "_self"}
      className="bookmark-item"
      key={data.id}
      title={data.title}
      onContextMenu={handleContextMenu}
    >
      <button
        className="bookmark-item__delete button-icon"
        onClick={(event) => handleBookmarkDelete(event, data.id)}
      >
        <DeleteIcon />
      </button>
      <img
        className="bookmark-item__icon"
        src={faviconURL(data.url, "40")}
        alt={data.title}
        onError={({ currentTarget }) => {
          currentTarget.src = FAVICON_URL + data.url;
          currentTarget.onerror = () => {
            currentTarget.src = FALLBACK_SITE_IMAGE;
            currentTarget.onerror = null;
          };
        }}
      />
      <span className="bookmark-item__label">{data.title}</span>
    </a>
  );
}
