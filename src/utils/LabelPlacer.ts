// src/utils/LabelPlacer.ts
import Rbush from "rbush";
import { LabelBox, ChartSize, RTreeBox, DebugInfo } from "./types";

// Helper: convert a LabelBox into an RTree‐compatible box with padding
function toRTreeBox(label: LabelBox, padding: number = 2): RTreeBox {
  return {
    minX: label.x - padding,
    minY: label.y - padding,
    maxX: label.x + label.width + padding,
    maxY: label.y + label.height + padding,
    __ref: label,
  };
}

// Simple rectangle interface for point-in-rect check
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Check if a point sits inside a rectangle
function pointInRect(px: number, py: number, rect: Rect): boolean {
  return px >= rect.x && px <= rect.x + rect.width && 
         py >= rect.y && py <= rect.y + rect.height;
}

interface Point {
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  allPoints?: Point[]; // Reference to all points for point-in-rect checks
}

interface Candidate {
  x: number;
  y: number;
  rotation: number;      // rotation in radians
  score: number;
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
}

const DEFAULT_OPTIONS: Required<LabelPlacerOptions & { debug: boolean }> = {
  radius: 10,            // Reduced base radius to place labels closer (will be adjusted to respect 2px boundary)
  rings: 5,              // Increased rings for more placement options when crowded
  anglesPerRing: 32,     // 32 angles per ring → every 11.25�� for denser coverage
  padding: 4,
  overlapPenalty: 1000,
  pointPenalty: 500,
  outOfBoundsPenalty: 300,
  idealAngleBonus: 0,    // Removed angle bias to ensure equal consideration of all directions
  debug: false,          // enable debug logging and visualization
};

