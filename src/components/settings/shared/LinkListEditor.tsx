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
  type?: "link" | "folder";
  title: string;
  url: string;
  id: string;
  hasCustomIcon?: boolean;
  links?: LinkItem[];
};

type TranslationKey = keyof (typeof translation)["en"];

interface LinkListEditorProps {
  links: LinkItem[];
  onSave: (links: LinkItem[]) => void;
  emptyMessage: TranslationKey;
  iconDbPrefix: string;
  activeSpaceId?: string;
}

export default function LinkListEditor({
  links,
  onSave,
  emptyMessage,
  iconDbPrefix,
  activeSpaceId,
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
    const linksToSave = currentLinks
      .map((item) => {
        if (item.type === "folder") {
          return {
            ...item,
            links: (item.links || []).filter(
              ({ title, url }) => !!url.trim() && !!title.trim(),
            ),
          };
        }
        return item;
      })
      .filter(({ type, title, url }) =>
        type === "folder" ? !!title.trim() : !!url.trim() && !!title.trim(),
      );

    const currentIds = new Set<string>();
    currentLinks.forEach((site) => {
      currentIds.add(site.id);
      if (site.type === "folder" && site.links) {
        site.links.forEach((subSite) => currentIds.add(subSite.id));
      }
    });

    const allOriginalLinks = links.flatMap((l) =>
      l.type === "folder" ? [l, ...(l.links || [])] : [l],
    );
    const allCurrentLinks = currentLinks.flatMap((l) =>
      l.type === "folder" ? [l, ...(l.links || [])] : [l],
    );

    // Find items that were removed completely
    for (const originalSite of allOriginalLinks) {
      if (!currentIds.has(originalSite.id) && originalSite.hasCustomIcon) {
        await deleteImageFromIndexedDB(
          `${iconDbPrefix}_${originalSite.id}`,
          activeSpaceId,
        );
      }
    }

    // Find items that exist but had their custom icon removed
    for (const currentSite of allCurrentLinks) {
      const originalSite = allOriginalLinks.find(
        (s) => s.id === currentSite.id,
      );
      if (
        originalSite &&
        originalSite.hasCustomIcon &&
        !currentSite.hasCustomIcon
      ) {
        await deleteImageFromIndexedDB(
          `${iconDbPrefix}_${originalSite.id}`,
          activeSpaceId,
        );
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

  const handleAddFolder = () => {
    setChangesActive(true);
    const updatedLinks = [...currentLinks];
    updatedLinks.push({
      type: "folder",
      title: "",
      url: "",
      id: generateRandomId(),
      links: [],
    });
    setCurrentLinks(updatedLinks);
  };

  const handleDelete = (idx: number, nestedIdx?: number) => () => {
    let updatedLinks = [...currentLinks];
    if (
      nestedIdx !== undefined &&
      updatedLinks[idx].type === "folder" &&
      updatedLinks[idx].links
    ) {
      updatedLinks[idx].links = updatedLinks[idx].links!.filter(
        (_, index) => index !== nestedIdx,
      );
    } else {
      updatedLinks = updatedLinks.filter((_, index) => index !== idx);
    }
    setCurrentLinks(updatedLinks);
    setChangesActive(true);
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    idx: number,
    nestedIdx?: number,
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      if (reader.result) {
        const item =
          nestedIdx !== undefined && currentLinks[idx].type === "folder"
            ? currentLinks[idx].links![nestedIdx]
            : currentLinks[idx];

        await saveImageToIndexedDB(
          reader.result as string,
          `${iconDbPrefix}_${item.id}`,
          activeSpaceId,
        );

        const updatedLinks = [...currentLinks];
        if (
          nestedIdx !== undefined &&
          updatedLinks[idx].type === "folder" &&
          updatedLinks[idx].links
        ) {
          updatedLinks[idx].links![nestedIdx] = {
            ...item,
            hasCustomIcon: true,
          };
        } else {
          updatedLinks[idx] = { ...item, hasCustomIcon: true };
        }

        setCurrentLinks(updatedLinks);
        setChangesActive(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomIcon = (idx?: number, nestedIdx?: number) => {
    if (idx === undefined) return;
    const item =
      nestedIdx !== undefined &&
      currentLinks[idx].type === "folder" &&
      currentLinks[idx].links
        ? currentLinks[idx].links![nestedIdx]
        : currentLinks[idx];

    const updatedLinks = [...currentLinks];
    if (
      nestedIdx !== undefined &&
      updatedLinks[idx].type === "folder" &&
      updatedLinks[idx].links
    ) {
      updatedLinks[idx].links![nestedIdx] = { ...item, hasCustomIcon: false };
    } else {
      updatedLinks[idx] = { ...item, hasCustomIcon: false };
    }

    setCurrentLinks(updatedLinks);
    setChangesActive(true);
  };

  const handleInput = (
    e: ChangeEvent<HTMLInputElement>,
    key: "title" | "url",
    idx?: number,
    nestedIdx?: number,
  ) => {
    if (idx === undefined) return;
    setChangesActive(true);
    const updatedLinks = [...currentLinks];

    if (
      nestedIdx !== undefined &&
      updatedLinks[idx].type === "folder" &&
      updatedLinks[idx].links
    ) {
      updatedLinks[idx].links![nestedIdx] = {
        ...updatedLinks[idx].links![nestedIdx],
        [key]: e.target.value,
      };
    } else {
      updatedLinks[idx] = {
        ...updatedLinks[idx],
        [key]: e.target.value,
      };
    }

    setCurrentLinks(updatedLinks);
  };

  const handleMoveToFolder = (linkIndex: number, folderIndex: number) => {
    const updatedLinks = [...currentLinks];
    const link = updatedLinks[linkIndex];
    if (link.type === "folder") return; // Don't nest folders
    const folder = updatedLinks[folderIndex];
    if (!folder || folder.type !== "folder") return;

    // Remove link from root
    updatedLinks.splice(linkIndex, 1);

    // Add to folder
    if (!folder.links) folder.links = [];
    folder.links.push(link);

    setCurrentLinks(updatedLinks);
    setChangesActive(true);
  };

  const handleEjectFromFolder = (folderIndex: number, nestedIdx: number) => {
    const updatedLinks = [...currentLinks];
    const folder = updatedLinks[folderIndex];
    if (!folder || folder.type !== "folder" || !folder.links) return;

    const [ejected] = folder.links.splice(nestedIdx, 1);
    // Insert right after the folder
    updatedLinks.splice(folderIndex + 1, 0, ejected);

    setCurrentLinks(updatedLinks);
    setChangesActive(true);
  };

  const handleNestedReorder = (
    folderIndex: number,
    oldIdx: number,
    newIdx: number,
  ) => {
    if (oldIdx === newIdx) return;
    const updatedLinks = [...currentLinks];
    const folder = updatedLinks[folderIndex];
    if (!folder || folder.type !== "folder" || !folder.links) return;

    const links = [...folder.links];
    const [moved] = links.splice(oldIdx, 1);
    links.splice(newIdx, 0, moved);
    updatedLinks[folderIndex] = { ...folder, links };

    setCurrentLinks(updatedLinks);
    setChangesActive(true);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div>
          <button className="link-editor__add button" onClick={handleAdd}>
            <Translation value="add" />
          </button>
          <button
            className="link-editor__add button"
            onClick={handleAddFolder}
            style={{ marginLeft: "8px" }}
          >
            <Translation value="add_folder" />
          </button>
          {changesActive && (
            <button className="link-editor__done button" onClick={handleDone}>
              <Translation value="done" />
            </button>
          )}
        </div>
        {currentLinks.length > 1 && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--theme-border)",
              marginLeft: "10px",
              textAlign: "right",
            }}
          >
            <Translation value="drag_and_drop_to_reorder_links" />
          </span>
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
              const draggedItem = currentLinks[oldIndex];
              const targetItem = currentLinks[newIndex];
              // If dropping a non-folder link onto a folder, move it into the folder
              if (
                targetItem &&
                targetItem.type === "folder" &&
                draggedItem.type !== "folder" &&
                oldIndex !== newIndex
              ) {
                handleMoveToFolder(oldIndex, newIndex);
              } else {
                setCurrentLinks(arrayMove(currentLinks, oldIndex, newIndex));
                setChangesActive(true);
              }
            }}
            renderList={({ children, props }) => (
              <div className="link-editor__draggable-container" {...props}>
                {children}
              </div>
            )}
            renderItem={({ value, props, index }) => {
              if (value.type === "folder") {
                return (
                  <fieldset
                    className="link-editor-folder-container"
                    {...props}
                    key={value.id}
                    style={{
                      ...(props.style || {}),
                    }}
                  >
                    <legend
                      style={{
                        padding: "0 5px",
                        fontSize: "12px",
                        color: "var(--theme-border)",
                      }}
                    >
                      Folder
                    </legend>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <DraggableIcon
                        className="draggable-indicator"
                        style={{ height: "16px", width: "fit-content" }}
                      />
                      <div
                        className="input__container link-title"
                        style={{ flexGrow: 1 }}
                      >
                        <input
                          value={value.title}
                          placeholder="Folder Name"
                          onChange={(e) => handleInput(e, "title", index)}
                        />
                      </div>
                      <button
                        className="link-editor__delete"
                        onClick={handleDelete(index!)}
                      >
                        <DeleteIcon />
                      </button>
                    </div>

                    {/* Render inner links */}
                    {value.links &&
                      value.links.map((link, nestedIdx) => (
                        <div
                          key={link.id}
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            marginLeft: "10px",
                            marginBottom: "5px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              flexShrink: 0,
                            }}
                          >
                            {nestedIdx > 0 && (
                              <button
                                onClick={() =>
                                  handleNestedReorder(
                                    index!,
                                    nestedIdx,
                                    nestedIdx - 1,
                                  )
                                }
                                title="Move up"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "20px",
                                  height: "14px",
                                  padding: "0",
                                  border: "none",
                                  background: "transparent",
                                  color: "var(--theme-clr)",
                                  cursor: "pointer",
                                  opacity: 0.7,
                                }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 4l-8 8h16z" />
                                </svg>
                              </button>
                            )}
                            {nestedIdx < (value.links?.length || 0) - 1 && (
                              <button
                                onClick={() =>
                                  handleNestedReorder(
                                    index!,
                                    nestedIdx,
                                    nestedIdx + 1,
                                  )
                                }
                                title="Move down"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "20px",
                                  height: "14px",
                                  padding: "0",
                                  border: "none",
                                  background: "transparent",
                                  color: "var(--theme-clr)",
                                  cursor: "pointer",
                                  opacity: 0.7,
                                }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 20l8-8H4z" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handleEjectFromFolder(index!, nestedIdx)
                            }
                            title="Move out of folder"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                              padding: "0",
                              border: "1px solid var(--theme-border)",
                              borderRadius: "4px",
                              background: "transparent",
                              color: "var(--theme-clr)",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M7 11l5-5 5 5" />
                              <path d="M12 6v10" />
                              <rect
                                x="3"
                                y="18"
                                width="18"
                                height="2"
                                rx="1"
                                fill="currentColor"
                                stroke="none"
                              />
                            </svg>
                          </button>
                          <div
                            className="link-editor-preview-wrapper"
                            style={{ flexShrink: 0 }}
                          >
                            <DockIcon
                              id={link.id}
                              hasCustomIcon={link.hasCustomIcon}
                              url={link.url}
                              title={link.title}
                              iconDbPrefix={iconDbPrefix}
                              activeSpaceId={activeSpaceId}
                            />
                          </div>
                          <div
                            className="input__container link-title"
                            style={{ flexGrow: 1 }}
                          >
                            <input
                              value={link.title}
                              placeholder="Example"
                              onChange={(e) =>
                                handleInput(e, "title", index, nestedIdx)
                              }
                            />
                          </div>
                          <div
                            className="input__container"
                            style={{ flexGrow: 1 }}
                          >
                            <input
                              value={link.url}
                              placeholder="https://example.com"
                              onChange={(e) =>
                                handleInput(e, "url", index, nestedIdx)
                              }
                            />
                          </div>
                          <div
                            className="link-editor-upload-wrapper"
                            style={{ flexShrink: 0 }}
                          >
                            <label
                              htmlFor={`file-upload-${iconDbPrefix}-${index}-${nestedIdx}`}
                              className={`link-editor-upload-label button ${link.hasCustomIcon ? "has-remove" : ""}`}
                            >
                              {link.hasCustomIcon ? (
                                <Translation value="change_icon" />
                              ) : (
                                <Translation value="upload_icon" />
                              )}
                            </label>
                            <input
                              id={`file-upload-${iconDbPrefix}-${index}-${nestedIdx}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleFileUpload(e, index!, nestedIdx)
                              }
                              style={{ display: "none" }}
                            />
                            {link.hasCustomIcon && (
                              <button
                                className="link-editor-remove-icon button"
                                onClick={() =>
                                  handleRemoveCustomIcon(index!, nestedIdx)
                                }
                                title="Remove custom icon"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <button
                            className="link-editor__delete"
                            onClick={handleDelete(index!, nestedIdx)}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      ))}
                    <div
                      style={{
                        marginLeft: "10px",
                        marginTop: "10px",
                        color: "var(--theme-border)",
                        fontSize: "11px",
                        padding: "6px",
                        textAlign: "center",
                      }}
                    >
                      Drag links onto this folder to add them
                    </div>
                  </fieldset>
                );
              }

              return (
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
                        activeSpaceId={activeSpaceId}
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
              );
            }}
          />
        ) : (
          <Translation value={emptyMessage} />
        )}
      </div>
    </>
  );
}
