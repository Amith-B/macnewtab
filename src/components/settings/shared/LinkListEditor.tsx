import React, { ChangeEvent, useRef, useState } from "react";
import { List, arrayMove } from "react-movable";
import { ReactComponent as DeleteIcon } from "../../../assets/delete-icon.svg";
import { ReactComponent as DraggableIcon } from "../Dock/draggable.svg";
import { DockIcon } from "../../dock/DockIcon";
import Translation from "../../../locale/Translation";
import { generateRandomId } from "../../../utils/random";
import {
  saveImageToIndexedDB,
  deleteImageFromIndexedDB,
} from "../../../utils/db";
import { translation } from "../../../locale/languages";
import "./LinkListEditor.css";

export type LinkItem = {
  title: string;
  url: string;
  id: string;
  hasCustomIcon?: boolean;
};

type TranslationKey = keyof (typeof translation)["en"];

interface LinkListEditorProps {
  links: LinkItem[];
  onSave: (links: LinkItem[]) => void;
  emptyMessage: TranslationKey;
  iconDbPrefix: string;
}

export default function LinkListEditor({
  links,
  onSave,
  emptyMessage,
  iconDbPrefix,
}: LinkListEditorProps) {
  const [changesActive, setChangesActive] = useState(false);
  const [currentLinks, setCurrentLinks] = useState(links);
  const prevLinksRef = useRef(links);

  // Only sync when the parent genuinely passes new links (e.g., after save)
  if (prevLinksRef.current !== links) {
    prevLinksRef.current = links;
    setCurrentLinks(links);
  }

  const handleDone = async () => {
    // Capture the data to save BEFORE any state updates that could trigger re-renders
    const linksToSave = currentLinks.filter(
      ({ title, url }) => !!url.trim() && !!title.trim(),
    );

    const currentIds = new Set(currentLinks.map((site) => site.id));

    // Find items that were removed completely
    for (const originalSite of links) {
      if (!currentIds.has(originalSite.id) && originalSite.hasCustomIcon) {
        await deleteImageFromIndexedDB(`${iconDbPrefix}_${originalSite.id}`);
      }
    }

    // Find items that exist but had their custom icon removed
    for (const currentSite of currentLinks) {
      const originalSite = links.find((s) => s.id === currentSite.id);
      if (
        originalSite &&
        originalSite.hasCustomIcon &&
        !currentSite.hasCustomIcon
      ) {
        await deleteImageFromIndexedDB(`${iconDbPrefix}_${originalSite.id}`);
      }
    }

    setChangesActive(false);
    onSave(linksToSave);
  };

  const handleAdd = () => {
    setChangesActive(true);
    const updatedLinks = [...currentLinks];
    updatedLinks.push({ title: "", url: "", id: generateRandomId() });
    setCurrentLinks(updatedLinks);
  };

  const handleDelete = (idx: number) => () => {
    const updatedLinks = currentLinks.filter((_, index) => index !== idx);
    setCurrentLinks(updatedLinks);
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
        const item = currentLinks[idx];
        await saveImageToIndexedDB(
          reader.result as string,
          `${iconDbPrefix}_${item.id}`,
        );

        const updatedLinks = [...currentLinks];
        updatedLinks[idx] = {
          ...item,
          hasCustomIcon: true,
        };
        setCurrentLinks(updatedLinks);
        setChangesActive(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomIcon = (idx?: number) => {
    if (idx === undefined) return;
    const item = currentLinks[idx];

    const updatedLinks = [...currentLinks];
    updatedLinks[idx] = {
      ...item,
      hasCustomIcon: false,
    };
    setCurrentLinks(updatedLinks);
    setChangesActive(true);
  };

  const handleInput = (
    e: ChangeEvent<HTMLInputElement>,
    key: "title" | "url",
    idx?: number,
  ) => {
    setChangesActive(true);
    const updatedLinks = currentLinks.map((item, index) => {
      if (index === idx) {
        return {
          ...item,
          [key]: e.target.value,
        };
      }
      return item;
    });

    setCurrentLinks(updatedLinks);
  };

  return (
    <>
      <div>
        <button className="link-editor__add button" onClick={handleAdd}>
          <Translation value="add" />
        </button>
        {changesActive && (
          <button className="link-editor__done button" onClick={handleDone}>
            <Translation value="done" />
          </button>
        )}
      </div>
      <div
        className={
          "link-editor__list-container" +
          (!currentLinks.length ? " center" : "")
        }
      >
        {currentLinks.length ? (
          <List
            lockVertically
            values={currentLinks}
            onChange={({ oldIndex, newIndex }) => {
              setCurrentLinks(arrayMove(currentLinks, oldIndex, newIndex));
              setChangesActive(true);
            }}
            renderList={({ children, props }) => (
              <div className="link-editor__draggable-container" {...props}>
                {children}
              </div>
            )}
            renderItem={({ value, props, index }) => (
              <div
                className="link-editor-input__container draggable"
                {...props}
                key={value.id}
              >
                <div className="link-editor-input-group">
                  <DraggableIcon
                    className="draggable-indicator"
                    style={{
                      height: "16px",
                      width: "fit-content",
                    }}
                  />
                  <div className="link-editor-preview-wrapper">
                    <DockIcon
                      id={value.id}
                      hasCustomIcon={value.hasCustomIcon}
                      url={value.url}
                      title={value.title}
                      iconDbPrefix={iconDbPrefix}
                    />
                  </div>
                  <div className="input__container link-title">
                    <input
                      id="link-title"
                      name="Link title"
                      value={value.title}
                      placeholder="Example"
                      onChange={(event) => handleInput(event, "title", index)}
                    />
                  </div>
                  <div className="input__container">
                    <input
                      id="link-url"
                      name="Link URL"
                      value={value.url}
                      placeholder="https://example.com"
                      onChange={(event) => handleInput(event, "url", index)}
                    />
                  </div>
                  <div className="link-editor-upload-wrapper">
                    <label
                      htmlFor={`file-upload-${iconDbPrefix}-${index}`}
                      className={`link-editor-upload-label button ${
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
                      id={`file-upload-${iconDbPrefix}-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, index!)}
                      style={{ display: "none" }}
                    />
                    {value.hasCustomIcon && (
                      <button
                        className="link-editor-remove-icon button"
                        onClick={() => handleRemoveCustomIcon(index!)}
                        title="Remove custom icon"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <button
                  className="link-editor__delete"
                  onClick={handleDelete(index!)}
                >
                  <DeleteIcon />
                </button>
              </div>
            )}
          />
        ) : (
          <Translation value={emptyMessage} />
        )}
      </div>
    </>
  );
}
