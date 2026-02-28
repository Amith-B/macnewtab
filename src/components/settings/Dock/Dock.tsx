import { memo, useContext } from "react";
import "./Dock.css";
import { AppContext } from "../../../context/provider";
import { DockPosition, dockPositions } from "../../../static/dockSites";
import Translation from "../../../locale/Translation";
import { Select } from "../../select/Select";
import Toggle from "../../toggle/Toggle";
import LinkListEditor from "../shared/LinkListEditor";

export default memo(function Dock() {
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
          "dock-links__position" + (!dockBarSites.length ? " disabled" : "")
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
      <LinkListEditor
        links={dockBarSites}
        onSave={handleDockSitesChange}
        emptyMessage="add_dock_links"
        iconDbPrefix="dock_icon"
      />
    </div>
  );
});
