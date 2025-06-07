import "./Toggle.css";

export default function Toggle({
  isChecked,
  handleToggleChange,
  id,
  name,
}: {
  isChecked: boolean;
  handleToggleChange: () => void;
  id: string;
  name?: string;
}) {
  return (
    <div className="toggle accessible">
      <input
        type="checkbox"
        id={id}
        name={name}
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
