import { memo, useContext } from "react";
import "./Dock.css";
import { AppContext } from "../../../context/provider";
import { DockPosition, dockPositions } from "../../../static/dockSites";
import Translation from "../../../locale/Translation";
import { Select } from "../../select/Select";
import Toggle from "../../toggle/Toggle";
import LinkListEditor from "../shared/LinkListEditor";
import { ReactComponent as TodoIcon } from "../../../assets/todo.svg";
import { ReactComponent as StickyNotesIcon } from "../../../assets/sticky-notes.svg";
import { ReactComponent as FocusIcon } from "../../../assets/focus.svg";
import { ReactComponent as FreeformIcon } from "../../../assets/freeform.svg";

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
    enableStickyNotesSync,
    setEnableStickyNotesSync,
    showFocusMode,
    setShowFocusMode,
    showFreeform,
    setShowFreeform,
  } = useContext(AppContext);

  return (
    <div className="dock-links__container">
      <div className="dock-app__toggle">
        <div className="dock-app__toggle-info">
          <div className="dock-app__icon">
            <TodoIcon />
          </div>
          <span>
            <h3 className="dock-app__toggle-title">
              <Translation value="todo_toggle_title" />
            </h3>
            <h4 className="dock-app__toggle-description">
              <Translation value="todo_toggle_description" />
            </h4>
          </span>
        </div>
        <Toggle
          id={"todo-dock-toggle"}
          isChecked={todoListVisbility}
          handleToggleChange={() => setTodoListVisbility(!todoListVisbility)}
        />
      </div>
      <div className="dock-app__toggle no-border">
        <div className="dock-app__toggle-info">
          <div className="dock-app__icon">
            <StickyNotesIcon />
          </div>
          <Translation value="show_sticky_notes" />
        </div>
        <Toggle
          id={"sticky-notes-toggle"}
          name="Sticky notes toggle"
          isChecked={showStickyNotes}
          handleToggleChange={() => setShowStickyNotes(!showStickyNotes)}
        />
      </div>
      <div
        className={
          "dock-app__toggle sub-toggle" + (!showStickyNotes ? " disabled" : "")
        }
      >
        <div className="dock-app__toggle-info">
          <span>
            <h3 className="dock-app__toggle-title">
              <Translation value="enable_sticky_notes_sync" />
            </h3>
            <h4 className="dock-app__toggle-description">
              <Translation value="enable_sticky_notes_sync_description" />
            </h4>
          </span>
        </div>
        <Toggle
          id={"enable-sticky-notes-sync-toggle"}
          name="Enable sticky notes sync toggle"
          isChecked={enableStickyNotesSync}
          handleToggleChange={() =>
            setEnableStickyNotesSync(!enableStickyNotesSync)
          }
        />
      </div>
      <div className="dock-app__toggle">
        <div className="dock-app__toggle-info">
          <div className="dock-app__icon">
            <FocusIcon />
          </div>
          <Translation value="show_focus_mode" />
        </div>
        <Toggle
          id={"focus-mode-toggle"}
          name="Focus mode toggle"
          isChecked={showFocusMode}
          handleToggleChange={() => setShowFocusMode(!showFocusMode)}
        />
      </div>
      <div className="dock-app__toggle">
        <div className="dock-app__toggle-info">
          <div className="dock-app__icon">
            <FreeformIcon />
          </div>
          <Translation value="show_freeform" />
        </div>
        <Toggle
          id={"freeform-toggle"}
          name="Freeform toggle"
          isChecked={showFreeform}
          handleToggleChange={() => setShowFreeform(!showFreeform)}
        />
      </div>
      <div className={"dock-links__position"}>
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
