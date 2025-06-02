// src/plugins/ChartJsLabelPlugin.ts
import { Plugin, Chart, ScatterDataPoint, Scale, CoreScaleOptions } from "chart.js";
import { LabelPlacer } from "../utils/LabelPlacer";
import { measureText } from "../utils/measureText";
import { Point } from "../utils/types";

// Define our custom plugin options
interface LabelPlacerPluginOptions {
  enabled?: boolean;
  dataLabelFontSize?: number;
  debug?: boolean;
}

interface ExtendedScale extends Scale<CoreScaleOptions> {
  min: number;
  max: number;
  getPixelForValue: (value: number) => number;
}

// Create a type that extends Chart but overrides the scales property
interface ChartWithScales extends Omit<Chart, 'scales' | 'options'> {
  scales: {
    x: ExtendedScale;
    y: ExtendedScale;
    [key: string]: ExtendedScale;
  };
  options: {
    scales?: {
      x?: {
        grid?: {
          color?: string;
        };
      };
      y?: {
        grid?: {
          color?: string;
        };
      };
    };
    plugins?: {
      // Use labelPlacer for our plugin options
      labelPlacer?: LabelPlacerPluginOptions;
      // Add index signature to allow any plugin options
      [key: string]: any;
    };
  };
}

// Extend the Point interface to include additional properties
interface ExtendedPoint extends Point {
  backgroundColor?: string;
  _orig?: unknown;
  allPoints?: Point[];
}

// Helper function to get theme colors based on chart options
const getThemeColors = (chart: ChartWithScales) => {
  const isDark = chart.options.scales?.x?.grid?.color === 'rgba(255, 255, 255, 0.1)' || 
                 chart.options.scales?.y?.grid?.color === 'rgba(255, 255, 255, 0.1)';
  
  return {
    text: isDark ? '#ffffff' : '#000000',
    line: isDark ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.3)',
    debugText: isDark ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 100, 0, 0.8)',
    debugBg: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
  };
};

const ChartJsLabelPlugin: Plugin<"scatter"> = {
  id: "chartJsLabelPlugin",
  afterDraw: (chart: Chart) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    const theme = getThemeColors(chart as unknown as ChartWithScales);
    const pluginOptions = (chart as ChartWithScales).options?.plugins?.labelPlacer;
    
    // Skip if plugin is disabled
    if (pluginOptions?.enabled === false) {
      return;
    }
    
    try {
      // 1) Prepare Point objects from all datasets
      const points: Point[] = [];
      const pointMap = new Map<string, Point>();
      
      (chart.data.datasets || []).forEach(dataset => {
        const datasetPoints = Array.isArray(dataset.data) ? dataset.data : [];
        datasetPoints.forEach((pt: ScatterDataPoint | unknown) => {
          const pointData = pt as ScatterDataPoint & { label?: string; backgroundColor?: string };
          if (pointData && 'label' in pointData && pointData.label) {
            // get pixel coordinates from chart's scales:
            const xScale = (chart as ChartWithScales).scales.x;
            const yScale = (chart as ChartWithScales).scales.y;
            const xValue = Number(pointData.x);
            const yValue = Number(pointData.y);
            
            if (isNaN(xValue) || isNaN(yValue)) {
              return; // Skip invalid data points
            }
            
            const pixelX = xScale.getPixelForValue(xValue);
            const pixelY = yScale.getPixelForValue(yValue);
            
            // Extract just the coordinate part from the label (e.g., "(1, 2)" from "Red (1, 2)")
            const labelText = String(pointData.label || '');
            const coordMatch = labelText.match(/\([\d.-]+\s*,\s*[\d.-]+\)/);
            const cleanLabel = coordMatch ? coordMatch[0] : labelText;
            
            const point: ExtendedPoint = {
              x: pixelX,
              y: pixelY,
              text: cleanLabel,
              width: measureText(ctx, cleanLabel, "12px sans-serif").width,
              height: measureText(ctx, cleanLabel).height // Using default font for height
            };
            
            // Add optional properties
            if (pointData.backgroundColor) {
              point.backgroundColor = pointData.backgroundColor;
            } else if (dataset.backgroundColor) {
              point.backgroundColor = dataset.backgroundColor as string;
            } else {
              point.backgroundColor = theme.text;
            }
            
            point._orig = pointData;
            point.allPoints = []; // Will be set below
            
            points.push(point);
            pointMap.set(`${pixelX},${pixelY}`, point);
          }
        });
      });
      
      // Attach allPoints to each point for overlap logic
      points.forEach((pt: ExtendedPoint) => { 
        pt.allPoints = points; 
      });

      // 2) Place labels with debug option
      const placer = new LabelPlacer(
        { 
          width: chartArea.right - chartArea.left, 
          height: chartArea.bottom - chartArea.top 
        },
        {
          radius: 10,            // Reduced base radius - will be adjusted to respect 2px boundary
          rings: 5,              // Increased rings for more placement options when crowded
          anglesPerRing: 32,     // 32 angles = every 11.25 degrees for denser coverage
          debug: true,
          padding: 0,            // Remove edge padding
          overlapPenalty: 100000,// Massive penalty for overlaps
          pointPenalty: 500,
          outOfBoundsPenalty: 0, // Remove out-of-bounds penalty to allow edge placement
          idealAngleBonus: 0     // No directional bias
        }
      );
      
      const labelBoxes = placer.placeAll(points);

      // 3) Draw labels on top
      ctx.save();
      
      // Disable image smoothing for sharp text rendering
      ctx.imageSmoothingEnabled = false;
      
      // Set text rendering for sharpness
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Use font size from chart options if available
      const fontSize = (chart as unknown as ChartWithScales).options?.plugins?.labelPlacer?.dataLabelFontSize || 12;
      // Use system-ui font for better rendering
      ctx.font = `${Math.round(fontSize)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      
      // Disable subpixel rendering
      ctx.translate(0.5, 0.5);
      
      for (const label of labelBoxes) {
        ctx.save();
        
        // Round to nearest pixel for sharp rendering
        const cx = Math.round(label.x + label.width / 2);
        const cy = Math.round(label.y + label.height / 2);
        
        // Draw the label text with crisp rendering
        ctx.translate(cx, cy);
        ctx.fillStyle = (label as any).forPoint?.backgroundColor || theme.text;
        
        // Draw text with crisp rendering
        ctx.translate(-0.5, -0.5); // Offset for sharpness
        ctx.fillText(label.text, 0, 0);
        
        ctx.restore();
      }

      ctx.restore();
    } catch (error) {
      console.error('Error in LabelPlacer:', error);
    }
  },
};

export default ChartJsLabelPlugin;