export class LabelPlacer {
  private tree: Rbush<RTreeBox>;
  private placedLabels: LabelBox[] = [];
  private options: Required<LabelPlacerOptions & { debug: boolean }>;
  private debugInfo: DebugInfo[] = [];
  constructor(
    private chartSize: ChartSize,
    options: Partial<LabelPlacerOptions & { debug?: boolean }> = {}
  ) {
    this.tree = new Rbush<RTreeBox>();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Get debug information for all placed labels
  public getDebugInfo(): DebugInfo[] {
    return this.debugInfo;
  }

  // Clear debug information
  public clearDebugInfo(): void {
    this.debugInfo = [];
  }

  // Public: call this with all points; returns placed label boxes
  placeAll(points: Point[]): LabelBox[] {
    this.tree.clear();
    this.placedLabels = [];
    this.debugInfo = [];

    // Process points with labels
    const pointsWithLabels = points.filter(pt => pt.text && pt.text.trim() !== '');
    
    // Group points by position to handle overlapping points
    const pointGroups = new Map<string, Point[]>();
    pointsWithLabels.forEach(pt => {
      const key = `${Math.round(pt.x)},${Math.round(pt.y)}`;
      if (!pointGroups.has(key)) {
        pointGroups.set(key, []);
      }
      pointGroups.get(key)!.push(pt);
    });
    
    // Sort groups by y-position, then process
    const sortedGroups = Array.from(pointGroups.entries())
      .sort(([, a], [, b]) => a[0].y - b[0].y);

    // Place labels one by one
    for (const [, groupPoints] of sortedGroups) {
      // For overlapping points, combine their labels
      if (groupPoints.length > 1) {
        const combinedText = groupPoints.map(p => p.text).join(', ');
        const firstPoint = groupPoints[0];
        const combinedPoint = {
          ...firstPoint,
          text: combinedText,
          width: Math.max(...groupPoints.map(p => p.width)),
          height: Math.max(...groupPoints.map(p => p.height))
        };
        const label = this.placeLabelForPoint(combinedPoint);
        if (label) {
          this.tree.insert(toRTreeBox(label));
          this.placedLabels.push(label);
        }
      } else {
        const label = this.placeLabelForPoint(groupPoints[0]);
        if (label) {
          this.tree.insert(toRTreeBox(label));
          this.placedLabels.push(label);
        }
      }
    }

    return this.placedLabels;
  }

  // Place a single label for `pt`, given already‐placed labels and all data points
  private placeLabelForPoint(pt: Point): LabelBox | null {
    const candidates = this.generateCandidates(pt);
    const debugCandidates: DebugInfo['candidates'] = [];
    
    // Score each candidate
    const scored: Candidate[] = candidates.map(c => {
      let score = 0;
      const scoreBreakdown: Record<string, number> = {};

      // 1) Overlap with existing labels → heavy penalty
      // Add 2px padding around labels to prevent them from touching
      const labelPadding = 2;
      const collisions = this.tree.search({
        minX: c.x - labelPadding,
        minY: c.y - labelPadding,
        maxX: c.x + pt.width + labelPadding,
        maxY: c.y + pt.height + labelPadding,
      });
      if (collisions.length > 0) {
        // Massive penalty for any overlap
        const penalty = 100000 * collisions.length; // Increased from 1000 to 100000
        score -= penalty;
        scoreBreakdown.overlapPenalty = -penalty;
      }

      // 2) Covering other data points → medium penalty
      let pointPenalty = 0;
      if (pt.allPoints) {
        for (const otherPt of pt.allPoints) {
          if (otherPt === pt) continue; // skip self
          if (pointInRect(otherPt.x, otherPt.y, {
            x: c.x, 
            y: c.y, 
            width: pt.width, 
            height: pt.height
          })) {
            pointPenalty += this.options.pointPenalty;
          }
        }
        if (pointPenalty > 0) {
          score -= pointPenalty;
          scoreBreakdown.pointPenalty = -pointPenalty;
        }
      }

      // Calculate label center position once
      const labelCenterX = c.x + pt.width / 2;
      const labelCenterY = c.y + pt.height / 2;
      
      // 2.5) Border proximity penalty (strongly discourage being near edges)
      const borderDistances = {
        left: labelCenterX,
        right: this.chartSize.width - labelCenterX,
        top: labelCenterY,
        bottom: this.chartSize.height - labelCenterY
      };
      
      // Calculate minimum distance to any border
      const minBorderDistance = Math.min(
        borderDistances.left,
        borderDistances.right,
        borderDistances.top,
        borderDistances.bottom
      );
      
      // Strong penalty for being too close to any border
      const borderThreshold = 10; // pixels
      if (minBorderDistance < borderThreshold) {
        // Quadratic penalty that gets much worse as we get closer to the edge
        const borderPenalty = Math.pow((borderThreshold - minBorderDistance) / borderThreshold, 2) * 100;
        score -= borderPenalty;
        scoreBreakdown.borderPenalty = -borderPenalty;
      }
      
      // 2.6) Prefer positions that are more centered in the chart
      const centerX = this.chartSize.width / 2;
      const centerY = this.chartSize.height / 2;
      
      // Calculate distance from center (normalized to 0-1)
      const dx = (labelCenterX - centerX) / (this.chartSize.width / 2);
      const dy = (labelCenterY - centerY) / (this.chartSize.height / 2);
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2; // Normalized to 0-1
      
      // Add a bonus for being more centered (helps with edge cases)
      const centerBonus = (1 - distanceFromCenter) * 10; // Up to 10 points for being centered
      score += centerBonus;
      scoreBreakdown.centerBonus = centerBonus;

      // 3) Out-of-bounds penalty (if any part of the label is outside the chart)
      if (this.isOutOfBounds({ x: c.x, y: c.y, width: pt.width, height: pt.height })) {
        score -= this.options.outOfBoundsPenalty;
        scoreBreakdown.outOfBoundsPenalty = -this.options.outOfBoundsPenalty;
      }

      // 4) Distance from point - STRONGLY prefer closer positions
      const distance = Math.sqrt(
        Math.pow(labelCenterX - pt.x, 2) + 
        Math.pow(labelCenterY - pt.y, 2)
      );
      // Strong penalty for distance - the further away, the worse the score
      // This ensures labels are placed as close as possible without violating boundaries
      const distancePenalty = distance * 10; // 10 points penalty per pixel of distance
      score -= distancePenalty;
      scoreBreakdown.distancePenalty = -distancePenalty;

      // Store debug info for this candidate
      debugCandidates.push({
        ...c,
        score,
        scoreBreakdown: Object.keys(scoreBreakdown).length > 0 ? scoreBreakdown : undefined
      });

      return { ...c, score };
    });

    // Apply distance and overlap penalties
    for (let cand of scored) {
      // Calculate label center position (commented out as not currently used)
      // const labelCenterX = cand.x + pt.width / 2;
      // const labelCenterY = cand.y + pt.height / 2;
      
      // Distance calculation (commented out as not currently used)
      // const distance = Math.sqrt(
      //   Math.pow(labelCenterX - pt.x, 2) + 
      //   Math.pow(labelCenterY - pt.y, 2)
      // );
      
      // Minimum distance requirement (point radius + 1px boundary)
      const pointRadius = 6; // Assuming default point size
      const boundaryBuffer = 1; // 1px boundary around the point
      const exclusionRadius = pointRadius + boundaryBuffer; // Total exclusion zone (7px)
      
      // Check if any corner of the label box is within the exclusion zone
      const labelCorners = [
        { x: cand.x, y: cand.y },                          // top-left
        { x: cand.x + pt.width, y: cand.y },              // top-right
        { x: cand.x, y: cand.y + pt.height },              // bottom-left
        { x: cand.x + pt.width, y: cand.y + pt.height }    // bottom-right
      ];
      
      let violatesBoundary = false;
      for (const corner of labelCorners) {
        const cornerDistance = Math.sqrt(
          Math.pow(corner.x - pt.x, 2) + 
          Math.pow(corner.y - pt.y, 2)
        );
        if (cornerDistance < exclusionRadius) {
          violatesBoundary = true;
          break;
        }
      }
      
      // Also check if the label box overlaps with the exclusion zone
      const labelLeft = cand.x;
      const labelRight = cand.x + pt.width;
      const labelTop = cand.y;
      const labelBottom = cand.y + pt.height;
      
      // Point exclusion zone bounds
      const exclusionLeft = pt.x - exclusionRadius;
      const exclusionRight = pt.x + exclusionRadius;
      const exclusionTop = pt.y - exclusionRadius;
      const exclusionBottom = pt.y + exclusionRadius;
      
      // Check for overlap with exclusion zone
      const overlapsHorizontally = labelLeft < exclusionRight && labelRight > exclusionLeft;
      const overlapsVertically = labelTop < exclusionBottom && labelBottom > exclusionTop;
      
      if ((overlapsHorizontally && overlapsVertically) || violatesBoundary) {
        cand.score -= 100000; // massive penalty for violating the 1px boundary
      }
    }

    // Pick candidate with max score
    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0];
    
    // If the best candidate still has overlap penalty, skip this label
    if (chosen.score <= -100000) {
      console.warn(`Could not place label "${pt.text}" without overlap`);
      return null;
    }
    
    const selectedCandidateIndex = scored.findIndex(c => c === chosen);

    // Label center position (commented out as not currently used)
    // const labelCenterX = chosen.x + pt.width / 2;
    // const labelCenterY = chosen.y + pt.height / 2;
    // Distance calculation (commented out as not currently used)
    // const distance = Math.sqrt(
    //   Math.pow(labelCenterX - pt.x, 2) + 
    //   Math.pow(labelCenterY - pt.y, 2)
    // );

    // Add debug info for this point
    this.debugInfo.push({
      point: pt,
      candidates: debugCandidates,
      selectedCandidateIndex,
      placedLabels: this.placedLabels.map(l => ({
        x: l.x,
        y: l.y,
        text: l.text
      }))
    });

    // Double-check for overlaps before returning
    const labelPadding = 2;
    const finalCheck = this.tree.search({
      minX: chosen.x - labelPadding,
      minY: chosen.y - labelPadding,
      maxX: chosen.x + pt.width + labelPadding,
      maxY: chosen.y + pt.height + labelPadding,
    });
    
    if (finalCheck.length > 0) {
      console.warn(`Label "${pt.text}" would overlap with ${finalCheck.length} existing labels`);
    }

    return {
      x: chosen.x,
      y: chosen.y,
      width: pt.width,
      height: pt.height,
      rotation: chosen.rotation,
      text: pt.text,
      forPoint: pt,
    };
  }

