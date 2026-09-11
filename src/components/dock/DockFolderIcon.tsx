import React from "react";
import "./DockFolderIcon.css";
import { DockIcon } from "./DockIcon";
import { LinkItem } from "../settings/shared/LinkListEditor";

interface DockFolderIconProps {
  id: string;
  links?: LinkItem[];
  activeSpaceId?: string;
  onClick: () => void;
  title: string;
}

export const DockFolderIcon: React.FC<DockFolderIconProps> = ({
  links = [],
  activeSpaceId,
  onClick,
  title,
}) => {
  // Take up to 9 links for the grid
  const previewLinks = links.slice(0, 9);

  return (
    <button 
      className="dock-site__item folder-icon-container" 
      onClick={onClick}
      data-label={title}
      title={title}
    >
      <div className="folder-icon-grid">
        {previewLinks.map((link) => (
          <div key={link.id} className="folder-icon-minified">
            <DockIcon
              id={link.id}
              hasCustomIcon={link.hasCustomIcon}
              url={link.url}
              title={link.title}
              activeSpaceId={activeSpaceId}
            />
          </div>
        ))}
      </div>
    </button>
  );
};
