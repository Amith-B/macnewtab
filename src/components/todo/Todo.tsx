import { useContext, useEffect, useRef, useState } from "react";
import "./Todo.css";
import { AppContext } from "../../context/provider";
import Checkbox from "../checkbox/Checkbox";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import linkify from "../../utils/linkify";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";
import { arrayMove, List } from "react-movable";

export default function TodoDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [modalAccessible, setModalAccessible] = useState(false);
  const [todoInput, setTodoInput] = useState("");
  const {
    locale,
    dockPosition,
    todoList,
    handleAddTodoList,
    handleTodoItemChecked,
    handleTodoItemDelete,
    handleClearCompletedTodoList,
    handleTodoListUpdate,
  } = useContext(AppContext);
  const inputRef = useRef(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: "unset", y: "unset" });
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      handleClearCompletedTodoList();
      setModalAccessible(true);
      const timerRef = setTimeout(() => {
        if (inputRef.current) {
          (inputRef.current as HTMLElement).focus();
        }
      }, 300);

      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEsc);
      return () => {
        clearTimeout(timerRef);
        document.removeEventListener("keydown", handleEsc);
      };
    } else {
      const timerRef = setTimeout(() => {
        setModalAccessible(false);
        setPosition({ x: "unset", y: "unset" });
      }, 200);

      return () => clearTimeout(timerRef);
    }
    // eslint-disable-next-line
  }, [open, onClose]);

  const handleKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter" && !!todoInput) {
      handleAddToList(todoInput);
    }
  };

  const handleAddToList = (val: string) => {
    setTodoInput("");
    if (!!val) {
      handleAddTodoList(val);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!modalRef.current) return;

    isDragging.current = true;
    offset.current = {
      x: e.clientX - modalRef.current.getBoundingClientRect().left,
      y: e.clientY - modalRef.current.getBoundingClientRect().top,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    setPosition({
      x: `${e.clientX - offset.current.x}px`,
      y: `${e.clientY - offset.current.y}px`,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
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
        className={`todo-dialog__container dock-position-${dockPosition} within-dock`}
        onClick={(evt) => evt.stopPropagation()}
        ref={modalRef}
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
        }}
      >
        <h2
          className="todo-dialog__header draggable"
          onMouseDown={handleMouseDown}
        >
          <Translation value="todo" />
        </h2>
        <div className="todo-dialog-input__controls">
          <div className="todo-dialog-input__container">
            <input
              id="todo-input"
              name="Todo Input"
              placeholder={translation[locale]["add_to_list"]}
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
        <List
          lockVertically
          values={todoList}
          onChange={({ oldIndex, newIndex }) => {
            handleTodoListUpdate(arrayMove(todoList, oldIndex, newIndex));
          }}
          renderList={({ children, props }) => (
            <div className="todo-list" {...props}>
              {children}
            </div>
          )}
          renderItem={({ value: item, props }) => (
            <div className="todo-list-item draggable" {...props} key={item.id}>
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
                className="todo-list-item__delete button-icon"
                onClick={() => handleTodoItemDelete(item.id)}
              >
                <DeleteIcon />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
