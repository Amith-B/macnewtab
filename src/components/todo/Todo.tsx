import { useContext, useEffect, useRef, useState } from "react";
import "./Todo.css";
import { AppContext } from "../../context/provider";
import Checkbox from "../checkbox/Checkbox";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import { ReactComponent as EditIcon } from "../../assets/edit-icon.svg";
import linkify from "../../utils/linkify";
import Translation from "../../locale/Translation";
import { translation } from "../../locale/languages";
import { arrayMove, List } from "react-movable";
import { getBodyZoomScale } from "../../utils/zoom";

export default function TodoDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [modalAccessible, setModalAccessible] = useState(false);
  const [renderOpen, setRenderOpen] = useState(false);
  const [todoInput, setTodoInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const {
    locale,
    dockPosition,
    todoList,
    handleAddTodoList,
    handleTodoItemChecked,
    handleTodoItemDelete,
    handleTodoItemUpdate,
    handleClearCompletedTodoList,
    handleTodoListUpdate,
  } = useContext(AppContext);
  const inputRef = useRef(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: "unset", y: "unset" });
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const dragScale = useRef(1);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setRenderOpen(true), 10);
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
        clearTimeout(timer);
        clearTimeout(timerRef);
        document.removeEventListener("keydown", handleEsc);
      };
    } else {
      setRenderOpen(false);
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
    dragScale.current = getBodyZoomScale();
    const scale = dragScale.current;
    offset.current = {
      x:
        e.clientX / scale -
        modalRef.current.getBoundingClientRect().left / scale,
      y:
        e.clientY / scale -
        modalRef.current.getBoundingClientRect().top / scale,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const scale = dragScale.current || 1;

    setPosition({
      x: `${e.clientX / scale - offset.current.x}px`,
      y: `${e.clientY / scale - offset.current.y}px`,
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
        (renderOpen ? " visible" : "") +
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
                {editingId === item.id ? (
                  <input
                    autoFocus
                    className="todo-list-title__edit-input"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onBlur={() => {
                      if (
                        editingContent.trim() &&
                        editingContent !== item.content
                      ) {
                        handleTodoItemUpdate(item.id, editingContent);
                      }
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        if (
                          editingContent.trim() &&
                          editingContent !== item.content
                        ) {
                          handleTodoItemUpdate(item.id, editingContent);
                        }
                        setEditingId(null);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                  />
                ) : (
                  <span
                    title="Double click to edit"
                    onDoubleClick={() => {
                      setEditingId(item.id);
                      setEditingContent(item.content);
                    }}
                  >
                    {linkify(item.content)}
                  </span>
                )}
              </div>
              <div className="todo-list-item__actions">
                <button
                  className="todo-list-item__edit button-icon"
                  title="Edit"
                  onClick={() => {
                    setEditingId(item.id);
                    setEditingContent(item.content);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <EditIcon />
                </button>
                <button
                  className="todo-list-item__delete button-icon"
                  onClick={() => handleTodoItemDelete(item.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
