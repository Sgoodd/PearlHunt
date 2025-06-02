export const SERIES_COLORS = {
  Cyan: '#00FFFF',
  Blue: '#0000FF',
  White: '#FFFFFF',
  Red: '#FF0000',
  Magenta: '#FF00FF',
  Green: '#00FF00',
  Yellow: '#FFFF00',
  Black: '#000000'
} as const;

export type SeriesType = keyof typeof SERIES_COLORS;
