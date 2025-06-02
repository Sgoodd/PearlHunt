import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  PointStyle,
  ScatterDataPoint // Import ScatterDataPoint for extending
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DataPoint, SERIES_COLORS, SeriesType } from '../types';
import ChartJsLabelPlugin from '../plugins/ChartJsLabelPlugin';
import type { Context as DatalabelContext } from 'chartjs-plugin-datalabels';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, ChartDataLabels, ChartJsLabelPlugin);

// TODO: Consider moving ChartJsLabelPluginOptions to ChartJsLabelPlugin.ts and exporting it from there
interface ChartJsLabelPluginOptions {
  enabled?: boolean;
  debug?: boolean;
  dataLabelFontSize?: number;
}

// Interface for custom data points used within the chart's datasets
interface ChartScatterDataPointCustom extends ScatterDataPoint {
  label: string;
  series: SeriesType;
  id: string;
}

interface ScatterPlotChartProps {
  data: DataPoint[];
  xAxisLabel: string;
  zAxisLabel: string;
  visibleSeries?: Set<SeriesType>;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  backgroundImageScale?: number;
  axisLabelFontSize?: number;
  axisTickFontSize?: number;
  dataLabelFontSize?: number;
  onImageUpdate?: (imageData: string) => void;
  showDataLabels?: boolean;
  pointImages?: { [key: string]: string };
  isDarkMode?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  pointSize?: number;
  useLabelPlacer?: boolean;
  rotation?: number;
  [key: string]: unknown; // Allow additional props to support Chart.js options
}

