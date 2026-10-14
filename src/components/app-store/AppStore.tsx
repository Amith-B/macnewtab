import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./AppStore.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import { getBodyZoomScale } from "../../utils/zoom";
import { generateRandomId } from "../../utils/random";
import { faviconURL } from "../../utils/favicon";
import {
  APP_STORE_CATALOG,
  AppStoreCategory,
  STORE_SECTIONS,
  StoreAppItem,
} from "../../static/appStoreCatalog";

import { ReactComponent as TodoIcon } from "../../assets/todo.svg";
import { ReactComponent as StickyNotesIcon } from "../../assets/sticky-notes.svg";
import { ReactComponent as FocusIcon } from "../../assets/focus.svg";
import { ReactComponent as FreeformIcon } from "../../assets/freeform.svg";
import { ReactComponent as ScreenRecorderIcon } from "../../assets/screen-recorder.svg";
import { ReactComponent as CloseIcon } from "../settings/close-icon.svg";
import { ReactComponent as MinimizeIcon } from "../settings/minimize-icon.svg";

import {
  DiscoverIcon,
  ArcadeIcon,
  CreateIcon,
  WorkIcon,
  EntertainmentIcon,
  DevelopIcon,
  CategoriesIcon,
  SearchIcon,
  TrashIcon,
} from "./icons/StoreIcons";

interface AppStoreProps {
  open: boolean;
  onClose: () => void;
  onOpenApp?: (appId: string) => void;
}

