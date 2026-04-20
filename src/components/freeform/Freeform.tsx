import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useContext,
} from "react";
import "./Freeform.css";
import {
  CanvasObject,
  Point,
  ShapeObject,
  ShapeType,
  StickyObject,
  StrokeObject,
  TextObject,
  ToolType,
  ImageObject,
  Camera,
} from "./freeformTypes";
import { getBodyZoomScale } from "../../utils/zoom";
import { useHistory } from "./useHistory";
import { FREEFORM_DATA_LOCAL_STORAGE_KEY } from "../../static/freeformSettings";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import { useLocalStorage } from "../../utils/localStorage";

import { ReactComponent as UndoIcon } from "./icons/undo.svg";
import { ReactComponent as RedoIcon } from "./icons/redo.svg";
import { ReactComponent as HighlighterIcon } from "./icons/highlighter.svg";
import { ReactComponent as EraserIcon } from "./icons/eraser.svg";
import { ReactComponent as CloseIcon } from "./icons/close.svg";
import { ReactComponent as ExportIcon } from "./icons/export.svg";
import { ReactComponent as ClearAllIcon } from "./icons/clear-all.svg";
import { ReactComponent as SelectIcon } from "./icons/select.svg";
import { ReactComponent as PenIcon } from "./icons/pen.svg";
import { ReactComponent as FinePenIcon } from "./icons/fine-pen.svg";
import { ReactComponent as TextIcon } from "./icons/text.svg";
import { ReactComponent as ShapesIcon } from "./icons/shape.svg";
import { ReactComponent as StickyIcon } from "./icons/sticky.svg";
import { ReactComponent as ImageIcon } from "./icons/image.svg";

// ─── Constants ─────────────────────────────────────────────
const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#A2845E",
  "#8E8E93",
  "#00C7BE",
  "#30B0C7",
  "#32D74B",
  "#FFD60A",
  "#FF6482",
  "#BF5AF2",
];

const STICKY_COLORS = [
  "#FFE066",
  "#FFB3BA",
  "#BAFFC9",
  "#BAE1FF",
  "#FFDFBA",
  "#E6CCFF",
];

const SHAPE_LIST: { type: ShapeType; labelKey: string }[] = [
  { type: "line", labelKey: "freeform_shape_line" },
  { type: "arrow", labelKey: "freeform_shape_arrow" },
  { type: "rectangle", labelKey: "freeform_shape_rect" },
  { type: "roundedRectangle", labelKey: "freeform_shape_rounded" },
  { type: "circle", labelKey: "freeform_shape_circle" },
  { type: "triangle", labelKey: "freeform_shape_triangle" },
  { type: "diamond", labelKey: "freeform_shape_diamond" },
  { type: "star", labelKey: "freeform_shape_star" },
  { type: "pentagon", labelKey: "freeform_shape_pentagon" },
  { type: "speechBubble", labelKey: "freeform_shape_speech" },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── Load / Save ───────────────────────────────────────────
function loadData(): CanvasObject[] {
  try {
    const raw = localStorage.getItem(FREEFORM_DATA_LOCAL_STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d)) return d;
    }
  } catch {}
  return [];
}

function saveData(objects: CanvasObject[]) {
  localStorage.setItem(
    FREEFORM_DATA_LOCAL_STORAGE_KEY,
    JSON.stringify(objects),
  );
}

// ─── Drawing helpers ───────────────────────────────────────
function drawStroke(
  ctx: CanvasRenderingContext2D,
  s: StrokeObject,
  cam: Camera,
) {
  if (s.points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width * cam.zoom;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const p0 = s.points[0];
  ctx.moveTo((p0.x + cam.x) * cam.zoom, (p0.y + cam.y) * cam.zoom);
  for (let i = 1; i < s.points.length; i++) {
    const p = s.points[i];
    ctx.lineTo((p.x + cam.x) * cam.zoom, (p.y + cam.y) * cam.zoom);
  }
  ctx.stroke();
  ctx.restore();
}

function drawShapePath(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  cam: Camera,
) {
  const sx = (shape.x + cam.x) * cam.zoom;
  const sy = (shape.y + cam.y) * cam.zoom;
  const sw = shape.width * cam.zoom;
  const sh = shape.height * cam.zoom;

  ctx.beginPath();
  switch (shape.shapeType) {
    case "line":
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + sw, sy + sh);
      break;
    case "arrow": {
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + sw, sy + sh);
      const angle = Math.atan2(sh, sw);
      const hl = 12 * cam.zoom;
      ctx.moveTo(sx + sw, sy + sh);
      ctx.lineTo(
        sx + sw - hl * Math.cos(angle - 0.4),
        sy + sh - hl * Math.sin(angle - 0.4),
      );
      ctx.moveTo(sx + sw, sy + sh);
      ctx.lineTo(
        sx + sw - hl * Math.cos(angle + 0.4),
        sy + sh - hl * Math.sin(angle + 0.4),
      );
      break;
    }
    case "rectangle":
      ctx.rect(sx, sy, sw, sh);
      break;
    case "roundedRectangle": {
      const r = Math.min(10 * cam.zoom, Math.abs(sw) / 4, Math.abs(sh) / 4);
      const x2 = sx + sw,
        y2 = sy + sh;
      const lx = Math.min(sx, x2),
        ly = Math.min(sy, y2);
      const lw = Math.abs(sw),
        lh = Math.abs(sh);
      ctx.moveTo(lx + r, ly);
      ctx.lineTo(lx + lw - r, ly);
      ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + r);
      ctx.lineTo(lx + lw, ly + lh - r);
      ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - r, ly + lh);
      ctx.lineTo(lx + r, ly + lh);
      ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - r);
      ctx.lineTo(lx, ly + r);
      ctx.quadraticCurveTo(lx, ly, lx + r, ly);
      ctx.closePath();
      break;
    }
    case "circle": {
      const cx = sx + sw / 2,
        cy = sy + sh / 2;
      const rx = Math.abs(sw) / 2,
        ry = Math.abs(sh) / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      break;
    }
    case "triangle":
      ctx.moveTo(sx + sw / 2, sy);
      ctx.lineTo(sx + sw, sy + sh);
      ctx.lineTo(sx, sy + sh);
      ctx.closePath();
      break;
    case "diamond":
      ctx.moveTo(sx + sw / 2, sy);
      ctx.lineTo(sx + sw, sy + sh / 2);
      ctx.lineTo(sx + sw / 2, sy + sh);
      ctx.lineTo(sx, sy + sh / 2);
      ctx.closePath();
      break;
    case "star": {
      const cx = sx + sw / 2,
        cy = sy + sh / 2;
      const outerR = Math.min(Math.abs(sw), Math.abs(sh)) / 2;
      const innerR = outerR * 0.4;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (Math.PI / 2) * -1 + (i * Math.PI) / 5;
        const px = cx + r * Math.cos(a),
          py = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case "pentagon": {
      const cx = sx + sw / 2,
        cy = sy + sh / 2;
      const r = Math.min(Math.abs(sw), Math.abs(sh)) / 2;
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5;
        const px = cx + r * Math.cos(a),
          py = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case "speechBubble": {
      const lx = Math.min(sx, sx + sw),
        ly = Math.min(sy, sy + sh);
      const lw = Math.abs(sw),
        lh = Math.abs(sh);
      const r = Math.min(8 * cam.zoom, lw / 4, lh / 4);
      const bodyH = lh * 0.8;
      ctx.moveTo(lx + r, ly);
      ctx.lineTo(lx + lw - r, ly);
      ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + r);
      ctx.lineTo(lx + lw, ly + bodyH - r);
      ctx.quadraticCurveTo(lx + lw, ly + bodyH, lx + lw - r, ly + bodyH);
      ctx.lineTo(lx + lw * 0.35, ly + bodyH);
      ctx.lineTo(lx + lw * 0.15, ly + lh);
      ctx.lineTo(lx + lw * 0.25, ly + bodyH);
      ctx.lineTo(lx + r, ly + bodyH);
      ctx.quadraticCurveTo(lx, ly + bodyH, lx, ly + bodyH - r);
      ctx.lineTo(lx, ly + r);
      ctx.quadraticCurveTo(lx, ly, lx + r, ly);
      ctx.closePath();
      break;
    }
  }
}

