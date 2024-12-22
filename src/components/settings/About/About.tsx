import React from "react";
import "./About.css";
import { ReactComponent as ExtensionLogo } from "../../../assets/extension-logo.svg";

export default function About() {
  return (
    <div className="about__container">
      <div className="about__content">
        <ExtensionLogo />
        <div className="about__info-container">
          <div className="about__row-item">
            Extension Name
            <div>Mac New Tab</div>
          </div>
          <div className="about__row-item">
            Version
            <div>{process.env.REACT_APP_VERSION}</div>
          </div>
          <div className="about__row-item">
            Github
            <a
              rel="noreferrer"
              href="https://github.com/Amith-B/macnewtab"
              target="_blank"
            >
              Amith-B/macnewtab
            </a>
          </div>
          <div className="about__row-item">
            Bug Report Link
            <a
              rel="noreferrer"
              href="https://github.com/Amith-B/macnewtab"
              target="_blank"
            >
              Amith-B/macnewtab/issues
            </a>
          </div>
          <div className="about__row-item">
            Developer Info
            <div>
              Amith B(
              <a rel="noreferrer" href="mailto:amithbr6@gmail.com">
                amithbr6@gmail.com
              </a>
              )
            </div>
          </div>
          <div className="about__row-item">
            Supported Browsers
            <div>Chrome</div>
          </div>
          <div className="about__row-item">
            Permissions Needed
            <div>topSites (to access top visited sites)</div>
          </div>
          <div className="about__row-item">
            Third-Party Libraries Used
            <div>React 19</div>
          </div>
        </div>
      </div>
      &copy; 2025 Amith B. All Rights Reserved.
    </div>
  );
}
