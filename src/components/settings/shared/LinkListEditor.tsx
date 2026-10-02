import React, {
  ChangeEvent,
  useRef,
  useState,
  useEffect,
  useContext,
} from "react";
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
import { AppContext } from "../../../context/provider";
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
  allowFolder?: boolean;
}

export default function LinkListEditor({
  links,
  onSave,
  emptyMessage,
  iconDbPrefix,
  activeSpaceId,
  allowFolder,
}: LinkListEditorProps) {
  const { locale } = useContext(AppContext);
  const [changesActive, setChangesActive] = useState(false);
  const [currentLinks, setCurrentLinks] = useState(links);
  const prevLinksRef = useRef(links);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const unsavedIconKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      if (!containerRef.current) return;

      const isDragging = !!document.querySelector(".is-being-dragged");
      const folderElements = containerRef.current.querySelectorAll(
        ".link-editor-folder-container",
      );

      folderElements.forEach((el) => {
        if (!isDragging) {
          el.classList.remove("folder-drag-hover");
          return;
        }

        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left + 10 &&
          e.clientX <= rect.right - 10 &&
          e.clientY >= rect.top + 10 &&
          e.clientY <= rect.bottom - 10
        ) {
          el.classList.add("folder-drag-hover");
        } else {
          el.classList.remove("folder-drag-hover");
        }
      });
    };
    window.addEventListener("pointermove", handlePointerMove);
    const container = containerRef.current;
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      // Clean up any stray classes on unmount
      if (container) {
        container
          .querySelectorAll(".link-editor-folder-container")
          .forEach((el) => el.classList.remove("folder-drag-hover"));
      }
    };
  }, []);

  // Clean up unsaved icon uploads on unmount
  useEffect(() => {
    const iconKeys = unsavedIconKeys.current;
    return () => {
      iconKeys.forEach((key) => {
        deleteImageFromIndexedDB(key, activeSpaceId);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            links: (item.links || []).filter(({ url }) => !!url.trim()),
          };
        }
        return item;
      })
      .filter(({ type, url }) => (type === "folder" ? true : !!url.trim()));

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
    unsavedIconKeys.current.clear();
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
      const newFolder = { ...updatedLinks[idx] };
      newFolder.links = newFolder.links!.filter(
        (_, index) => index !== nestedIdx,
      );
      updatedLinks[idx] = newFolder;
    } else {
      const item = updatedLinks[idx];
      if (item.type === "folder" && item.links && item.links.length > 0) {
        // Eject child links into root at the folder's position
        updatedLinks.splice(idx, 1, ...item.links);
      } else {
        updatedLinks = updatedLinks.filter((_, index) => index !== idx);
      }
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

        const iconKey = `${iconDbPrefix}_${item.id}`;
        await saveImageToIndexedDB(
          reader.result as string,
          iconKey,
          activeSpaceId,
        );
        // Track this upload so we can clean it up if the user doesn't save
        if (!item.hasCustomIcon) {
          unsavedIconKeys.current.add(iconKey);
        }

        const updatedLinks = [...currentLinks];
        if (
          nestedIdx !== undefined &&
          updatedLinks[idx].type === "folder" &&
          updatedLinks[idx].links
        ) {
          const newFolder = { ...updatedLinks[idx] };
          const newLinks = [...newFolder.links!];
          newLinks[nestedIdx] = { ...item, hasCustomIcon: true };
          newFolder.links = newLinks;
          updatedLinks[idx] = newFolder;
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
      const newFolder = { ...updatedLinks[idx] };
      const newLinks = [...newFolder.links!];
      newLinks[nestedIdx] = { ...item, hasCustomIcon: false };
      newFolder.links = newLinks;
      updatedLinks[idx] = newFolder;
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
      const newFolder = { ...updatedLinks[idx] };
      const newLinks = [...newFolder.links!];
      newLinks[nestedIdx] = { ...newLinks[nestedIdx], [key]: e.target.value };
      newFolder.links = newLinks;
      updatedLinks[idx] = newFolder;
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

    const newFolderIdx =
      linkIndex < folderIndex ? folderIndex - 1 : folderIndex;
    const newFolder = { ...updatedLinks[newFolderIdx] };
    newFolder.links = [...(newFolder.links || []), link];
    updatedLinks[newFolderIdx] = newFolder;

    setCurrentLinks(updatedLinks);
    setChangesActive(true);
  };

  const handleEjectFromFolder = (folderIndex: number, nestedIdx: number) => {
    const updatedLinks = [...currentLinks];
    const folder = updatedLinks[folderIndex];
    if (!folder || folder.type !== "folder" || !folder.links) return;

    const newFolder = { ...folder };
    newFolder.links = [...folder.links];
    const [ejected] = newFolder.links.splice(nestedIdx, 1);
    updatedLinks[folderIndex] = newFolder;
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
    <div ref={containerRef} style={{ display: "contents" }}>
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
            <Translation value="add_link" />
          </button>
          {allowFolder && (
            <button
              className="link-editor__add button"
              onClick={handleAddFolder}
            >
              <Translation value="add_folder" />
            </button>
          )}
          {changesActive && (
            <button
              className="link-editor__done button button-primary"
              onClick={handleDone}
            >
              <Translation value="done" />
            </button>
          )}
        </div>
        {currentLinks.length > 1 && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--theme-clr)",
              opacity: 0.6,
              marginLeft: "10px",
              textAlign: "right",
            }}
          >
            <Translation value="drag_and_drop_to_reorder_links" />
          </span>
        )}
      </div>
      {currentLinks.length ? (
        <List
          lockVertically
          values={currentLinks}
          onChange={({ oldIndex, newIndex }) => {
            const { x, y } = lastMousePos.current;

            // Find if mouse is over any folder
            const folderElements = containerRef.current
              ? containerRef.current.querySelectorAll(
                  ".link-editor-folder-container",
                )
              : [];
            let droppedOnFolderIndex = -1;

            folderElements.forEach((el) => {
              const rect = el.getBoundingClientRect();
              // Add a small threshold (e.g. 10px) to make sure they are well inside the folder to avoid accidental drops
              if (
                x >= rect.left + 10 &&
                x <= rect.right - 10 &&
                y >= rect.top + 10 &&
                y <= rect.bottom - 10
              ) {
                const idx = parseInt(
                  el.getAttribute("data-folder-index") || "-1",
                  10,
                );
                if (idx !== -1 && idx !== oldIndex) {
                  droppedOnFolderIndex = idx;
                }
              }
            });
            if (
              droppedOnFolderIndex !== -1 &&
              currentLinks[oldIndex]?.type !== "folder"
            ) {
              handleMoveToFolder(oldIndex, droppedOnFolderIndex);
            } else {
              setCurrentLinks(arrayMove(currentLinks, oldIndex, newIndex));
              setChangesActive(true);
            }
          }}
          renderList={({ children, props }) => (
            <div className="link-editor__list-container" {...props}>
              {children}
            </div>
          )}
          renderItem={({ value, props, index, isDragged }) => {
            if (value.type === "folder") {
              return (
                <fieldset
                  className="link-editor-folder-container draggable"
                  data-folder-index={index}
                  {...props}
                  key={value.id}
                  style={{
                    ...(props.style || {}),
                    pointerEvents: isDragged ? "none" : "auto",
                  }}
                >
                  <legend
                    style={{
                      padding: "0 5px",
                      fontSize: "12px",
                      color: "var(--theme-clr)",
                      fontWeight: 600,
                      opacity: 0.6,
                    }}
                  >
                    <Translation value="folder" />
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
                      style={{
                        height: "16px",
                        width: "fit-content",
                      }}
                    />
                    <div className="input__container link-title">
                      <input
                        id="folder-title"
                        name={
                          translation[locale]?.folder_name_placeholder ||
                          "Folder title"
                        }
                        value={value.title}
                        placeholder={
                          translation[locale]?.folder_name_placeholder ||
                          "Folder Name"
                        }
                        onChange={(event) =>
                          handleInput(event, "title", index!)
                        }
                      />
                    </div>
                    <button
                      className="link-editor__delete"
                      onClick={handleDelete(index!)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>

                  {value.links &&
                    value.links.map((link, nestedIdx) => (
                      <div
                        className="link-editor-input__container"
                        key={link.id}
                        style={{ padding: "8px 12px", marginBottom: "8px" }}
                      >
                        <div className="link-editor-input-group">
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
                                title={
                                  translation[locale]?.move_up || "Move up"
                                }
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
                                  width="16"
                                  height="16"
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
                                title={
                                  translation[locale]?.move_down || "Move down"
                                }
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
                                  width="16"
                                  height="16"
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
                            title={
                              translation[locale]?.move_out_of_folder ||
                              "Move out of folder"
                            }
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
                              width="16"
                              height="16"
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
                          <div className="link-editor-preview-wrapper">
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
                            style={{ width: "80px" }}
                          >
                            <input
                              id="link-title"
                              name="Link title"
                              value={link.title}
                              placeholder="Example"
                              onChange={(event) =>
                                handleInput(event, "title", index!, nestedIdx)
                              }
                            />
                          </div>
                          <div
                            className="input__container"
                            style={{ width: "140px" }}
                          >
                            <input
                              id="link-url"
                              name="Link URL"
                              value={link.url}
                              placeholder="https://example.com"
                              onChange={(event) =>
                                handleInput(event, "url", index!, nestedIdx)
                              }
                            />
                          </div>
                          <div className="link-editor-upload-wrapper">
                            <label
                              htmlFor={`file-upload-${iconDbPrefix}-${index}-${nestedIdx}`}
                              className={`link-editor-upload-label button ${
                                link.hasCustomIcon ? "has-remove" : ""
                              }`}
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
                      </div>
                    ))}
                  <div
                    style={{
                      marginLeft: "10px",
                      marginTop: "10px",
                      color: "var(--theme-clr)",
                      opacity: 0.6,
                      fontSize: "11px",
                      padding: "6px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    <Translation value="drag_links_to_folder" />
                  </div>
                </fieldset>
              );
            }

            return (
              <div
                className={`link-editor-input__container draggable ${isDragged ? "is-being-dragged" : ""}`}
                {...props}
                key={value.id}
                style={{
                  ...(props.style || {}),
                  pointerEvents: isDragged ? "none" : "auto",
                }}
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
                      onChange={(event) => handleInput(event, "title", index!)}
                    />
                  </div>
                  <div className="input__container">
                    <input
                      id="link-url"
                      name="Link URL"
                      value={value.url}
                      placeholder="https://example.com"
                      onChange={(event) => handleInput(event, "url", index!)}
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
        <div className="link-editor__list-container center">
          <Translation value={emptyMessage} />
        </div>
      )}
    </div>
  );
}
