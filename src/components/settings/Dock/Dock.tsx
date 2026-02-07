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
import { ReactComponent as DeleteIcon } from "../../../assets/delete-icon.svg";
import { ReactComponent as DraggableIcon } from "./draggable.svg";
import { DockIcon } from "../../dock/DockIcon";
import { DockPosition, dockPositions } from "../../../static/dockSites";
import Translation from "../../../locale/Translation";
import { Select } from "../../select/Select";
import { generateRandomId } from "../../../utils/random";
import Toggle from "../../toggle/Toggle";
import {
  saveImageToIndexedDB,
  deleteImageFromIndexedDB,
} from "../../../utils/db";

export default memo(function Dock() {
  const [changesActive, setChangesActive] = useState(false);
  const {
    dockBarSites,
    handleDockSitesChange,
    dockPosition,
    setDockPosition,
    todoListVisbility,
    setTodoListVisbility,
    showStickyNotes,
    setShowStickyNotes,
    showFocusMode,
    setShowFocusMode,
  } = useContext(AppContext);
  const [currentDockSites, setCurrentDockSites] = useState(dockBarSites);

  useEffect(() => {
    setCurrentDockSites(dockBarSites);
  }, [dockBarSites]);

  const handleDone = async () => {
    // Check for deleted items or items with removed custom icons
    const currentIds = new Set(currentDockSites.map((site) => site.id));

    // 1. Find items that were removed completely
    for (const originalSite of dockBarSites) {
      if (!currentIds.has(originalSite.id) && originalSite.hasCustomIcon) {
        await deleteImageFromIndexedDB(`dock_icon_${originalSite.id}`);
      }
    }

    // 2. Find items that exist but had their custom icon removed
    for (const currentSite of currentDockSites) {
      const originalSite = dockBarSites.find((s) => s.id === currentSite.id);
      if (
        originalSite &&
        originalSite.hasCustomIcon &&
        !currentSite.hasCustomIcon
      ) {
        await deleteImageFromIndexedDB(`dock_icon_${originalSite.id}`);
      }
    }

    setChangesActive(false);
    handleDockSitesChange(
      currentDockSites.filter(
        ({ title, url }) => !!url.trim() && !!title.trim(),
      ),
    );
  };

  const handleAdd = () => {
    setChangesActive(true);
    const updatedDockSites = [...currentDockSites];
    updatedDockSites.push({ title: "", url: "", id: generateRandomId() });
    setCurrentDockSites(updatedDockSites);
  };

  const handleDelete = (idx: number) => () => {
    const updatedDockSites = currentDockSites.filter(
      (_, index) => index !== idx,
    );
    setCurrentDockSites(updatedDockSites);
    setChangesActive(true);
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      if (reader.result) {
        const item = currentDockSites[idx];
        await saveImageToIndexedDB(
          reader.result as string,
          `dock_icon_${item.id}`,
        );

        const updatedDockSites = [...currentDockSites];
        updatedDockSites[idx] = {
          ...item,
          hasCustomIcon: true,
        };
        setCurrentDockSites(updatedDockSites);
        setChangesActive(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomIcon = (idx?: number) => {
    if (idx === undefined) return;
    const item = currentDockSites[idx];

    const updatedDockSites = [...currentDockSites];
    updatedDockSites[idx] = {
      ...item,
      hasCustomIcon: false,
    };
    setCurrentDockSites(updatedDockSites);
    setChangesActive(true);
  };

  const handleInput = (
    e: ChangeEvent<HTMLInputElement>,
    key: "title" | "url",
    idx?: number,
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
      <div className={"todo-dock__toggle"}>
        <span>
          <h3 className="todo-dock-toggle-title">
            <Translation value="todo_toggle_title" />
          </h3>
          <h4 className="todo-dock-toggle-description">
            <Translation value="todo_toggle_description" />
          </h4>
        </span>
        <Toggle
          id={"todo-dock-toggle"}
          isChecked={todoListVisbility}
          handleToggleChange={() => setTodoListVisbility(!todoListVisbility)}
        />
      </div>
      <div className="sticky-notes-dock__toggle">
        <Translation value="show_sticky_notes" />
        <Toggle
          id={"sticky-notes-toggle"}
          name="Sticky notes toggle"
          isChecked={showStickyNotes}
          handleToggleChange={() => setShowStickyNotes(!showStickyNotes)}
        />
      </div>
      <div className="focus-mode-dock__toggle">
        <Translation value="show_focus_mode" />
        <Toggle
          id={"focus-mode-toggle"}
          name="Focus mode toggle"
          isChecked={showFocusMode}
          handleToggleChange={() => setShowFocusMode(!showFocusMode)}
        />
      </div>
      <div
        className={
          "dock-links__position" + (!currentDockSites.length ? " disabled" : "")
        }
      >
        <Translation value="position_on_screen" />
        <Select
          id="dock-position-menu"
          name="Dock position menu"
          options={dockPositions}
          value={dockPosition}
          onChange={(event) =>
            setDockPosition(event.target.value as DockPosition)
          }
        />
      </div>
      <div>
        <button className="dock-links__add button" onClick={handleAdd}>
          <Translation value="add" />
        </button>
        {changesActive && (
          <button className="dock-links__done button" onClick={handleDone}>
            <Translation value="done" />
          </button>
        )}
      </div>
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
                arrayMove(currentDockSites, oldIndex, newIndex),
              );
              setChangesActive(true);
            }}
            renderList={({ children, props }) => (
              <div className="dock-links__draggable-container" {...props}>
                {children}
              </div>
            )}
            renderItem={({ value, props, index }) => (
              <div
                className="dock-link-input__container draggable"
                {...props}
                key={value.id}
              >
                <div className="dock-link-input-group">
                  <DraggableIcon
                    className="draggable-indicator"
                    style={{
                      height: "16px",
                      width: "fit-content",
                    }}
                  />
                  <div className="dock-preview-wrapper">
                    <DockIcon
                      id={value.id}
                      hasCustomIcon={value.hasCustomIcon}
                      url={value.url}
                      title={value.title}
                    />
                  </div>
                  <div className="input__container link-title">
                    <input
                      id="dock-title"
                      name="Dock link title"
                      value={value.title}
                      placeholder="Example"
                      onChange={(event) => handleInput(event, "title", index)}
                    />
                  </div>
                  <div className="input__container">
                    <input
                      id="dock-link"
                      name="Dock Link"
                      value={value.url}
                      placeholder="https://example.com"
                      onChange={(event) => handleInput(event, "url", index)}
                    />
                  </div>
                  <div className="dock-upload-wrapper">
                    <label
                      htmlFor={`file-upload-${index}`}
                      className={`dock-upload-label button ${
                        value.hasCustomIcon ? "has-remove" : ""
                      }`}
                    >
                      {value.hasCustomIcon ? (
                        <Translation value="change_icon" />
                      ) : (
                        <Translation value="upload_icon" />
                      )}
                    </label>
                    <input
                      id={`file-upload-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, index!)}
                      style={{ display: "none" }}
                    />
                    {value.hasCustomIcon && (
                      <button
                        className="dock-remove-icon button"
                        onClick={() => handleRemoveCustomIcon(index!)}
                        title="Remove custom icon"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <button
                  className="dock-links__delete"
                  onClick={handleDelete(index!)}
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
