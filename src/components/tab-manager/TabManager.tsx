import {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ReactComponent as CloseIcon } from "./close-icon.svg";
import { ReactComponent as MutedIcon } from "./muted.svg";
import { ReactComponent as UnmutedIcon } from "./unmuted.svg";
import EmptySiteImage from "./empty-site-image.png";
import "./TabManager.css";
import Translation from "../../locale/Translation";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";

const getGroupedTabs = (tabs: chrome.tabs.Tab[], search: string) => {
  return tabs.reduce((prev: Record<number, chrome.tabs.Tab[]>, current) => {
    if (
      search &&
      !current.title?.toLowerCase()?.includes(search.toLowerCase()) &&
      !current.url?.toLowerCase()?.includes(search.toLowerCase())
    ) {
      return prev;
    }

    const windowId = current.windowId;

    const groupedTabs = prev[windowId] || [];
    groupedTabs.push(current);

    return {
      ...prev,
      [windowId]: groupedTabs,
    };
  }, {});
};

export default function TabManager() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tabList, setTabList] = useState<chrome.tabs.Tab[]>([]);
  const { locale } = useContext(AppContext);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timerRef = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);

    return () => clearTimeout(timerRef);
  }, [search]);

  const groupedTabs = useMemo(() => {
    return getGroupedTabs(tabList as chrome.tabs.Tab[], debouncedSearch);
  }, [tabList, debouncedSearch]);

  useEffect(() => {
    if (open) {
      searchRef.current && searchRef.current.focus();

      handleUpdateTabList();
      setSearch("");

      const handleTabUpdate = (
        _tabId: number,
        _tabChange: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab
      ) => {
        if (tab.status === "complete") {
          handleUpdateTabList();
        }
      };

      const handleTabRemove = () => {
        handleUpdateTabList();
      };

      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      };

      chrome.tabs.onUpdated.addListener(handleTabUpdate);
      chrome.tabs.onRemoved.addListener(handleTabRemove);
      document.addEventListener("keydown", handleEsc);

      return () => {
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
        chrome.tabs.onRemoved.removeListener(handleTabRemove);
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [open, searchRef]);

  const hasAllTabsMmuted = useMemo(() => {
    return tabList
      .filter((tab) => tab.audible)
      .every((tab) => tab.mutedInfo?.muted);
  }, [tabList]);

  const hasAudibleTab = useMemo(() => {
    return tabList.some((tab) => tab.audible);
  }, [tabList]);

  const handleOpen = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    setOpen(true);
  };

  const handleRemoveTab = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id?: number
  ) => {
    event.stopPropagation();
    if (!id) {
      return;
    }
    try {
      chrome?.tabs?.remove(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTabList = () => {
    try {
      chrome?.tabs?.query({}, (tabs: chrome.tabs.Tab[]) => {
        setTabList(tabs);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleFocusTab = (tab: chrome.tabs.Tab) => {
    if (tab.id) {
      try {
        chrome?.tabs?.update(tab.id, { active: true });
        chrome?.windows?.update(tab.windowId, { focused: true });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleToggleMute = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    tab: chrome.tabs.Tab
  ) => {
    event.stopPropagation();

    if (tab.id && tab.mutedInfo) {
      try {
        chrome?.tabs?.update(tab.id, { muted: !tab.mutedInfo.muted });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleToggleMuteOrUnmuteAll = () => {
    const updateMuteState = !hasAllTabsMmuted;

    tabList.forEach((tab) => {
      if (tab.audible && tab.id) {
        chrome?.tabs?.update(tab.id, { muted: updateMuteState });
      }
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    tab: chrome.tabs.Tab
  ) => {
    if (event.key === "Enter") {
      handleFocusTab(tab);
    }
  };

  const handleSearch = (evt: ChangeEvent<HTMLInputElement>) => {
    setSearch(evt.target.value);
  };

  const handleCloseAll = async () => {
    try {
      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const tabGroups = Object.values(groupedTabs);

      const tabsToClose = [];
      for (let i = 0; i < tabGroups.length; i++) {
        for (let j = 0; j < tabGroups[i].length; j++) {
          const tab = tabGroups[i][j];
          if (tab.id && tab.id !== currentTab?.id) {
            tabsToClose.push(tab.id);
          }
        }
      }

      await chrome.tabs.remove(tabsToClose);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <aside
      className={"tab-manager__overlay" + (open ? " open" : "")}
      onClick={() => setOpen(false)}
    >
      <section
        className={"tab-manager__content" + (open ? " open" : "")}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="tab-manager__header">
          <Translation value="tab_manager" />
        </h2>
        <div className="tab-manager__search-container">
          <input
            id="search-tabs"
            name="Search Tabs"
            ref={searchRef}
            value={search}
            placeholder={translation[locale]["search_tabs"]}
            onChange={handleSearch}
            tabIndex={open ? 0 : -1}
          />
        </div>
        <div className="tab-manager__cta">
          {hasAudibleTab && (
            <button
              className="button"
              onClick={handleToggleMuteOrUnmuteAll}
              tabIndex={open ? 0 : -1}
            >
              {hasAllTabsMmuted ? "Unmute All" : "Mute All"}
            </button>
          )}
          <button
            className="button"
            onClick={handleCloseAll}
            tabIndex={open ? 0 : -1}
          >
            {debouncedSearch ? (
              <Translation value="close_filtered" />
            ) : (
              <Translation value="close_all" />
            )}
          </button>
        </div>
        <div className="tab-manager__tab-list-container">
          {Object.entries(groupedTabs).map(
            ([windowId, groupedTabList], idx) => {
              return (
                <div key={windowId}>
                  <h2 className="tab-manager__tab-group-title">
                    <Translation value="window" /> {idx + 1} (
                    {groupedTabList.length} <Translation value="tabs" />)
                  </h2>
                  {groupedTabList.map((tab) => (
                    <div
                      className={
                        "tab-manager__tab-list" +
                        (tab.audible ? " has-mute-button" : "")
                      }
                      key={tab.id}
                      tabIndex={open ? 0 : -1}
                      onKeyDown={(event) => handleKeyDown(event, tab)}
                      onClick={() => handleFocusTab(tab)}
                    >
                      <div className="tab-manager__tab-info">
                        <img
                          className="tab-manager__tab-icon"
                          src={tab.favIconUrl || EmptySiteImage}
                          alt={tab.title}
                        />
                        <div>
                          <h4
                            className="tab-manager__tab-title"
                            title={tab.title}
                          >
                            {tab.title}
                          </h4>
                          <h5
                            className="tab-manager__tab-description"
                            title={tab.url}
                          >
                            {tab.url}
                          </h5>
                        </div>
                      </div>
                      {tab.audible && (
                        <button
                          className="tab-manager__tab-toggle-mute"
                          onKeyDown={(event) =>
                            event.key === "Enter" && event.stopPropagation()
                          }
                          onClick={(event) => handleToggleMute(event, tab)}
                        >
                          {tab.mutedInfo?.muted ? (
                            <MutedIcon />
                          ) : (
                            <UnmutedIcon />
                          )}
                        </button>
                      )}
                      <button
                        className="tab-manager__tab-close"
                        onKeyDown={(event) =>
                          event.key === "Enter" && event.stopPropagation()
                        }
                        onClick={(event) => handleRemoveTab(event, tab.id)}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
              );
            }
          )}
        </div>
      </section>
      <button className="tab-manager__anchor" onClick={handleOpen}>
        <div className="tab-manager__anchor-bar"></div>
      </button>
    </aside>
  );
}
