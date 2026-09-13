import React, { useEffect, useRef } from "react";
import "./DockFolderModal.css";
import { DockIcon } from "./DockIcon";
import { LinkItem } from "../settings/shared/LinkListEditor";

interface DockFolderModalProps {
  title: string;
  links?: LinkItem[];
  activeSpaceId?: string;
  onClose: () => void;
  separatePageSite?: boolean;
}

export const DockFolderModal: React.FC<DockFolderModalProps> = ({
  title,
  links = [],
  activeSpaceId,
  onClose,
  separatePageSite,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="dock-folder-modal-overlay">
      <div className="dock-folder-modal" ref={modalRef}>
        <div className="dock-folder-modal-header">
          <h2>{title}</h2>
        </div>
        <div className="dock-folder-modal-grid">
          {links.map((item) => {
            let anchorProps = {};
            try {
              new URL(item.url);
              anchorProps = {
                href: item.url,
                target: separatePageSite ? "_blank" : "_self",
              };
            } catch (error) {
              if (!/^https?:\/\//i.test(item.url)) {
                try {
                  new URL("https://" + item.url);
                } catch (_) {}
              }
              anchorProps = {
                tabIndex: 0,
                onClick: () => {
                  if (!chrome?.search?.query) return;
                  chrome.search.query({ text: item.url });
                },
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === "Enter") {
                    if (!chrome?.search?.query) return;
                    chrome.search.query({ text: item.url });
                  }
                },
              };
            }

            return (
              <div key={item.id} className="dock-folder-modal-item">
                <a
                  rel="noreferrer"
                  className="dock-site__item with-link"
                  data-label={item.title}
                  title={item.title}
                  {...anchorProps}
                >
                  <DockIcon
                    id={item.id}
                    hasCustomIcon={item.hasCustomIcon}
                    url={item.url}
                    title={item.title}
                    activeSpaceId={activeSpaceId}
                  />
                </a>
                <span className="dock-folder-modal-item-title">
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
