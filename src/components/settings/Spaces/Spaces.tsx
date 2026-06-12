import {
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Spaces.css";
import { ReactComponent as SpacesIcon } from "../spaces.svg";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import Toggle from "../../toggle/Toggle";
import {
  Space,
  SpacesConfig,
  DEFAULT_SPACE_COLORS,
} from "../../../static/spacesSettings";
import { validateTimeRanges } from "../../../utils/spacesStorage";
import { TimeRangeSlider } from "./TimeRangeSlider";

const Spaces = memo(function Spaces() {
  const {
    spacesConfig,
    handleEnableSpaces,
    handleSwitchSpace,
    handleCreateSpace,
    handleDeleteSpace,
    handleUpdateSpace,
    handleUpdateSpacesConfig,
  } = useContext(AppContext);

  // ─── Local UI State ───
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState(DEFAULT_SPACE_COLORS[0]);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [colorPickerSpaceId, setColorPickerSpaceId] = useState<string | null>(
    null,
  );
  const [deleteConfirmSpaceId, setDeleteConfirmSpaceId] = useState<
    string | null
  >(null);

  const editInputRef = useRef<HTMLInputElement>(null);

  // ─── Time range validation ───
  const timeValidation = useMemo(() => {
    if (!spacesConfig) return { valid: true, conflicts: [] };
    return validateTimeRanges(spacesConfig.spaces);
  }, [spacesConfig]);

  // ─── Handlers ───

  const handleAddSpace = useCallback(() => {
    if (!newSpaceName.trim()) return;
    handleCreateSpace(newSpaceName.trim(), newSpaceColor);
    setNewSpaceName("");
    setNewSpaceColor(
      DEFAULT_SPACE_COLORS[
        (spacesConfig?.spaces.length || 0) % DEFAULT_SPACE_COLORS.length
      ],
    );
    setShowAddForm(false);
  }, [newSpaceName, newSpaceColor, handleCreateSpace, spacesConfig]);

  const startEditing = useCallback((space: Space) => {
    setEditingSpaceId(space.id);
    setEditingName(space.name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const finishEditing = useCallback(
    (space: Space) => {
      if (editingName.trim() && editingName.trim() !== space.name) {
        handleUpdateSpace({ ...space, name: editingName.trim() });
      }
      setEditingSpaceId(null);
      setEditingName("");
    },
    [editingName, handleUpdateSpace],
  );

  const handleColorChange = useCallback(
    (space: Space, color: string) => {
      handleUpdateSpace({ ...space, color });
      setColorPickerSpaceId(null);
    },
    [handleUpdateSpace],
  );

  // Derive whether any space has time-sensitive enabled (for UI display)
  const hasAnyTimeSensitive = useMemo(() => {
    if (!spacesConfig) return false;
    return spacesConfig.spaces.some((s) => s.isTimeSensitive);
  }, [spacesConfig]);

  // Toggle time-sensitive for a space and atomically sync the master flag
  const handleTimeSensitiveToggle = useCallback(
    (space: Space) => {
      if (!spacesConfig) return;
      const updatedSpace: Space = {
        ...space,
        isTimeSensitive: !space.isTimeSensitive,
        timeRange: !space.isTimeSensitive
          ? { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 }
          : undefined,
      };
      const updatedSpaces = spacesConfig.spaces.map((s) =>
        s.id === updatedSpace.id ? updatedSpace : s,
      );
      const anyEnabled = updatedSpaces.some((s) => s.isTimeSensitive);
      const updatedConfig: SpacesConfig = {
        ...spacesConfig,
        spaces: updatedSpaces,
        timeSensitiveEnabled: anyEnabled,
      };
      handleUpdateSpacesConfig(updatedConfig);
    },
    [spacesConfig, handleUpdateSpacesConfig],
  );

  const confirmDelete = useCallback(() => {
    if (deleteConfirmSpaceId) {
      handleDeleteSpace(deleteConfirmSpaceId);
      setDeleteConfirmSpaceId(null);
    }
  }, [deleteConfirmSpaceId, handleDeleteSpace]);

  // ─── Render: Not Enabled ───
  if (!spacesConfig) {
    return (
      <div className="spaces__container">
        <div className="spaces__empty-state">
          <div className="spaces__empty-icon">
            <SpacesIcon />
          </div>
          <h3 className="spaces__empty-title">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              <Translation value="spaces" />
              <span className="beta-capsule">Beta</span>
            </span>
          </h3>
          <p className="spaces__empty-description">
            <Translation value="spaces_description" />
          </p>
          <button className="spaces__enable-btn" onClick={handleEnableSpaces}>
            <Translation value="spaces_enable" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Enabled ───
  return (
    <>
      <div className="spaces__container">
        {/* Header Row */}
        {spacesConfig.spaces.length > 1 && (
          <div className="spaces__header">
            <span
              className="spaces__header-label"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Translation value="spaces" />
              <span className="beta-capsule">Beta</span>
            </span>
            <span className="spaces__header-label spaces__header-schedule">
              <Translation value="spaces_time_sensitive" />
            </span>
          </div>
        )}

        {/* Space List */}
        <ul className="spaces__list">
          {spacesConfig.spaces.map((space) => {
            const isActive = space.id === spacesConfig.activeSpaceId;
            const isEditing = editingSpaceId === space.id;
            const showColorPicker = colorPickerSpaceId === space.id;
            const showMultipleSpaces = spacesConfig.spaces.length > 1;

            return (
              <li
                key={space.id}
                className="spaces__item"
                onClick={() => {
                  if (!isActive && !isEditing) {
                    handleSwitchSpace(space.id);
                  }
                }}
              >
                <div className="spaces__item-main">
                  {/* Color Dot */}
                  <div style={{ position: "relative" }}>
                    <button
                      className="spaces__color-dot"
                      style={{ backgroundColor: space.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorPickerSpaceId(
                          showColorPicker ? null : space.id,
                        );
                      }}
                      title="Change color"
                    />
                    {showColorPicker && (
                      <div
                        className="spaces__color-picker"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {DEFAULT_SPACE_COLORS.map((color) => (
                          <button
                            key={color}
                            className={
                              "spaces__color-swatch" +
                              (color === space.color ? " selected" : "")
                            }
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorChange(space, color)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="spaces__name">
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        className="spaces__name-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => finishEditing(space)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") finishEditing(space);
                          if (e.key === "Escape") {
                            setEditingSpaceId(null);
                            setEditingName("");
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="spaces__name-text"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditing(space);
                        }}
                      >
                        {space.name}
                      </span>
                    )}
                  </div>

                  {/* Active Badge */}
                  {isActive && (
                    <span className="spaces__active-badge">
                      <Translation value="spaces_active" />
                    </span>
                  )}

                  {/* Delete Button (hidden for active space and when only 1 space) */}
                  {!isActive && spacesConfig.spaces.length > 1 && (
                    <button
                      className="spaces__delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmSpaceId(space.id);
                      }}
                      title="Delete space"
                    >
                      ✕
                    </button>
                  )}

                  {/* Per-space time-sensitive toggle (only shown when multiple spaces) */}
                  {showMultipleSpaces && (
                    <div
                      className="spaces__space-time-toggle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Toggle
                        id={`space-time-toggle-${space.id}`}
                        name={`Time toggle for ${space.name}`}
                        isChecked={space.isTimeSensitive}
                        handleToggleChange={() =>
                          handleTimeSensitiveToggle(space)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Time range inputs (shown when time-sensitive is enabled for this space) */}
                {space.isTimeSensitive &&
                  space.timeRange &&
                  (() => {
                    const unavailableRanges = spacesConfig.spaces
                      .filter(
                        (s) =>
                          s.id !== space.id && s.isTimeSensitive && s.timeRange,
                      )
                      .map((s) => s.timeRange!);

                    const isValid = !timeValidation.conflicts.some((c) =>
                      c.includes(space.id),
                    );

                    return (
                      <div
                        className="spaces__time-range-container"
                        style={{ marginTop: "10px", padding: "0 10px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TimeRangeSlider
                          value={space.timeRange}
                          onChange={(newRange) =>
                            handleUpdateSpace({ ...space, timeRange: newRange })
                          }
                          unavailableRanges={unavailableRanges}
                          isValid={isValid}
                        />
                      </div>
                    );
                  })()}
              </li>
            );
          })}
        </ul>

        {/* Time overlap error */}
        {hasAnyTimeSensitive && !timeValidation.valid && (
          <div className="spaces__time-error">
            ⚠ <Translation value="spaces_time_overlap_error" />
          </div>
        )}

        {/* Add Space */}
        <div className="spaces__add-section">
          {showAddForm ? (
            <div className="spaces__add-form">
              <div className="spaces__add-form-row">
                <input
                  className="spaces__add-input"
                  placeholder="Space name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSpace();
                    if (e.key === "Escape") setShowAddForm(false);
                  }}
                  autoFocus
                />
              </div>
              <div className="spaces__add-colors">
                {DEFAULT_SPACE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={
                      "spaces__color-swatch" +
                      (color === newSpaceColor ? " selected" : "")
                    }
                    style={{ backgroundColor: color }}
                    onClick={() => setNewSpaceColor(color)}
                  />
                ))}
              </div>
              <div className="spaces__add-form-actions">
                <button
                  className="spaces__form-btn secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSpaceName("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="spaces__form-btn primary"
                  onClick={handleAddSpace}
                  disabled={!newSpaceName.trim()}
                >
                  <Translation value="spaces_add" />
                </button>
              </div>
            </div>
          ) : (
            <button
              className="spaces__add-btn"
              onClick={() => {
                setNewSpaceColor(
                  DEFAULT_SPACE_COLORS[
                    spacesConfig.spaces.length % DEFAULT_SPACE_COLORS.length
                  ],
                );
                setShowAddForm(true);
              }}
            >
              + <Translation value="spaces_add" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmSpaceId && (
        <div
          className="spaces__confirm-overlay"
          onClick={() => setDeleteConfirmSpaceId(null)}
        >
          <div
            className="spaces__confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="spaces__confirm-text">
              <Translation value="spaces_delete_confirm" />
            </p>
            <div className="spaces__confirm-actions">
              <button
                className="spaces__confirm-btn cancel"
                onClick={() => setDeleteConfirmSpaceId(null)}
              >
                Cancel
              </button>
              <button
                className="spaces__confirm-btn danger"
                onClick={confirmDelete}
              >
                <Translation value="spaces_delete" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Spaces;
