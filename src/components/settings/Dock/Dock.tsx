import React, { memo, useContext } from "react";
import "./Dock.css";
import { AppContext } from "../../../context/provider";

export default memo(function Dock() {
  const { dockBarSites } = useContext(AppContext);
  return (
    <div className="dock-links__container">
      <button className="dock-links__add">Add</button>
      <div
        className={"dock-links__list" + (!dockBarSites.length ? " center" : "")}
      >
        {dockBarSites.length ? <></> : <p>Add Links to Dock</p>}
      </div>
    </div>
  );
});
