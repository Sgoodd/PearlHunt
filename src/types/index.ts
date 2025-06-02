export interface DataPoint {
  id: string; // Added for unique identification
  label: string; // Added for data point labeling
  x: number;
  z: number;
  series: SeriesType;
}

export type SeriesType = 
  | 'Cyan' 
  | 'Blue' 
  | 'White' 
  | 'Red' 
  | 'Magenta' 
  | 'Green' 
  | 'Yellow' 
  | 'Black';

export const SERIES_COLORS: Record<SeriesType, string> = {
  Cyan: '#00FFFF',
  Blue: '#0000FF',
  White: '#FFFFFF',
  Red: '#FF0000',
  Magenta: '#FF00FF',
  Green: '#00FF00',
  Yellow: '#FFFF00',
  Black: '#000000'
};

export interface ChartConfig {
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  backgroundImageScale?: number;
  showDataLabels?: boolean;
  dataLabelFontSize?: number;
  onImageUpdate?: (imageData: string) => void;
  forceShowLabels?: boolean;
  xAxisDomain?: [number, number];
  zAxisDomain?: [number, number];
  imageWidth?: number;
  imageHeight?: number;
  pointSize?: number;
  xAxisLabel?: string;
  zAxisLabel?: string;
  axisTickFontSize?: number; // Added for axis tick font size configuration
  title?: string;
}