import React from 'react';
import { SeriesType } from '../types';

interface SeriesSelectorProps {
  availableSeries: SeriesType[];
  visibleSeries: Set<SeriesType>;
  onToggleSeries: (series: SeriesType) => void;
  isDarkMode?: boolean;
}

const SeriesSelector: React.FC<SeriesSelectorProps> = ({
  availableSeries,
  visibleSeries,
  onToggleSeries,
  isDarkMode = false
}) => {
  const getSeriesColor = (series: SeriesType) => {
    const colors: Record<SeriesType, string> = {
      'Cyan': '#00FFFF',
      'Blue': '#0000FF',
      'White': '#FFFFFF',
      'Red': '#FF0000',
      'Magenta': '#FF00FF',
      'Green': '#00FF00',
      'Yellow': '#FFFF00',
      'Black': '#000000'
    };
    return colors[series];
  };

  return (
    <div className="flex items-center space-x-1">
      {availableSeries.map((series) => (
        <button
          key={series}
          onClick={() => onToggleSeries(series)}
          className={`w-6 h-6 rounded-full transition-colors duration-200 flex items-center justify-center ${
            isDarkMode 
              ? visibleSeries.has(series)
                ? 'ring-2 ring-blue-400'
                : 'ring-1 ring-gray-600'
              : visibleSeries.has(series)
                ? 'ring-2 ring-blue-600'
                : 'ring-1 ring-gray-300'
          }`}
          style={{
            backgroundColor: getSeriesColor(series),
            opacity: visibleSeries.has(series) ? 1 : 0.3,
            border: '1px solid',
            borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
          }}
          title={series}
        />
      ))}
    </div>
  );
};

export default SeriesSelector;