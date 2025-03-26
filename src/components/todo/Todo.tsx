import { useContext, useEffect, useRef, useState } from "react";
import "./Todo.css";
import { AppContext } from "../../context/provider";
import Checkbox from "../checkbox/Checkbox";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import linkify from "../../utils/linkify";
import Translation from "../../locale/Translation";

export default function TodoDialog({
  open,
  onClose,
  withinDock,
}: {
  open: boolean;
  onClose: () => void;
  withinDock: boolean;
}) {
  const [modalAccessible, setModalAccessible] = useState(false);
  const [todoInput, setTodoInput] = useState("");
  const {
    dockPosition,
    todoList,
    handleAddTodoList,
    handleTodoItemChecked,
    handleTodoItemDelete,
    handleClearCompletedTodoList,
  } = useContext(AppContext);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      handleClearCompletedTodoList();
      setModalAccessible(true);
      const timerRef = setTimeout(() => {
        if (inputRef.current) {
          (inputRef.current as HTMLElement).focus();
        }
      }, 300);

      return () => clearTimeout(timerRef);
    } else {
      const timerRef = setTimeout(() => {
        setModalAccessible(false);
      }, 600);

      return () => clearTimeout(timerRef);
    }
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  const handleKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter") {
      handleAddToList(todoInput);
    }
  };

  const handleAddToList = (val: string) => {
    setTodoInput("");
    handleAddTodoList(val);
  };

  return (
    <div
      className={
        "todo-dialog__overlay" +
        (open ? " visible" : "") +
        (modalAccessible ? " modal-accessible" : " modal-inaccessible")
      }
      onClick={onClose}
    >
      <div
        className={
          `todo-dialog__container dock-position-${dockPosition}` +
          (withinDock ? " within-dock" : "")
        }
        onClick={(evt) => evt.stopPropagation()}
      >
        <h2 className="todo-dialog__header">
          <Translation value="todo" />
        </h2>
        <div className="todo-dialog-input__controls">
          <div className="todo-dialog-input__container">
            <input
              placeholder="Add to list"
              ref={inputRef}
              value={todoInput}
              onChange={(event) => setTodoInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            className="todo-dialog-input-button"
            onClick={() => handleAddToList(todoInput)}
          >
            +
          </button>
        </div>
        <div className="todo-list">
          {todoList.map((item) => {
            return (
              <div className="todo-list-item" key={item.id}>
                <div
                  className={
                    "todo-list-title__container" +
                    (item.checked ? " checked" : "")
                  }
                >
                  <Checkbox
                    checked={item.checked}
                    onChange={(e) => {
                      handleTodoItemChecked(item.id, e.target.checked);
                    }}
                  />
                  <span>{linkify(item.content)}</span>
                </div>
                <button
                  className="todo-list-item__delete"
                  onClick={() => handleTodoItemDelete(item.id)}
                >
                  <DeleteIcon />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
