import React, {
  ChangeEvent,
  memo,
  useContext,
  useEffect,
  useState,
} from "react";
import "./Dock.css";
import { AppContext } from "../../../context/provider";
import { List, arrayMove } from "react-movable";
import { ReactComponent as DeleteIcon } from "../delete-icon.svg";
import {
  DOCK_SITES_MAX_LIMIT,
  DockPosition,
  dockPositions,
} from "../../../static/dockSites";
import Translation from "../../../locale/Translation";
import { Select } from "../../select/Select";

export default memo(function Dock() {
  const [changesActive, setChangesActive] = useState(false);
  const {
    dockBarSites,
    handleDockSitesChange,
    dockPosition,
    handleDockPositionChange,
  } = useContext(AppContext);
  const [currentDockSites, setCurrentDockSites] = useState(dockBarSites);

  useEffect(() => {
    setCurrentDockSites(dockBarSites);
  }, [dockBarSites]);

  const handleDone = () => {
    setChangesActive(false);
    handleDockSitesChange(
      currentDockSites.filter(
        ({ title, url }) => !!url.trim() && !!title.trim()
      )
    );
  };

  const handleAdd = () => {
    if (currentDockSites.length === DOCK_SITES_MAX_LIMIT) {
      return;
    }
    setChangesActive(true);
    const updatedDockSites = [...currentDockSites];
    updatedDockSites.push({ title: "", url: "" });
    setCurrentDockSites(updatedDockSites);
  };

  const handleDelete = (idx?: number) => () => {
    const updatedDockSites = currentDockSites.filter(
      (_, index) => index !== idx
    );
    setCurrentDockSites(updatedDockSites);
    setChangesActive(true);
  };

  const handleInput = (
    e: ChangeEvent<HTMLInputElement>,
    key: "title" | "url",
    idx?: number
  ) => {
    setChangesActive(true);
    const updatedDockSites = currentDockSites.map((item, index) => {
      if (index === idx) {
        return {
          ...item,
          [key]: e.target.value,
        };
      }
      return item;
    });

    setCurrentDockSites(updatedDockSites);
  };

  return (
    <div className="dock-links__container">
      <div
        className={
          "dock-links__position" + (!currentDockSites.length ? " disabled" : "")
        }
      >
        {/* <Translation value="position" /> */}
        <p>Position On Screen</p>
        <Select
          options={dockPositions}
          value={dockPosition}
          onChange={(event) =>
            handleDockPositionChange(event.target.value as DockPosition)
          }
        />
      </div>
      <div>
        <button className="dock-links__add" onClick={handleAdd}>
          <Translation value="add" />
        </button>
        {changesActive && (
          <button className="dock-links__done" onClick={handleDone}>
            <Translation value="done" />
          </button>
        )}
      </div>
      {currentDockSites.length === DOCK_SITES_MAX_LIMIT && (
        <p className="maximum-limit-warning">
          <Translation value="dock_max_limit" />
        </p>
      )}
      <div
        className={
          "dock-links__list-container" +
          (!currentDockSites.length ? " center" : "")
        }
      >
        {currentDockSites.length ? (
          <List
            lockVertically
            values={currentDockSites}
            onChange={({ oldIndex, newIndex }) => {
              setCurrentDockSites(
                arrayMove(currentDockSites, oldIndex, newIndex)
              );
              setChangesActive(true);
            }}
            renderList={({ children, props }) => (
              <div className="dock-links__draggable-container" {...props}>
                {children}
              </div>
            )}
            renderItem={({ value, props, index }) => (
              <div className="dock-link-input__container" {...props}>
                <div className="dock-link-input-group">
                  <div className="input__container">
                    <input
                      value={value.title}
                      placeholder="Example"
                      onChange={(event) => handleInput(event, "title", index)}
                    />
                  </div>
                  <div className="input__container">
                    <input
                      value={value.url}
                      placeholder="https://example.com"
                      onChange={(event) => handleInput(event, "url", index)}
                    />
                  </div>
                </div>
                <button
                  className="dock-links__delete"
                  onClick={handleDelete(index)}
                >
                  <DeleteIcon />
                </button>
              </div>
            )}
          />
        ) : (
          <Translation value="add_dock_links" />
        )}
      </div>
    </div>
  );
});
