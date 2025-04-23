import { useEffect, useState } from "react";
import "./Changelog.css";

export default function Changelog() {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/CHANGELOG.md")
      .then((res) => res.text())
      .then(setMarkdown);
  }, []);

  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, idx) => {
      if (line.startsWith("## ")) {
        return <h2 key={idx}>{line.replace("## ", "")}</h2>;
      } else if (line.startsWith("- ")) {
        return <li key={idx}>{line.replace("- ", "")}</li>;
      } else if (line.trim() === "") {
        return <br key={idx} />;
      } else {
        return <p key={idx}>{line}</p>;
      }
    });
  };

  return (
    <div className="changelog-container">
      <div className="changelog-content">{renderMarkdown(markdown)}</div>
    </div>
  );
}
