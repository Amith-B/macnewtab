import { launchpadList } from "../../static/launchpad";
import "./Launchpad.css";

export default function Launchpad({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={"launchpad__overlay" + (visible ? " visible" : "")}
      onClick={onClose}
    >
      <div className="launchpad__container">
        {launchpadList.map((item, idx) => (
          <a
            href={item.href}
            className="launchpad-item"
            key={idx}
            title={item.label}
          >
            <div className="launchpad-item__logo">{<item.icon />}</div>
            <span className="launchpad-item__label">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