  // Check if a label box is out of bounds of the chart area
  private isOutOfBounds(box: { x: number; y: number; width: number; height: number }): boolean {
    // Add a small margin (1px) to ensure labels don't touch the very edge
    const margin = 1;
    return (
      box.x < margin ||
      box.y < margin ||
      box.x + box.width > this.chartSize.width - margin ||
      box.y + box.height > this.chartSize.height - margin
    );
  }

  // Generate candidate positions around the point
  private generateCandidates(pt: Point): Candidate[] {
    const candidates: Candidate[] = [];
    const { radius, rings, anglesPerRing } = this.options;
    
    // Calculate minimum safe radius considering point size and 1px boundary
    const pointRadius = 6; // Default point size
    const boundaryBuffer = 1; // 1px boundary
    const exclusionRadius = pointRadius + boundaryBuffer; // 7px total
    
    // Get chart boundaries with margin
    const margin = 1;
    const minX = margin;
    const minY = margin;
    const maxX = this.chartSize.width - margin - pt.width;
    const maxY = this.chartSize.height - margin - pt.height;
    
    // Calculate exact placement distance for each direction
    // We want the label edge to be exactly 1px from the point edge
    
    // Cardinal directions (N, S, E, W) - used for reference in placement logic
    // const cardinalPlacements = [
    //   { angle: 0, dx: exclusionRadius, dy: 0 },           // East
    //   { angle: Math.PI/2, dx: 0, dy: exclusionRadius },    // South
    //   { angle: Math.PI, dx: -exclusionRadius, dy: 0 },     // West
    //   { angle: 3*Math.PI/2, dx: 0, dy: -exclusionRadius }, // North
    // ];
    
    // Add primary candidates at exactly 1px from point boundary
    // Use very dense angular coverage for the closest ring
    const primaryAngles = 64; // Very dense coverage
    const primaryAngleStep = (2 * Math.PI) / primaryAngles;
    
    for (let i = 0; i < primaryAngles; i++) {
      const angle = i * primaryAngleStep;
      
      // Calculate the exact distance needed for this angle
      // This ensures the closest point of the label is exactly 1px from the point edge
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Determine which edge of the label will be closest to the point
      let dx, dy;
      if (Math.abs(cos) > Math.abs(sin)) {
        // Horizontal edge is closer
        if (cos > 0) {
          // Right edge of point to left edge of label
          dx = exclusionRadius;
          dy = 0;
        } else {
          // Left edge of point to right edge of label
          dx = -exclusionRadius - pt.width;
          dy = 0;
        }
        // Adjust vertical position based on angle
        dy = sin * exclusionRadius - pt.height / 2;
      } else {
        // Vertical edge is closer
        if (sin > 0) {
          // Bottom edge of point to top edge of label
          dx = 0;
          dy = exclusionRadius;
        } else {
          // Top edge of point to bottom edge of label
          dx = 0;
          dy = -exclusionRadius - pt.height;
        }
        // Adjust horizontal position based on angle
        dx = cos * exclusionRadius - pt.width / 2;
      }
      
      // Calculate candidate position with boundary constraints
      let candidateX = pt.x + dx;
      let candidateY = pt.y + dy;
      
      // Ensure the label stays within chart boundaries
      candidateX = Math.max(minX, Math.min(candidateX, maxX));
      candidateY = Math.max(minY, Math.min(candidateY, maxY));
      
      // Only add the candidate if it's not too close to the point
      const distanceToPoint = Math.sqrt(
        Math.pow(candidateX + pt.width/2 - pt.x, 2) + 
        Math.pow(candidateY + pt.height/2 - pt.y, 2)
      );
      
      if (distanceToPoint >= exclusionRadius) {
        candidates.push({
          x: candidateX,
          y: candidateY,
          rotation: 0,
          score: 0
        });
      }
    }
    
    // Add more rings with increasing radius and sparser angles
    for (let r = 1; r < rings; r++) {
      const rScale = 1 + r * 0.5; // Increase radius by 1.5x each ring
      const angles = Math.max(8, Math.floor(anglesPerRing / (r + 1))); // Fewer angles in outer rings
      
      for (let i = 0; i < angles; i++) {
        const angle = (i / angles) * Math.PI * 2;
        let dx = Math.cos(angle) * (exclusionRadius * rScale);
        let dy = Math.sin(angle) * (exclusionRadius * rScale);
        
        // Calculate candidate position with boundary constraints
        let candidateX = pt.x + dx;
        let candidateY = pt.y + dy;
        
        // Ensure the label stays within chart boundaries
        candidateX = Math.max(minX, Math.min(candidateX, maxX));
        candidateY = Math.max(minY, Math.min(candidateY, maxY));
        
        // Only add the candidate if it's not too close to the point
        const distanceToPoint = Math.sqrt(
          Math.pow(candidateX + pt.width/2 - pt.x, 2) + 
          Math.pow(candidateY + pt.height/2 - pt.y, 2)
        );
        
        if (distanceToPoint >= exclusionRadius) {
          candidates.push({
            x: candidateX,
            y: candidateY,
            rotation: 0,
            score: 0
          });
        }
      }
    }

    // Add fallback rings at slightly larger distances
    for (let ring = 1; ring <= rings; ring++) {
      const r = exclusionRadius + (ring * 5); // 5px increments from the minimum
      const totalAngles = anglesPerRing;
      const angleStep = (2 * Math.PI) / totalAngles;
      
      for (let i = 0; i < totalAngles; i++) {
        const angle = i * angleStep;
        const x = pt.x + r * Math.cos(angle) - pt.width / 2;
        const y = pt.y + r * Math.sin(angle) - pt.height / 2;
        candidates.push({
          x,
          y,
          rotation: 0,
          score: 0
        });
      }
    }

    // Add intermediate angles for better coverage on other rings
    for (let ring = 1; ring <= rings; ring++) {
      const r = Math.max(exclusionRadius, radius * ring);
      const totalAngles = anglesPerRing;
      const angleStep = (2 * Math.PI) / totalAngles;
      const halfStep = angleStep / 2;
      
      // Add positions at half-steps between main angles
      for (let i = 0; i < totalAngles; i++) {
        const angle = i * angleStep + halfStep;
        const x = pt.x + r * Math.cos(angle) - pt.width / 2;
        const y = pt.y + r * Math.sin(angle) - pt.height / 2;
        candidates.push({
          x,
          y,
          rotation: 0,
          score: 0
        });
      }
    }

    return candidates;
  }

  // Note: Removed unused isWithinBounds method as it's not currently used in the codebase
}