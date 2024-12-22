import "./Toggle.css";

export default function Toggle({
  isChecked,
  handleToggleChange,
  id,
}: {
  isChecked: boolean;
  handleToggleChange: () => void;
  id: string;
}) {
  return (
    <div className="toggle">
      <input
        type="checkbox"
        id={id}
        className="toggle-checkbox"
        checked={isChecked}
        onChange={handleToggleChange}
      />
      <label htmlFor={id} className="toggle-label">
        <span className="toggle-inner"></span>
      </label>
    </div>
  );
}