export default function AppStore({ open, onClose, onOpenApp }: AppStoreProps) {
  const {
    dockPosition,
    dockBarSites,
    handleDockSitesChange,
    todoListVisbility,
    setTodoListVisbility,
    showStickyNotes,
    setShowStickyNotes,
    showFocusMode,
    setShowFocusMode,
    showFreeform,
    setShowFreeform,
    showScreenRecorder,
    setShowScreenRecorder,
    separatePageSite,
    locale,
  } = useContext(AppContext);

  const t = translation[locale] || translation.en;

  const [activeTab, setActiveTab] = useState<AppStoreCategory>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalAccessible, setModalAccessible] = useState(false);
  const [renderOpen, setRenderOpen] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: "unset", y: "unset" });
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const dragScale = useRef(1);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setRenderOpen(true), 10);
      setModalAccessible(true);
      return () => clearTimeout(timer);
    } else {
      setRenderOpen(false);
      const timerRef = setTimeout(() => {
        setModalAccessible(false);
        setPosition({ x: "unset", y: "unset" });
        setSearchQuery("");
      }, 500);
      return () => clearTimeout(timerRef);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  // URL normalizer helper
  const normalizeUrl = (u?: string) =>
    u ? u.trim().replace(/\/+$/, "").toLowerCase() : "";

  // Window drag handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const scale = dragScale.current || 1;

    setPosition({
      x: `${e.clientX / scale - offset.current.x}px`,
      y: `${e.clientY / scale - offset.current.y}px`,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!modalRef.current) return;
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest(".app-store__content-body")
      ) {
        return;
      }

      isDragging.current = true;
      dragScale.current = getBodyZoomScale() || 1;
      const scale = dragScale.current;

      offset.current = {
        x:
          e.clientX / scale -
          modalRef.current.getBoundingClientRect().left / scale,
        y:
          e.clientY / scale - modalRef.current.getBoundingClientRect().top / scale,
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  // Clean up drag event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Determine installed status
  const isAppInstalled = useCallback(
    (app: StoreAppItem): boolean => {
      if (app.isNative) {
        switch (app.nativeId) {
          case "native_todo":
            return !!todoListVisbility;
          case "native_sticky_notes":
            return !!showStickyNotes;
          case "native_focus_mode":
            return !!showFocusMode;
          case "native_freeform":
            return !!showFreeform;
          case "native_screen_recorder":
            return !!showScreenRecorder;
          default:
            return false;
        }
      }
      if (!app.url) return false;
      const appNorm = normalizeUrl(app.url);
      return dockBarSites.some(
        (site) =>
          (site.url && normalizeUrl(site.url) === appNorm) ||
          (site.id && site.id === app.id),
      );
    },
    [
      todoListVisbility,
      showStickyNotes,
      showFocusMode,
      showFreeform,
      showScreenRecorder,
      dockBarSites,
    ],
  );

  // Install (GET) handler
  const handleInstallApp = useCallback(
    (app: StoreAppItem) => {
      if (app.isNative) {
        switch (app.nativeId) {
          case "native_todo":
            setTodoListVisbility(true);
            break;
          case "native_sticky_notes":
            setShowStickyNotes(true);
            break;
          case "native_focus_mode":
            setShowFocusMode(true);
            break;
          case "native_freeform":
            setShowFreeform(true);
            break;
          case "native_screen_recorder":
            setShowScreenRecorder(true);
            break;
        }
        return;
      }

      if (app.url) {
        const appNorm = normalizeUrl(app.url);
        const isAlreadyAdded = dockBarSites.some(
          (site) =>
            (site.url && normalizeUrl(site.url) === appNorm) ||
            site.id === app.id,
        );
        if (!isAlreadyAdded) {
          const newSite = {
            id: generateRandomId(),
            title: app.name,
            url: app.url,
            type: "link" as const,
            hasCustomIcon: false,
          };
          handleDockSitesChange([...dockBarSites, newSite]);
        }
      }
    },
    [
      dockBarSites,
      handleDockSitesChange,
      setTodoListVisbility,
      setShowStickyNotes,
      setShowFocusMode,
      setShowFreeform,
      setShowScreenRecorder,
    ],
  );

  // Uninstall / Remove handler
  const handleUninstallApp = useCallback(
    (app: StoreAppItem, e: React.MouseEvent) => {
      e.stopPropagation();
      if (app.isNative) {
        switch (app.nativeId) {
          case "native_todo":
            setTodoListVisbility(false);
            break;
          case "native_sticky_notes":
            setShowStickyNotes(false);
            break;
          case "native_focus_mode":
            setShowFocusMode(false);
            break;
          case "native_freeform":
            setShowFreeform(false);
            break;
          case "native_screen_recorder":
            setShowScreenRecorder(false);
            break;
        }
        return;
      }

      if (app.url) {
        const appNorm = normalizeUrl(app.url);
        const updated = dockBarSites.filter(
          (site) =>
            normalizeUrl(site.url) !== appNorm && site.id !== app.id,
        );
        handleDockSitesChange(updated);
      }
    },
    [
      dockBarSites,
      handleDockSitesChange,
      setTodoListVisbility,
      setShowStickyNotes,
      setShowFocusMode,
      setShowFreeform,
      setShowScreenRecorder,
    ],
  );

  // Open App handler
  const handleOpenApp = useCallback(
    (app: StoreAppItem) => {
      if (app.isNative && app.nativeId) {
        onClose();
        if (onOpenApp) {
          onOpenApp(app.nativeId);
        }
        return;
      }

      if (app.url) {
        window.open(app.url, separatePageSite ? "_blank" : "_self");
      }
    },
    [onClose, onOpenApp, separatePageSite],
  );

  // Filtered catalog based on search or category
  const filteredApps = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return APP_STORE_CATALOG.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.subtitle.toLowerCase().includes(q) ||
          (app.description && app.description.toLowerCase().includes(q)) ||
          app.category.toLowerCase().includes(q),
      );
    }

    if (activeTab === "discover") {
      return APP_STORE_CATALOG;
    }

    return APP_STORE_CATALOG.filter((app) => app.category === activeTab);
  }, [searchQuery, activeTab]);

  // Render app icon
  const renderAppIcon = (app: StoreAppItem) => {
    if (app.isNative) {
      switch (app.nativeId) {
        case "native_todo":
          return <TodoIcon />;
        case "native_sticky_notes":
          return <StickyNotesIcon />;
        case "native_focus_mode":
          return <FocusIcon />;
        case "native_freeform":
          return <FreeformIcon />;
        case "native_screen_recorder":
          return <ScreenRecorderIcon />;
        default:
          break;
      }
    }

    let domain = app.domain;
    if (!domain && app.url) {
      try {
        domain = new URL(app.url).hostname;
      } catch {
        domain = "google.com";
      }
    }
    domain = domain || "google.com";

    return (
      <img
        src={faviconURL(`https://${domain}`, "64")}
        alt={app.name}
        className="app-store__card-icon-img"
        onError={({ currentTarget }) => {
          currentTarget.onerror = null;
          currentTarget.src =
            "https://www.google.com/s2/favicons?sz=64&domain=" + domain;
        }}
      />
    );
  };

  // Render single app card
  const renderAppCard = (app: StoreAppItem) => {
    const installed = isAppInstalled(app);

    return (
      <div key={app.id} className="app-store__card">
        <div className="app-store__card-left">
          <div className="app-store__card-icon-wrapper">
            {renderAppIcon(app)}
          </div>
          <div className="app-store__card-info">
            <h4 className="app-store__card-title">{app.name}</h4>
            <p className="app-store__card-subtitle">{app.subtitle}</p>
          </div>
        </div>
        <div className="app-store__card-action">
          {installed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                className="app-store__btn open"
                onClick={() => handleOpenApp(app)}
                title={t.open || "Open"}
              >
                {t.open || "Open"}
              </button>
              <button
                className="app-store__uninstall-btn"
                onClick={(e) => handleUninstallApp(app, e)}
                title={t.remove_from_dock || "Remove from Dock"}
              >
                <TrashIcon />
              </button>
            </div>
          ) : (
            <button
              className="app-store__btn get"
              onClick={() => handleInstallApp(app)}
            >
              {app.pricing && app.pricing !== "Get"
                ? app.pricing
                : t.get || "Get"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const navItems = useMemo(
    () => [
      { key: "discover" as const, label: t.discover || "Discover", icon: DiscoverIcon },
      { key: "arcade" as const, label: t.arcade || "Arcade", icon: ArcadeIcon },
      { key: "create" as const, label: t.create || "Create", icon: CreateIcon },
      { key: "work" as const, label: t.work || "Work", icon: WorkIcon },
      { key: "entertainment" as const, label: t.entertainment || "Entertainment", icon: EntertainmentIcon },
      { key: "develop" as const, label: t.develop || "Develop", icon: DevelopIcon },
      { key: "categories" as const, label: t.categories || "Categories", icon: CategoriesIcon },
    ],
    [t],
  );

  const currentTabTitle = useMemo(() => {
    if (searchQuery.trim()) {
      return `Search: "${searchQuery}"`;
    }
    const found = navItems.find((item) => item.key === activeTab);
    return found ? found.label : "Discover";
  }, [searchQuery, activeTab, navItems]);

  return (
    <div
      className={
        "app-store__overlay" +
        (renderOpen ? " visible" : "") +
        (modalAccessible ? " modal-accessible" : " modal-inaccessible")
      }
      onClick={onClose}
    >
      <div
        className={`app-store__container dock-position-${dockPosition}`}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
        }}
      >
        {/* ─── Left Sidebar ────────────────────────────────────────── */}
        <div className="app-store__sidebar" onMouseDown={handleMouseDown}>
          <div className="app-store__sidebar-top">
            {/* Traffic lights */}
            <div className="app-store__window-controls">
              <button
                className="app-store__window-btn close"
                onClick={onClose}
                title="Close"
              >
                <CloseIcon />
              </button>
              <button
                className="app-store__window-btn minimize"
                onClick={onClose}
                title="Minimize"
              >
                <MinimizeIcon />
              </button>
              <button
                className="app-store__window-btn expand"
                disabled
                tabIndex={-1}
                aria-hidden="true"
                title="Expand disabled"
              />
            </div>

            {/* Search Pill */}
            <div className="app-store__search-box">
              <SearchIcon className="app-store__search-icon" />
              <input
                type="text"
                className="app-store__search-input"
                placeholder={t.search_apps || "Search"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="app-store__search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Navigation items */}
            <div className="app-store__nav-list">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.key && !searchQuery.trim();
                return (
                  <button
                    key={item.key}
                    className={`app-store__nav-item${
                      isActive ? " active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab(item.key);
                      setSearchQuery("");
                    }}
                  >
                    <div className="app-store__nav-item-left">
                      <span className="app-store__nav-icon">
                        <IconComponent />
                      </span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Main Content Area ───────────────────────────────────── */}
        <div className="app-store__main">
          {/* Window Header */}
          <div className="app-store__header" onMouseDown={handleMouseDown}>
            <div className="app-store__header-title">{currentTabTitle}</div>
          </div>

          {/* Content Body */}
          <div className="app-store__content-body">
            {/* 1. Search Query Results */}
            {searchQuery.trim() ? (
              <div className="app-store__section">
                <div className="app-store__section-header">
                  <h2 className="app-store__section-title">
                    {filteredApps.length} Results
                  </h2>
                </div>
                {filteredApps.length === 0 ? (
                  <div className="app-store__empty-state">
                    <SearchIcon className="app-store__empty-state-icon" />
                    <h3>
                      {t.no_apps_found || "No apps found matching your search"}
                    </h3>
                    <p>Try searching for a different keyword or app name.</p>
                  </div>
                ) : (
                  <div className="app-store__grid">
                    {filteredApps.map(renderAppCard)}
                  </div>
                )}
              </div>
            ) : activeTab === "discover" ? (
              /* 2. Discover Tab: Curated Sections */
              STORE_SECTIONS.map((section) => {
                const sectionApps = APP_STORE_CATALOG.filter(
                  (app) => app.section === section.id,
                );
                if (sectionApps.length === 0) return null;

                return (
                  <div key={section.id} className="app-store__section">
                    <div className="app-store__section-header">
                      <h2 className="app-store__section-title">
                        {section.title}
                      </h2>
                      <button
                        className="app-store__section-see-all"
                        onClick={() => setActiveTab(section.seeAllCategory)}
                      >
                        {t.see_all || "See All"}
                      </button>
                    </div>
                    <div className="app-store__grid">
                      {sectionApps.map(renderAppCard)}
                    </div>
                  </div>
                );
              })
            ) : activeTab === "categories" ? (
              /* 3. Categories Overview */
              <div className="app-store__section">
                <div className="app-store__section-header">
                  <h2 className="app-store__section-title">
                    {t.categories || "Categories"}
                  </h2>
                </div>
                <div className="app-store__categories-grid">
                  {[
                    { key: "work" as const, title: "Work & Productivity", desc: "Notes, tasks, documents & chat", icon: WorkIcon },
                    { key: "create" as const, title: "Create & Design", desc: "Whiteboards, sketching & visual tools", icon: CreateIcon },
                    { key: "develop" as const, title: "Developer Tools", desc: "Code, repos, APIs & cloud platforms", icon: DevelopIcon },
                    { key: "entertainment" as const, title: "Entertainment", desc: "Music, videos, streaming & podcasts", icon: EntertainmentIcon },
                    { key: "arcade" as const, title: "Arcade Games", desc: "Classic browser puzzles & retro games", icon: ArcadeIcon },
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <div
                        key={cat.key}
                        className="app-store__category-card"
                        onClick={() => setActiveTab(cat.key)}
                      >
                        <div className="app-store__category-card-icon">
                          <CatIcon />
                        </div>
                        <div>
                          <h3>{cat.title}</h3>
                          <p>{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* 4. Regular Category Page (Work, Create, Develop, Play, Arcade) */
              <div className="app-store__section">
                <div className="app-store__section-header">
                  <h2 className="app-store__section-title">
                    {currentTabTitle}
                  </h2>
                </div>
                <div className="app-store__grid">
                  {filteredApps.map(renderAppCard)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
