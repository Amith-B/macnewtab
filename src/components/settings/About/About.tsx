import React from "react";
import "./About.css";
import { ReactComponent as ExtensionLogo } from "../../../assets/extension-logo.svg";
import Translation from "../../../locale/Translation";

export default function About() {
  return (
    <div className="about__container">
      <div className="about__content">
        <ExtensionLogo />
        <div className="about__info-container">
          <div className="about__row-item">
            <Translation value="extension_name" />
            <div>Mac New Tab</div>
          </div>
          <div className="about__row-item">
            Version
            <div>{process.env.REACT_APP_VERSION}</div>
          </div>
          <div className="about__row-item">
            <Translation value="github" />
            <a
              rel="noreferrer"
              href="https://github.com/Amith-B/macnewtab"
              target="_blank"
            >
              Amith-B/macnewtab
            </a>
          </div>
          <div className="about__row-item">
            <Translation value="bug_report_link" />
            <a
              rel="noreferrer"
              href="https://github.com/Amith-B/macnewtab/issues"
              target="_blank"
            >
              Amith-B/macnewtab/issues
            </a>
          </div>
          <div className="about__row-item">
            <Translation value="developer_info" />
            <div>
              Amith B(
              <a rel="noreferrer" href="mailto:amithbr6@gmail.com">
                amithbr6@gmail.com
              </a>
              )
            </div>
          </div>
          <div className="about__row-item">
            <Translation value="supported_browsers" />
            <div>Chrome</div>
          </div>
          <div className="about__row-item">
            <Translation value="permissions_needed" />
            <div>topSites, search</div>
          </div>
          <div className="about__row-item">
            <Translation value="third_party_libraries" />
            <div>React 19</div>
          </div>
        </div>
      </div>
      &copy; 2024 - 2025 {<Translation value="copyright" />}
    </div>
  );
}
