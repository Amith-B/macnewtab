import React from "react";
import "./App.css";
import Clock1 from "./widgets/clock-1/Clock1";
import Calendar1 from "./widgets/day-calendar/Calendar1";
import Search from "./widgets/search/Search";

function App() {
  return (
    <>
      <Clock1 />
      <Calendar1 />
      <Search />
    </>
  );
}

export default App;
