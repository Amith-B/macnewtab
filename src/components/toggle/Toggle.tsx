import "./Toggle.css";

export default function Toggle({
  isChecked,
  handleToggleChange,
}: {
  isChecked: boolean;
  handleToggleChange: () => void;
}) {
  return (
    <div className="toggle">
      <input
        type="checkbox"
        id="toggle"
        className="toggle-checkbox"
        checked={isChecked}
        onChange={handleToggleChange}
      />
      <label htmlFor="toggle" className="toggle-label">
        <span className="toggle-inner"></span>
      </label>
    </div>
  );
}
