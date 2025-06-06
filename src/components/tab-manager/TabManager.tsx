import { ChangeEvent, useContext, useEffect, useMemo, useState } from "react";
import { ReactComponent as CloseIcon } from "./close-icon.svg";
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
      handleUpdateTabList();
    }
  }, [open]);

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
    chrome?.tabs?.remove(id);
    setTimeout(() => {
      handleUpdateTabList();
    }, 200);
  };

  const handleUpdateTabList = () => {
    chrome?.tabs?.query({}, (tabs: chrome.tabs.Tab[]) => {
      setTabList(tabs);
    });
  };

  const handleFocusTab = (tab: chrome.tabs.Tab) => {
    if (tab.id) {
      chrome?.tabs?.update(tab.id, { active: true });
      chrome?.windows?.update(tab.windowId, { focused: true });
    }
  };

  const handleSearch = (evt: ChangeEvent<HTMLInputElement>) => {
    setSearch(evt.target.value);
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
            value={search}
            placeholder={translation[locale]["search_tabs"]}
            onChange={handleSearch}
          />
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
                      className="tab-manager__tab-list"
                      key={tab.id}
                      onClick={() => handleFocusTab(tab)}
                    >
                      <div className="tab-manager__tab-info">
                        <img
                          className="tab-manager__tab-icon"
                          src={tab.favIconUrl || EmptySiteImage}
                          alt={tab.title}
                        />
                        <div>
                          <h4 className="tab-manager__tab-title">
                            {tab.title}
                          </h4>
                          <h5 className="tab-manager__tab-description">
                            {tab.url}
                          </h5>
                        </div>
                      </div>
                      <button
                        className="tab-manager__tab-close"
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
