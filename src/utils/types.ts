// src/utils/types.ts
export interface Point {
  x: number;            // data point center X
  y: number;            // data point center Y
  text: string;         // label text
  width: number;        // estimated pixel width of the label text
  height: number;       // estimated pixel height of the label text
}

export interface LabelBox {
  x: number;            // top-left X of the label box
  y: number;            // top-left Y of the label box
  width: number;        // box width (from Point.width)
  height: number;       // box height (from Point.height)
  rotation: number;     // rotation angle (in radians) around box center
  text: string;         // label text (for rendering)
  forPoint: Point;      // original point that this label describes
}

export interface ChartSize {
  width: number;
  height: number;
}

export interface RTreeBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  __ref: LabelBox;      // reference back to our LabelBox
}

export interface DebugInfo {
  point: Point;
  candidates: Array<{
    x: number;
    y: number;
    rotation: number;
    score: number;
    scoreBreakdown?: {
      overlapPenalty?: number;
      pointPenalty?: number;
      outOfBoundsPenalty?: number;
      idealAngleBonus?: number;
    };
  }>;
  selectedCandidateIndex: number;
  placedLabels: Array<{x: number, y: number, text: string}>;
}

export interface LabelPlacerOptions {
  radius?: number;         // base radius (in px) from point to label center
  rings?: number;          // how many rings of candidates (radial expansion)
  anglesPerRing?: number;  // how many angles on each ring
  padding?: number;        // min padding from chart edges
  overlapPenalty?: number; // penalty for overlapping an existing label
  pointPenalty?: number;   // penalty for covering a point
  outOfBoundsPenalty?: number; 
  idealAngleBonus?: number; // bonus for matching "preferred" angles
  debug?: boolean;         // enable debug logging and visualization
}

// Extend Chart.js types
declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType> {
    labelPlacer?: {
      debug?: boolean;
    };
  }
}
