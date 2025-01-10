import { useEffect, useState } from "react";
import { launchpadList } from "../../static/launchpad";
import "./Launchpad.css";

export default function Launchpad({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [modalAccessible, setModalAccessible] = useState(false);

  // this is to prevent keyboard accessibility when modal is closed
  useEffect(() => {
    if (visible) {
      setModalAccessible(true);
    } else {
      const timerRef = setTimeout(() => {
        setModalAccessible(false);
      }, 600);

      return () => clearTimeout(timerRef);
    }
  }, [visible]);

  return (
    <div
      className={
        "launchpad__overlay" +
        (visible ? " visible" : "") +
        (modalAccessible ? " modal-accessible" : " modal-inaccessible")
      }
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