function drawShape(ctx: CanvasRenderingContext2D, s: ShapeObject, cam: Camera) {
  ctx.save();
  drawShapePath(ctx, s, cam);
  if (s.shapeType !== "line" && s.shapeType !== "arrow") {
    ctx.fillStyle = s.fillColor;
    ctx.fill();
  }
  ctx.strokeStyle = s.strokeColor;
  ctx.lineWidth = s.strokeWidth * cam.zoom;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, t: TextObject, cam: Camera) {
  ctx.save();
  const size = t.fontSize * cam.zoom;
  let font = `${size}px ${t.fontFamily}`;
  if (t.bold) font = `bold ${font}`;
  if (t.italic) font = `italic ${font}`;
  ctx.font = font;
  ctx.fillStyle = t.color;
  ctx.textBaseline = "top";
  const tx = (t.x + cam.x) * cam.zoom;
  const ty = (t.y + cam.y) * cam.zoom;
  if (!t.content) {
    // Draw placeholder for empty text
    ctx.globalAlpha = 0.35;
    ctx.fillText("Type here...", tx, ty);
  } else {
    const lines = t.content.split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(line, tx, ty + i * size * 1.3);
    });
  }
  ctx.restore();
}

function drawSticky(
  ctx: CanvasRenderingContext2D,
  s: StickyObject,
  cam: Camera,
) {
  ctx.save();
  const sx = (s.x + cam.x) * cam.zoom;
  const sy = (s.y + cam.y) * cam.zoom;
  const sw = s.width * cam.zoom;
  const sh = s.height * cam.zoom;
  ctx.fillStyle = s.color;
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  const r = 4 * cam.zoom;
  ctx.beginPath();
  ctx.moveTo(sx + r, sy);
  ctx.lineTo(sx + sw - r, sy);
  ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + r);
  ctx.lineTo(sx + sw, sy + sh - r);
  ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - r, sy + sh);
  ctx.lineTo(sx + r, sy + sh);
  ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - r);
  ctx.lineTo(sx, sy + r);
  ctx.quadraticCurveTo(sx, sy, sx + r, sy);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = "transparent";
  const size = 13 * cam.zoom;
  ctx.fillStyle = "#222";
  ctx.font = `${size}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textBaseline = "top";
  const lines = s.content.split("\n");
  const pad = 8 * cam.zoom;
  lines.forEach((line, i) => {
    ctx.fillText(line, sx + pad, sy + pad + i * size * 1.4, sw - pad * 2);
  });
  ctx.restore();
}

function drawImageObj(
  ctx: CanvasRenderingContext2D,
  img: ImageObject,
  cam: Camera,
  imageCache: Map<string, HTMLImageElement>,
) {
  const cached = imageCache.get(img.id);
  if (!cached) return;
  const ix = (img.x + cam.x) * cam.zoom;
  const iy = (img.y + cam.y) * cam.zoom;
  const iw = img.width * cam.zoom;
  const ih = img.height * cam.zoom;
  ctx.drawImage(cached, ix, iy, iw, ih);
}

function hitTest(obj: CanvasObject, wx: number, wy: number): boolean {
  const PAD = 10;
  switch (obj.type) {
    case "stroke": {
      const threshold = Math.max(obj.width, 4) + PAD;
      for (let i = 0; i < obj.points.length; i++) {
        const p = obj.points[i];
        const d = Math.hypot(p.x - wx, p.y - wy);
        if (d < threshold) return true;
        // Also check line segments between points for better hit detection
        if (i > 0) {
          const prev = obj.points[i - 1];
          const segLen = Math.hypot(p.x - prev.x, p.y - prev.y);
          if (segLen > 0) {
            const t = Math.max(
              0,
              Math.min(
                1,
                ((wx - prev.x) * (p.x - prev.x) +
                  (wy - prev.y) * (p.y - prev.y)) /
                  (segLen * segLen),
              ),
            );
            const projX = prev.x + t * (p.x - prev.x);
            const projY = prev.y + t * (p.y - prev.y);
            if (Math.hypot(wx - projX, wy - projY) < threshold) return true;
          }
        }
      }
      return false;
    }
    case "shape": {
      const { x, y, width, height } = obj;
      const lx = Math.min(x, x + width),
        ly = Math.min(y, y + height);
      const lw = Math.abs(width),
        lh = Math.abs(height);
      return (
        wx >= lx - PAD &&
        wx <= lx + lw + PAD &&
        wy >= ly - PAD &&
        wy <= ly + lh + PAD
      );
    }
    case "text":
    case "sticky":
    case "image": {
      const { x, y, width, height } = obj;
      return (
        wx >= x - PAD &&
        wx <= x + width + PAD &&
        wy >= y - PAD &&
        wy <= y + height + PAD
      );
    }
    default:
      return false;
  }
}

// Eraser: for strokes, split into sub-strokes removing the erased portion.
// For non-stroke objects, remove entirely if eraser touches them.
function eraseAt(
  objects: CanvasObject[],
  wp: Point,
  worldEraserRadius: number,
  activeEraserRef: Record<string, Point[]>,
): { objects: CanvasObject[]; changed: boolean } {
  let changed = false;
  const newObjects: CanvasObject[] = [];

  for (const obj of objects) {
    let rx = 0,
      ry = 0,
      lw = 0,
      lh = 0;

    if (obj.type === "stroke") {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of obj.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      rx = minX - obj.width;
      ry = minY - obj.width;
      lw = maxX - minX + obj.width * 2;
      lh = maxY - minY + obj.width * 2;
    } else {
      const { x, y, width, height } = obj as any;
      rx = Math.min(x, x + width);
      ry = Math.min(y, y + height);
      lw = Math.abs(width);
      lh = Math.abs(height);
    }

    const closeX = Math.max(rx, Math.min(wp.x, rx + lw));
    const closeY = Math.max(ry, Math.min(wp.y, ry + lh));

    if (Math.hypot(wp.x - closeX, wp.y - closeY) <= worldEraserRadius) {
      changed = true;

      const newObj = { ...obj } as any;
      const erasedStrokes = newObj.erasedStrokes
        ? [...newObj.erasedStrokes]
        : [];
      newObj.erasedStrokes = erasedStrokes;

      if (!activeEraserRef[obj.id]) {
        activeEraserRef[obj.id] = [{ x: wp.x - rx, y: wp.y - ry }];
        erasedStrokes.push({
          width: worldEraserRadius * 2,
          points: activeEraserRef[obj.id],
        });
      } else {
        activeEraserRef[obj.id].push({ x: wp.x - rx, y: wp.y - ry });
        // Must shallow-copy erasedStrokes array so React registers the deeper nested change without dropping reference
        newObj.erasedStrokes = [...erasedStrokes];
      }
      newObjects.push(newObj);
    } else {
      newObjects.push(obj);
    }
  }

  return { objects: newObjects, changed };
}

// ─── Shape icon SVGs for picker ────────────────────────────
function ShapeIcon({ type }: { type: ShapeType }) {
  const s = 28; // viewBox size
  const c = "#4CD6F8";
  switch (type) {
    case "line":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <line
            x1="4"
            y1="24"
            x2="24"
            y2="4"
            stroke={c}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "arrow":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <line
            x1="4"
            y1="24"
            x2="22"
            y2="6"
            stroke={c}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polyline
            points="14,6 22,6 22,14"
            fill="none"
            stroke={c}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "rectangle":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <rect x="4" y="6" width="20" height="16" fill={c} rx="1" />
        </svg>
      );
    case "roundedRectangle":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <rect x="4" y="6" width="20" height="16" fill={c} rx="5" />
        </svg>
      );
    case "circle":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="10" fill={c} />
        </svg>
      );
    case "triangle":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <polygon points="14,4 26,24 2,24" fill={c} />
        </svg>
      );
    case "diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <polygon points="14,2 26,14 14,26 2,14" fill={c} />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <polygon
            points="14,2 17.5,10 26,11 19.5,17 21,26 14,22 7,26 8.5,17 2,11 10.5,10"
            fill={c}
          />
        </svg>
      );
    case "pentagon":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <polygon points="14,3 25,11 21,24 7,24 3,11" fill={c} />
        </svg>
      );
    case "speechBubble":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <path
            d="M4,6 h20 a2,2 0 0 1 2,2 v10 a2,2 0 0 1-2,2 h-12 l-4,5 v-5 h-4 a2,2 0 0 1-2,-2 v-10 a2,2 0 0 1 2,-2z"
            fill={c}
          />
        </svg>
      );
    default:
      return null;
  }
}

function drawObjectBase(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  cam: Camera,
  editingTextId: string | null,
  imgCache: Map<string, HTMLImageElement>,
) {
  switch (obj.type) {
    case "stroke":
      drawStroke(ctx, obj as StrokeObject, cam);
      break;
    case "shape":
      drawShape(ctx, obj as ShapeObject, cam);
      break;
    case "text":
      if (obj.id !== editingTextId) drawText(ctx, obj as TextObject, cam);
      break;
    case "sticky":
      drawSticky(ctx, obj as StickyObject, cam);
      break;
    case "image":
      drawImageObj(ctx, obj as ImageObject, cam, imgCache);
      break;
  }
}

type Plan = "basic" | "pro";

// ─── Main Component ────────────────────────────────────────
const Freeform: React.FC<{ visible: boolean; onClose: () => void }> = memo(
  ({ visible, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

    const plan: Plan = "pro" as Plan;

    const isProTool = (id: string) =>
      ["finePen", "highlighter", "shape", "sticky", "image"].includes(id);
    const isBasicColor = (c: string) => c === "#000000" || c === "#FFFFFF";

    const [showPricingBanner, setShowPricingBanner] = useState(() => {
      const dismissedAt = localStorage.getItem(
        "freeform_pricing_banner_dismissed_at",
      );
      
      if (!dismissedAt) {
        // Migrate old boolean format if the user already clicked dismiss before this update
        if (localStorage.getItem("freeform_pricing_banner_dismissed") === "true") {
          localStorage.removeItem("freeform_pricing_banner_dismissed");
          localStorage.setItem("freeform_pricing_banner_dismissed_at", Date.now().toString());
          return false;
        }
        return true;
      }

      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const timeSinceDismissed = Date.now() - parseInt(dismissedAt, 10);
      
      return timeSinceDismissed > ONE_WEEK_MS;
    });

    const dismissPricingBanner = () => {
      localStorage.setItem("freeform_pricing_banner_dismissed_at", Date.now().toString());
      setShowPricingBanner(false);
    };

    const [tool, setTool] = useState<ToolType>("pen");
    const [color, setColor] = useState("#000000");
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showShapePicker, setShowShapePicker] = useState(false);
    const [showEraserPicker, setShowEraserPicker] = useState(false);
    const [showPenPicker, setShowPenPicker] = useState(false);
    const [showHighlighterPicker, setShowHighlighterPicker] = useState(false);
    const [eraserWidth, setEraserWidth] = useState(18);
    const [highlighterWidth, setHighlighterWidth] = useState(20);
    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);

    // Drawing state refs
    const mousePosRef = useRef<{ x: number; y: number } | null>(null);
    const isDrawingRef = useRef(false);
    const isPanningRef = useRef(false);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const activeEraserRef = useRef<Record<string, Point[]>>({});
    const panStartRef = useRef<Point>({ x: 0, y: 0 });
    const camStartRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
    const currentStrokeRef = useRef<Point[]>([]);
    const shapeStartRef = useRef<Point>({ x: 0, y: 0 });
    const dragStartRef = useRef<Point>({ x: 0, y: 0 });
    const dragObjStartRef = useRef<Point>({ x: 0, y: 0 });
    const isDraggingObjRef = useRef(false);
    const tempShapeRef = useRef<ShapeObject | null>(null);
    const pinchDistRef = useRef<number | null>(null);
    const pinchZoomStartRef = useRef(1);

    const { objects, pushState, replaceState, undo, redo, canUndo, canRedo } =
      useHistory(loadData());

    const { locale } = useContext(AppContext);
    const t = translation[locale];

    const [freeformTheme, setFreeformTheme] = useLocalStorage<"light" | "dark">(
      "freeform_theme_override",
      "light",
    );

    const isDarkTheme = freeformTheme === "dark";
      
    const activeThemeClass = isDarkTheme ? "dark" : "light";

    const toggleTheme = () => {
      setFreeformTheme(isDarkTheme ? "light" : "dark");
    };

    // Screen → world coords
    const screenToWorld = useCallback(
      (sx: number, sy: number): Point => {
        return {
          x: sx / camera.zoom - camera.x,
          y: sy / camera.zoom - camera.y,
        };
      },
      [camera],
    );

    // ─── Canvas render ───────────────────────────────────────
    const render = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      if (!tempCanvasRef.current)
        tempCanvasRef.current = document.createElement("canvas");
      const tCanvas = tempCanvasRef.current;
      const tCtx = tCanvas.getContext("2d", { willReadFrequently: true })!;

      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      for (const obj of objects) {
        const hasEraser =
          (obj as any).erasedStrokes && (obj as any).erasedStrokes.length > 0;
        if (!hasEraser) {
          drawObjectBase(
            ctx,
            obj,
            camera,
            editingTextId,
            imageCacheRef.current,
          );
        } else {
          // Render offscreen to composite erasing transparency
          const o = obj as any;
          const pad = 80; // High padding for large blurs or strokes that exceed bounds natively

          let rx = 0,
            ry = 0,
            oWidth = 0,
            oHeight = 0;
          if (o.type === "stroke") {
            let minX = Infinity,
              minY = Infinity,
              maxX = -Infinity,
              maxY = -Infinity;
            for (const p of o.points) {
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            }
            rx = minX - o.width;
            ry = minY - o.width;
            oWidth = maxX - minX + o.width * 2;
            oHeight = maxY - minY + o.width * 2;
          } else {
            rx = Math.min(o.x, o.x + o.width);
            ry = Math.min(o.y, o.y + o.height);
            oWidth = Math.abs(o.width);
            oHeight = Math.abs(o.height);
          }

          const sw = oWidth * camera.zoom + pad * 2;
          const sh = oHeight * camera.zoom + pad * 2;

          if (
            tCanvas.width !== Math.ceil(sw * dpr) ||
            tCanvas.height !== Math.ceil(sh * dpr)
          ) {
            tCanvas.width = Math.ceil(sw * dpr);
            tCanvas.height = Math.ceil(sh * dpr);
          } else {
            tCtx.clearRect(0, 0, tCanvas.width, tCanvas.height);
          }

          tCtx.save();
          tCtx.scale(dpr, dpr);
          tCtx.translate(
            -((rx + camera.x) * camera.zoom) + pad,
            -((ry + camera.y) * camera.zoom) + pad,
          );

          drawObjectBase(
            tCtx,
            obj,
            camera,
            editingTextId,
            imageCacheRef.current,
          );

          tCtx.globalCompositeOperation = "destination-out";
          tCtx.lineCap = "round";
          tCtx.lineJoin = "round";
          for (const est of o.erasedStrokes) {
            tCtx.lineWidth = est.width * camera.zoom;
            tCtx.beginPath();
            for (let i = 0; i < est.points.length; i++) {
              const pt = est.points[i];
              // points are stored relative to rx, ry natively
              const px = (rx + pt.x + camera.x) * camera.zoom;
              const py = (ry + pt.y + camera.y) * camera.zoom;
              if (i === 0) tCtx.moveTo(px, py);
              else tCtx.lineTo(px, py);
            }
            tCtx.stroke();
          }
          tCtx.restore();

          ctx.drawImage(
            tCanvas,
            (rx + camera.x) * camera.zoom - pad,
            (ry + camera.y) * camera.zoom - pad,
            sw,
            sh,
          );
        }
      }

      // Draw temp shape being created
      if (tempShapeRef.current) {
        drawShape(ctx, tempShapeRef.current, camera);
      }

      // Draw current stroke
      if (
        isDrawingRef.current &&
        currentStrokeRef.current.length > 1 &&
        (tool === "pen" || tool === "finePen" || tool === "highlighter")
      ) {
        const tempStroke: StrokeObject = {
          id: "temp",
          type: "stroke",
          tool: tool as any,
          points: currentStrokeRef.current,
          color,
          width:
            tool === "finePen"
              ? 1
              : tool === "highlighter"
                ? highlighterWidth
                : strokeWidth,
          opacity: tool === "highlighter" ? 0.8 : 1,
        };
        drawStroke(ctx, tempStroke, camera);
      }

      // Selection highlight
      if (selectedId && selectedId !== editingTextId) {
        const sel = objects.find((o) => o.id === selectedId);
        if (sel && sel.type !== "stroke") {
          const o = sel as
            | ShapeObject
            | TextObject
            | StickyObject
            | ImageObject;
          const sx = (o.x + camera.x) * camera.zoom;
          const sy = (o.y + camera.y) * camera.zoom;
          const sw = o.width * camera.zoom;
          const sh = o.height * camera.zoom;
          ctx.save();
          ctx.strokeStyle = "#007AFF";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(sx - 3, sy - 3, sw + 6, sh + 6);
          ctx.restore();
        }
      }

      // Draw eraser cursor
      if (tool === "eraser" && mousePosRef.current) {
        const { x, y } = mousePosRef.current;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, eraserWidth, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, eraserWidth - 1, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }, [
      objects,
      camera,
      tool,
      color,
      strokeWidth,
      selectedId,
      editingTextId,
      eraserWidth,
      highlighterWidth,
    ]);

    useEffect(() => {
      if (!visible) return;
      let frameId: number;
      const loop = () => {
        render();
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameId);
    }, [visible, render]);

    // Save on changes
    useEffect(() => {
      saveData(objects);
    }, [objects]);

    // Load images into cache and prune removed images
    useEffect(() => {
      const activeImageIds = new Set(
        objects.filter((o) => o.type === "image").map((o) => o.id),
      );

      Array.from(imageCacheRef.current.keys()).forEach((id) => {
        if (!activeImageIds.has(id)) {
          imageCacheRef.current.delete(id);
        }
      });

      objects.forEach((obj) => {
        if (obj.type === "image" && !imageCacheRef.current.has(obj.id)) {
          const img = new Image();
          img.src = obj.src;
          img.onload = () => {
            imageCacheRef.current.set(obj.id, img);
            render();
          };
        }
      });
    }, [objects, render]);

    // Keyboard shortcuts
    useEffect(() => {
      if (!visible) return;
      const handleKey = (e: KeyboardEvent) => {
        if (editingTextId) return;
        if ((e.metaKey || e.ctrlKey) && e.key === "z") {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedId && !editingTextId) {
            e.preventDefault();
            pushState(objects.filter((o) => o.id !== selectedId));
            setSelectedId(null);
          }
        }
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }, [
      visible,
      undo,
      redo,
      selectedId,
      editingTextId,
      objects,
      pushState,
      onClose,
    ]);

    // ─── Mouse handlers ─────────────────────────────────────
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        activeEraserRef.current = {};
        const rect = containerRef.current!.getBoundingClientRect();
        const scale = getBodyZoomScale();
        const sx = (e.clientX - rect.left) / scale;
        const sy = (e.clientY - rect.top) / scale;
        const wp = screenToWorld(sx, sy);

        // Middle button or space = pan
        if (e.button === 1) {
          if (plan === "basic") return;
          isPanningRef.current = true;
          panStartRef.current = { x: e.clientX, y: e.clientY };
          camStartRef.current = { ...camera };
          return;
        }

        setShowColorPicker(false);
        setShowShapePicker(false);
        setShowEraserPicker(false);
        setShowPenPicker(false);
        setShowHighlighterPicker(false);

        if (tool === "select") {
          // Try to select an object
          const clicked = [...objects]
            .reverse()
            .find((o) => hitTest(o, wp.x, wp.y));
          if (clicked) {
            setSelectedId(clicked.id);
            isDraggingObjRef.current = true;
            dragStartRef.current = wp;
            if (clicked.type !== "stroke") {
              dragObjStartRef.current = {
                x: (clicked as any).x,
                y: (clicked as any).y,
              };
            }
          } else {
            setSelectedId(null);
            setEditingTextId(null);
            if (plan !== "basic") {
              // Long-press on empty space starts panning after 300ms
              longPressTimerRef.current = setTimeout(() => {
                isPanningRef.current = true;
                panStartRef.current = { x: e.clientX, y: e.clientY };
                camStartRef.current = { ...camera };
                if (containerRef.current) {
                  containerRef.current.style.cursor = "grabbing";
                }
              }, 300);
            }
          }
          return;
        }

        if (tool === "eraser") {
          isDrawingRef.current = true;
          const result = eraseAt(
            objects,
            wp,
            eraserWidth / camera.zoom,
            activeEraserRef.current,
          );
          if (result.changed) {
            replaceState(result.objects);
          }
          return;
        }

        if (tool === "pen" || tool === "finePen" || tool === "highlighter") {
          isDrawingRef.current = true;
          currentStrokeRef.current = [wp];
          return;
        }

        if (tool === "shape") {
          isDrawingRef.current = true;
          shapeStartRef.current = wp;
          return;
        }

        if (tool === "text") {
          const textObj: TextObject = {
            id: generateId(),
            type: "text",
            x: wp.x,
            y: wp.y,
            width: 200,
            height: 30,
            content: "",
            fontSize: 16,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            color,
            bold: false,
            italic: false,
          };
          pushState([...objects, textObj]);
          setSelectedId(textObj.id);
          setTool("select");
          // Delay setting editingTextId so the textarea renders after state settles
          setTimeout(() => setEditingTextId(textObj.id), 50);
          return;
        }

        if (tool === "sticky") {
          const stickyObj: StickyObject = {
            id: generateId(),
            type: "sticky",
            x: wp.x,
            y: wp.y,
            width: 180,
            height: 180,
            content: "",
            color:
              STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
          };
          pushState([...objects, stickyObj]);
          setSelectedId(stickyObj.id);
          setTool("select");
          setTimeout(() => setEditingTextId(stickyObj.id), 50);
          return;
        }
      },
      [
        tool,
        camera,
        objects,
        screenToWorld,
        pushState,
        replaceState,
        color,
        setTool,
        eraserWidth,
      ],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        const scale = getBodyZoomScale();
        const sx = (e.clientX - rect.left) / scale;
        const sy = (e.clientY - rect.top) / scale;
        mousePosRef.current = { x: sx, y: sy };

        if (isPanningRef.current) {
          const dx = (e.clientX - panStartRef.current.x) / camera.zoom;
          const dy = (e.clientY - panStartRef.current.y) / camera.zoom;
          setCamera({
            ...camStartRef.current,
            x: camStartRef.current.x + dx,
            y: camStartRef.current.y + dy,
          });
          return;
        }

        const wp = screenToWorld(sx, sy);

        if (isDraggingObjRef.current && selectedId) {
          const obj = objects.find((o) => o.id === selectedId);
          if (obj && obj.type !== "stroke") {
            const dx = wp.x - dragStartRef.current.x;
            const dy = wp.y - dragStartRef.current.y;
            const updated = objects.map((o) =>
              o.id === selectedId
                ? {
                    ...o,
                    x: dragObjStartRef.current.x + dx,
                    y: dragObjStartRef.current.y + dy,
                  }
                : o,
            );
            // Update in-place (no push to history yet, will push on mouseup)
            replaceState(updated);
          }
          return;
        }

        if (!isDrawingRef.current) return;

        // Eraser drag: continuously erase objects under cursor
        if (tool === "eraser") {
          const result = eraseAt(
            objects,
            wp,
            eraserWidth / camera.zoom,
            activeEraserRef.current,
          );
          if (result.changed) {
            replaceState(result.objects);
          }
          return;
        }

        if (tool === "pen" || tool === "finePen" || tool === "highlighter") {
          currentStrokeRef.current.push(wp);
        }

        if (tool === "shape") {
          const st = shapeStartRef.current;
          tempShapeRef.current = {
            id: "temp-shape",
            type: "shape",
            shapeType: selectedShape,
            x: st.x,
            y: st.y,
            width: wp.x - st.x,
            height: wp.y - st.y,
            fillColor: color,
            strokeColor: color,
            strokeWidth: 2,
            rotation: 0,
          };
        }
      },
      [
        tool,
        camera,
        objects,
        selectedId,
        screenToWorld,
        selectedShape,
        color,
        replaceState,
        eraserWidth,
      ],
    );

    const handleMouseUp = useCallback(() => {
      activeEraserRef.current = {};
      // Cancel any pending long-press pan timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isPanningRef.current) {
        isPanningRef.current = false;
        if (containerRef.current) containerRef.current.style.cursor = "";
        return;
      }
      if (isDraggingObjRef.current) {
        isDraggingObjRef.current = false;
        return;
      }
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      if (
        (tool === "pen" || tool === "finePen" || tool === "highlighter") &&
        currentStrokeRef.current.length > 1
      ) {
        const stroke: StrokeObject = {
          id: generateId(),
          type: "stroke",
          tool: tool as any,
          points: [...currentStrokeRef.current],
          color,
          width:
            tool === "finePen"
              ? 1
              : tool === "highlighter"
                ? highlighterWidth
                : strokeWidth,
          opacity: tool === "highlighter" ? 0.8 : 1,
        };
        pushState([...objects, stroke]);
      }
      currentStrokeRef.current = [];

      if (tool === "shape" && tempShapeRef.current) {
        const shape: ShapeObject = {
          ...tempShapeRef.current,
          id: generateId(),
        };
        tempShapeRef.current = null;
        if (Math.abs(shape.width) > 3 || Math.abs(shape.height) > 3) {
          pushState([...objects, shape]);
        }
      }
    }, [tool, color, strokeWidth, highlighterWidth, objects, pushState]);

    // ─── Touch handlers ──────────────────────────────────────
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        // Two-finger: pinch-to-zoom
        if (e.touches.length === 2) {
          e.preventDefault();
          if (plan === "basic") return;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinchDistRef.current = Math.hypot(dx, dy);
          pinchZoomStartRef.current = camera.zoom;
          // Also start a two-finger pan
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          isPanningRef.current = true;
          panStartRef.current = { x: mx, y: my };
          camStartRef.current = { ...camera };
          return;
        }

        const touch = e.touches[0];
        // Synthesize a fake mouse event with clientX/clientY + button=0
        const syntheticEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation(),
        } as unknown as React.MouseEvent;
        handleMouseDown(syntheticEvent);
      },
      [handleMouseDown, camera, plan],
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        // Two-finger: pinch-to-zoom + pan
        if (e.touches.length === 2) {
          e.preventDefault();
          if (plan === "basic") return;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          if (pinchDistRef.current !== null) {
            const scale = dist / pinchDistRef.current;
            setCamera((c) => ({
              ...c,
              zoom: Math.max(
                0.1,
                Math.min(5, pinchZoomStartRef.current * scale),
              ),
            }));
          }
          // Two-finger pan
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          if (isPanningRef.current) {
            const panDx = (mx - panStartRef.current.x) / camera.zoom;
            const panDy = (my - panStartRef.current.y) / camera.zoom;
            setCamera((prev) => ({
              ...prev,
              x: camStartRef.current.x + panDx,
              y: camStartRef.current.y + panDy,
            }));
          }
          return;
        }

        const touch = e.touches[0];
        const syntheticEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation(),
        } as unknown as React.MouseEvent;
        handleMouseMove(syntheticEvent);
      },
      [handleMouseMove, camera, plan],
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        // If a pinch was active and all fingers lifted, end pinch
        if (pinchDistRef.current !== null) {
          pinchDistRef.current = null;
          if (e.touches.length === 0) {
            isPanningRef.current = false;
          }
          return;
        }
        handleMouseUp();
      },
      [handleMouseUp],
    );

    // Prevent default touch actions (scroll/zoom) on the canvas
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const prevent = (e: TouchEvent) => {
        if (e.touches.length >= 1) e.preventDefault();
      };
      el.addEventListener("touchmove", prevent, { passive: false });
      return () => el.removeEventListener("touchmove", prevent);
    }, []);

    // Wheel for zoom
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();
        if (plan === "basic") return;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setCamera((c) => ({
          ...c,
          zoom: Math.max(0.1, Math.min(5, c.zoom * delta)),
        }));
      },
      [plan],
    );

    // Image paste / upload
    const handleImageUpload = useCallback(() => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const ratio = img.width / img.height;
            const w = Math.min(400, img.width);
            const h = w / ratio;
            const wp = screenToWorld(200, 200);
            const imgObj: ImageObject = {
              id: generateId(),
              type: "image",
              x: wp.x,
              y: wp.y,
              width: w,
              height: h,
              src,
            };
            imageCacheRef.current.set(imgObj.id, img);
            pushState([...objects, imgObj]);
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }, [objects, pushState, screenToWorld]);

    const handleExport = useCallback(() => {
      if (plan === "basic") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = "freeform-canvas.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }, [plan]);

    const handleClearAll = useCallback(() => {
      pushState([]);
      setSelectedId(null);
      setEditingTextId(null);
    }, [pushState]);

    const handleZoomIn = () =>
      setCamera((c) => ({ ...c, zoom: Math.min(5, c.zoom * 1.2) }));
    const handleZoomOut = () =>
      setCamera((c) => ({ ...c, zoom: Math.max(0.1, c.zoom / 1.2) }));
    const handleZoomReset = () => setCamera({ x: 0, y: 0, zoom: 1 });

    // ─── Inline text editing overlay ─────────────────────────
    const editingObj = editingTextId
      ? objects.find((o) => o.id === editingTextId)
      : null;
    const editingOverlayStyle: React.CSSProperties | undefined =
      editingObj && (editingObj.type === "text" || editingObj.type === "sticky")
        ? {
            left: ((editingObj as any).x + camera.x) * camera.zoom,
            top: ((editingObj as any).y + camera.y) * camera.zoom,
            width: (editingObj as any).width * camera.zoom,
            minHeight: (editingObj as any).height * camera.zoom,
            fontSize:
              (editingObj.type === "text"
                ? (editingObj as TextObject).fontSize
                : 13) * camera.zoom,
            ...(editingObj.type === "sticky"
              ? { backgroundColor: (editingObj as StickyObject).color }
              : {}),
          }
        : undefined;

    const handleTextChange = useCallback(
      (content: string, width: number, height: number) => {
        if (!editingTextId) return;
        const updated = objects.map((o) =>
          o.id === editingTextId ? { ...o, content, width, height } : o,
        );
        replaceState(updated);
      },
      [editingTextId, objects, replaceState],
    );

    const handleTextBlur = useCallback(() => {
      setEditingTextId(null);
    }, []);

    if (!visible) return null;

    const toolList: { id: ToolType; icon: JSX.Element; label: string }[] = [
      {
        id: "select",
        label: t.freeform_tool_select,
        icon: <SelectIcon width="18" height="18" />,
      },
      {
        id: "pen",
        label: t.freeform_tool_pen,
        icon: (
          <PenIcon
            width="18"
            height="18"
            strokeWidth={tool === "pen" ? Math.max(1, strokeWidth / 3) : 2}
          />
        ),
      },
      {
        id: "finePen",
        label: t.freeform_tool_fine_pen,
        icon: <FinePenIcon width="18" height="18" />,
      },
      {
        id: "highlighter",
        label: t.freeform_tool_highlighter,
        icon: <HighlighterIcon width="18" height="18" />,
      },
      {
        id: "eraser",
        label: t.freeform_tool_eraser,
        icon: <EraserIcon width="18" height="18" />,
      },
      {
        id: "text",
        label: t.freeform_tool_text,
        icon: <TextIcon width="18" height="18" />,
      },
      {
        id: "shape",
        label: t.freeform_tool_shape,
        icon: <ShapesIcon width="18" height="18" />,
      },
      {
        id: "sticky",
        label: t.freeform_tool_sticky,
        icon: <StickyIcon width="18" height="18" />,
      },
      {
        id: "image",
        label: t.freeform_tool_image,
        icon: <ImageIcon width="18" height="18" />,
      },
    ];

    return (
      <div
        className={`freeform-overlay${visible ? " visible" : ""} freeform-container`}
        data-theme={activeThemeClass}
      >
        {/* Pricing notice banner */}
        {showPricingBanner && (
          <div className="freeform-pricing-banner">
            <span>{t.freeform_pricing_notice}</span>
            <a
              href="https://www.buymeacoffee.com/amithb"
              target="_blank"
              rel="noopener noreferrer"
              className="freeform-bmc-btn"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                style={{ height: 28, width: "auto" }}
              />
            </a>
            <button
              className="freeform-pricing-banner-dismiss"
              onClick={dismissPricingBanner}
              title={t.freeform_dismiss}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Bar */}
        <div className="freeform-topbar">
          <div className="freeform-topbar-left">
            <button
              className="freeform-close-btn"
              onClick={onClose}
              title={t.freeform_close}
            >
              <CloseIcon width="14" height="14" />
            </button>
            <span className="freeform-title">{t.freeform}</span>
          </div>
          <div className="freeform-topbar-right">
            <button
              className="freeform-action-btn"
              onClick={toggleTheme}
              title={t.theme || "Toggle Theme"}
            >
              {isDarkTheme ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              )}
            </button>
            <button
              className="freeform-action-btn"
              onClick={undo}
              disabled={!canUndo}
              title={t.freeform_undo}
            >
              <UndoIcon width="16" height="16" />
            </button>
            <button
              className="freeform-action-btn"
              onClick={redo}
              disabled={!canRedo}
              title={t.freeform_redo}
            >
              <RedoIcon width="16" height="16" />
            </button>
            <button
              className="freeform-action-btn"
              onClick={handleExport}
              title={t.freeform_export}
            >
              <ExportIcon width="16" height="16" />
            </button>
            <button
              className="freeform-action-btn"
              onClick={handleClearAll}
              title={t.freeform_clear_all}
            >
              <ClearAllIcon width="16" height="16" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={`freeform-canvas-area tool-${tool}${isPanningRef.current ? " panning" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            mousePosRef.current = null;
            activeEraserRef.current = {};
            handleMouseUp();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onWheel={handleWheel}
          onDoubleClick={(e) => {
            if (tool === "select" && selectedId) {
              const obj = objects.find((o) => o.id === selectedId);
              if (obj && (obj.type === "text" || obj.type === "sticky")) {
                setEditingTextId(selectedId);
              }
            }
          }}
        >
          <canvas
            ref={canvasRef}
            className="freeform-canvas"
            style={{ pointerEvents: "none" }}
          />

          {/* Inline text editing */}
          {editingObj && editingOverlayStyle && (
            <textarea
              ref={(el) => {
                if (el) {
                  el.focus();
                }
              }}
              className={
                editingObj.type === "sticky"
                  ? "freeform-sticky-overlay"
                  : "freeform-text-overlay"
              }
              style={{
                ...editingOverlayStyle,
                pointerEvents: "auto",
                zIndex: 10,
                resize: "both",
                overflow: "hidden",
              }}
              value={(editingObj as any).content}
              onChange={(e) => {
                const el = e.target;
                el.style.height = "auto"; // allow shrinking to calculate real scroll height
                const minHeight =
                  (editingObj.type === "sticky" ? 180 : 30) * camera.zoom;
                const newHeight = Math.max(minHeight, el.scrollHeight);
                el.style.height = newHeight + "px";
                handleTextChange(
                  el.value,
                  (editingObj as any).width,
                  newHeight / camera.zoom,
                );
              }}
              onMouseUp={(e) => {
                // Capture manual resize drag corner
                const w = (e.target as any).offsetWidth / camera.zoom;
                const h = (e.target as any).offsetHeight / camera.zoom;
                handleTextChange((editingObj as any).content, w, h);
              }}
              onBlur={handleTextBlur}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={t.freeform_placeholder}
            />
          )}
        </div>

        {/* Floating Toolbar */}
        <div className="freeform-toolbar">
          {toolList.map((toolItem) => {
            const isDisabled = plan === "basic" && isProTool(toolItem.id);
            return (
              <button
                key={toolItem.id}
                className={`freeform-tool-btn${tool === toolItem.id ? " active" : ""}`}
                style={{
                  opacity: isDisabled ? 0.3 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
                disabled={isDisabled}
                onClick={() => {
                  if (toolItem.id === "image") {
                    handleImageUpload();
                    return;
                  }
                  const isSameTool = tool === toolItem.id;
                  setTool(toolItem.id);
                  setShowColorPicker(false);
                  setShowShapePicker(false);
                  setShowEraserPicker(false);
                  setShowPenPicker(false);
                  setShowHighlighterPicker(false);
                  if (toolItem.id === "shape") {
                    setShowShapePicker(!isSameTool || !showShapePicker);
                  } else if (toolItem.id === "eraser") {
                    setShowEraserPicker(!isSameTool || !showEraserPicker);
                  } else if (toolItem.id === "pen") {
                    setShowPenPicker(!isSameTool || !showPenPicker);
                  } else if (toolItem.id === "highlighter") {
                    setShowHighlighterPicker(
                      !isSameTool || !showHighlighterPicker,
                    );
                  }
                }}
                title={
                  toolItem.label +
                  (isDisabled ? ` (${t.freeform_pro_only})` : "")
                }
              >
                {toolItem.icon}
              </button>
            );
          })}

          <div className="freeform-toolbar-divider" />

          {/* Color button */}
          <button
            className="freeform-color-btn"
            style={{ background: color }}
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowShapePicker(false);
              setShowEraserPicker(false);
              setShowPenPicker(false);
              setShowHighlighterPicker(false);
            }}
            title={t.freeform_color}
          />

          {/* Color picker popup */}
          {showColorPicker && (
            <div
              className="freeform-picker-popup"
              style={{ right: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="freeform-color-grid">
                {COLORS.map((c) => {
                  const isColorDisabled = plan === "basic" && !isBasicColor(c);
                  return (
                    <button
                      key={c}
                      className={`freeform-color-swatch${color === c ? " active" : ""}`}
                      style={{
                        background: c,
                        opacity: isColorDisabled ? 0.3 : 1,
                        cursor: isColorDisabled ? "not-allowed" : "pointer",
                      }}
                      disabled={isColorDisabled}
                      title={isColorDisabled ? t.freeform_pro_only : undefined}
                      onClick={() => {
                        setColor(c);
                        setShowColorPicker(false);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Shape picker */}
          {showShapePicker && (
            <div
              className="freeform-shapes-popup"
              style={{ right: 40 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="freeform-shapes-title">
                {t.freeform_shapes_title}
              </div>
              <div className="freeform-shapes-grid">
                {SHAPE_LIST.map((s) => (
                  <button
                    key={s.type}
                    className={`freeform-shape-btn${selectedShape === s.type ? " active" : ""}`}
                    onClick={() => {
                      setSelectedShape(s.type);
                      setShowShapePicker(false);
                    }}
                    title={t[s.labelKey as keyof typeof t] as string}
                  >
                    <ShapeIcon type={s.type} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Eraser picker */}
          {showEraserPicker && tool === "eraser" && (
            <div
              className="freeform-shapes-popup"
              style={{ right: 80 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="freeform-shapes-title">
                {t.freeform_eraser_size}
              </div>
              <div style={{ padding: "0 8px 8px" }}>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={eraserWidth}
                  className="freeform-width-slider"
                  onChange={(e) => setEraserWidth(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Pen picker */}
          {showPenPicker && tool === "pen" && (
            <div
              className="freeform-shapes-popup"
              style={{ right: 120 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="freeform-shapes-title">
                {t.freeform_stroke_width}: {strokeWidth}px
              </div>
              <div style={{ padding: "0 8px 8px" }}>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  className="freeform-width-slider"
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Highlighter picker */}
          {showHighlighterPicker && tool === "highlighter" && (
            <div
              className="freeform-shapes-popup"
              style={{ right: 120 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="freeform-shapes-title">
                {t.freeform_stroke_width}: {highlighterWidth}px
              </div>
              <div style={{ padding: "0 8px 8px" }}>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={highlighterWidth}
                  className="freeform-width-slider"
                  onChange={(e) => setHighlighterWidth(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div
          className="freeform-zoom-controls"
          style={{
            opacity: plan === "basic" ? 0.3 : 1,
            pointerEvents: plan === "basic" ? "none" : "auto",
          }}
          title={plan === "basic" ? t.freeform_zoom_locked : ""}
        >
          <button
            className="freeform-zoom-btn"
            onClick={handleZoomIn}
            title={t.freeform_zoom_in}
          >
            +
          </button>
          <div className="freeform-zoom-label">
            {Math.round(camera.zoom * 100)}%
          </div>
          <button
            className="freeform-zoom-btn"
            onClick={handleZoomOut}
            title={t.freeform_zoom_out}
          >
            −
          </button>
          <button
            className="freeform-zoom-btn"
            onClick={handleZoomReset}
            title={t.freeform_zoom_reset}
            style={{ fontSize: 18 }}
          >
            ⟲
          </button>
        </div>
      </div>
    );
  },
);

export default Freeform;
