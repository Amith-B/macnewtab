export type ToolType = 'select' | 'pen' | 'finePen' | 'highlighter' | 'eraser' | 'text' | 'shape' | 'sticky' | 'image';

export type ShapeType =
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'roundedRectangle'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'pentagon'
  | 'speechBubble';

export interface Point {
  x: number;
  y: number;
}

export interface ErasedStroke {
  points: Point[];
  width: number;
}

export interface StrokeObject {
  id: string;
  type: 'stroke';
  tool: 'pen' | 'finePen' | 'highlighter';
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  erasedStrokes?: ErasedStroke[];
}

export interface ShapeObject {
  id: string;
  type: 'shape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  rotation: number;
  erasedStrokes?: ErasedStroke[];
}

export interface TextObject {
  id: string;
  type: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  erasedStrokes?: ErasedStroke[];
}

export interface StickyObject {
  id: string;
  type: 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  erasedStrokes?: ErasedStroke[];
}

export interface ImageObject {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  erasedStrokes?: ErasedStroke[];
}

export type CanvasObject = StrokeObject | ShapeObject | TextObject | StickyObject | ImageObject;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface FreeformState {
  objects: CanvasObject[];
  camera: Camera;
}