const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({
  data,
  // xAxisLabel, // Unused, removed for lint
  // zAxisLabel, // Unused, removed for lint
  visibleSeries = new Set(Object.keys(SERIES_COLORS) as SeriesType[]),
  backgroundImage,
  backgroundImageOpacity = 0.1,
  backgroundImageScale = 1,
  axisLabelFontSize = 14,
  axisTickFontSize = 12,
  dataLabelFontSize = 12,
  // onImageUpdate, // Unused, removed for lint
  showDataLabels = false,
  pointImages = {},
  isDarkMode = false,
  imageWidth,
  imageHeight,
  pointSize = 6,
  useLabelPlacer = true,
  rotation = 0
}) => {
  // Reference to the chart instance for potential future interactions
  const chartRef = useRef<ChartJS<"scatter"> | null>(null);
  
  // Helper function to rotate coordinates around center (0, 0)
  const rotatePoint = (x: number, z: number, degrees: number): { x: number; z: number } => {
    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: x * cos - z * sin,
      z: x * sin + z * cos
    };
  };
  
  // Group data by series
  const seriesMap = new Map<SeriesType, DataPoint[]>();

  // Deduplicate points by (x, z) so only one label per unique coordinate
  const seenCoords = new Set<string>();
  data.forEach((point: DataPoint) => {
    const coordKey = `${point.x},${point.z}`;
    if (seenCoords.has(coordKey)) return;
    seenCoords.add(coordKey);
    if (!seriesMap.has(point.series)) {
      seriesMap.set(point.series, []);
    }
    if (visibleSeries.has(point.series)) {
      // Scale coordinates based on image dimensions if provided
      let scaledPoint = { ...point };
      if (imageWidth && imageHeight) {
        // Apply rotation first
        const rotated = rotatePoint(point.x, point.z, rotation);
        
        // Clamp coordinates to [-160, 160] range
        const clampedX = Math.max(-160, Math.min(160, rotated.x));
        const clampedZ = Math.max(-160, Math.min(160, rotated.z));
        
        // Map from [-160, 160] to [0, imageWidth-1] and [0, imageHeight-1]
        // Using (x + 160) * (imageWidth-1) / 320
        scaledPoint = {
          ...point,
          x: Math.round(((clampedX + 160) / 320) * (imageWidth - 1)),
          z: Math.round(((clampedZ + 160) / 320) * (imageHeight - 1)),
        };
      }
      const arr = seriesMap.get(point.series);
      if (arr) arr.push(scaledPoint);
    }
  });

  // Convert background colors to match theme for better visibility
  const getSeriesColor = (series: SeriesType): string => {
    if (series === 'White') return '#FFFFFF';
    if (series === 'Black') return '#000000'; // Use pure black
    return SERIES_COLORS[series];
  };

  // Create point images
  const createPointImage = (series: SeriesType): PointStyle => {
    if (pointImages[series]) {
      const img = new window.Image();
      img.src = pointImages[series];
      return img as unknown as PointStyle;
    }
    return 'circle';
  };

  // Prepare chart data
  const chartData: ChartData<'scatter'> = {
    datasets: Array.from(seriesMap.entries())
      .filter(([series]) => visibleSeries.has(series))
      .map(([series, points]) => ({
        label: series,
        data: points.map((p: DataPoint): ChartScatterDataPointCustom => ({ x: p.x, y: p.z, label: p.label, series: p.series, id: p.id })),
        backgroundColor: getSeriesColor(series),
        borderColor: series === 'Black' ? '#666666' : (isDarkMode ? '#FFFFFF' : '#000000'),
        borderWidth: series === 'Black' ? 2 : 1,
        pointRadius: pointSize,
        pointHoverRadius: Math.min(pointSize + 4, 12), // Add 4px to point size, but cap at 12px
        pointStyle: createPointImage(series),
        showLine: false,
        pointHoverBackgroundColor: getSeriesColor(series),
        pointHoverBorderColor: isDarkMode ? '#FFFFFF' : '#000000',
        pointHoverBorderWidth: 2
      }))
  };

  // Chart options
  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0,
      autoPadding: false
    },
    plugins: {
      legend: {
        display: false
      },
      labelPlacer: {
        enabled: showDataLabels,
        dataLabelFontSize: dataLabelFontSize,
      } as ChartJsLabelPluginOptions,
      tooltip: {
        enabled: true,
        backgroundColor: 'black',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#444444',
        borderWidth: 1,
        padding: 8,
        titleFont: {
          weight: 500,
          size: axisLabelFontSize - 1,
          family: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        bodyFont: {
          weight: 400,
          size: axisTickFontSize,
          family: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        footerFont: {
          weight: 400,
          size: axisTickFontSize - 1
        },
        callbacks: {
          label: (context) => {
            const point = context.raw as { x: number; y: number };
            // Convert back to original coordinate space
            if (imageWidth && imageHeight) {
              // Reverse of: x = ((clampedX + 160) / 320) * (imageWidth - 1)
              const rotatedX = ((point.x / (imageWidth - 1)) * 320) - 160;
              const rotatedZ = ((point.y / (imageHeight - 1)) * 320) - 160;
              
              // Apply reverse rotation to get back to original coordinates
              const unrotated = rotatePoint(rotatedX, rotatedZ, -rotation);
              
              // Clamp to [-160, 160] range
              const clampedX = Math.max(-160, Math.min(160, unrotated.x));
              const clampedZ = Math.max(-160, Math.min(160, unrotated.z));
              return [
                `X: ${Math.round(clampedX)}`,
                `Z: ${Math.round(clampedZ)}`
              ];
            }
            return [
              `X: ${Math.round(point.x)}`,
              `Z: ${Math.round(point.y)}`
            ];
          }
        },
        animation: {
          duration: 200
        },
        intersect: false,
        mode: 'nearest'
      },
      datalabels: {
        display: showDataLabels && !useLabelPlacer, // Hide when using LabelPlacer
        color: function(context) {
          // Hide when using LabelPlacer
          if (useLabelPlacer) return 'transparent'; // Hide default datalabels

          const point = context.dataset.data[context.dataIndex] as ChartScatterDataPointCustom;
          // Ensure point.series is valid before accessing SERIES_COLORS
          if (point && point.series && SERIES_COLORS[point.series]) {
            return SERIES_COLORS[point.series];
          }
          return isDarkMode ? '#FFF' : '#000'; // Default color
        },
        font: {
          size: dataLabelFontSize
        },
        formatter: function(value: ChartScatterDataPointCustom, _context: DatalabelContext) {
          // Convert back to original coordinate space
          if (imageWidth && imageHeight) {
            // Reverse of: x = ((clampedX + 160) / 320) * (imageWidth - 1)
            const rotatedX = ((value.x as number / (imageWidth - 1)) * 320) - 160;
            const rotatedZ = ((value.y as number / (imageHeight - 1)) * 320) - 160;
            
            // Apply reverse rotation to get back to original coordinates
            const unrotated = rotatePoint(rotatedX, rotatedZ, -rotation);
            
            // Clamp to [-160, 160] range
            const clampedX = Math.max(-160, Math.min(160, unrotated.x));
            const clampedZ = Math.max(-160, Math.min(160, unrotated.z));
            
            return `(${Math.round(clampedX)}, ${Math.round(clampedZ)})`;
          }
          return `(${Math.round(value.x as number)}, ${Math.round(value.y as number)})`;
        },
        align: 'top',
        offset: 10,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        padding: 1
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: 0,
        max: imageWidth ? imageWidth - 1 : 319,
        title: {
          display: false
        },
        ticks: {
          display: false
        },
        grid: {
          display: false
        },
        border: {
          display: false
        },
        offset: false
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: imageHeight ? imageHeight - 1 : 319,
        reverse: true,
        title: {
          display: false
        },
        ticks: {
          display: false
        },
        grid: {
          display: false
        },
        border: {
          display: false
        },
        offset: false
      }
    },
    elements: {
      point: {
        radius: pointSize,
        hitRadius: 10,
        hoverRadius: pointSize + 2,
      }
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col font-sans antialiased ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}
      style={{
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      <div
        className="w-full flex-grow relative flex items-center justify-center p-0"
        style={{
          width: imageWidth ? `${imageWidth}px` : '100%',
          height: imageHeight ? `${imageHeight}px` : '100%',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center p-0"
          style={{
            width: '100%',
            height: '100%',
            padding: 0,
            margin: 0,
            transform: backgroundImageScale !== 1 ? `scale(${backgroundImageScale})` : 'none',
            transformOrigin: 'center center',
          }}
        >
          {backgroundImage && (
            <div
              className="absolute inset-0 flex items-center justify-center p-0"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: backgroundImageOpacity,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                padding: 0,
                margin: 0,
              }}
            />
          )}
          <div
            className="absolute inset-0 flex items-center justify-center p-0"
            style={{
              zIndex: 2,
              width: '100%',
              height: '100%',
              padding: 0,
              margin: 0,
            }}
          >
            <Scatter ref={chartRef} data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlotChart;