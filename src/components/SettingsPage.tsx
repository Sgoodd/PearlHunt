import React from 'react';
import ChartConfig from './ChartConfig';
import DataInputForm from './DataInputForm';
import FileUploader from './FileUploader';
import DataTable from './DataTable';
import { DataPoint, ChartConfig as ChartConfigType } from '../types';

interface SettingsPageProps {
  data: DataPoint[];
  // visibleSeries: Set<SeriesType>; // Unused, removed for lint
  chartConfig: ChartConfigType;
  onConfigChange: (config: ChartConfigType) => void;
  // onToggleSeries: (series: SeriesType) => void; // Unused, removed for lint
  onAddPoint: (point: DataPoint) => void;
  onDeletePoint: (index: number) => void;
  onDataLoaded: (newData: DataPoint[]) => void;
  onImageUpdate: (imageData: string) => void;
  isDarkMode?: boolean;
  onDarkModeChange?: (isDark: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  data,
  // visibleSeries, // Unused, removed for lint
  chartConfig,
  onConfigChange,
  // onToggleSeries, // Unused, removed for lint
  onAddPoint,
  onDeletePoint,
  onDataLoaded,
  onImageUpdate,
  isDarkMode = false,
  onDarkModeChange
}) => {
  const handleDeleteAllPoints = (): void => {
    if (window.confirm('Are you sure you want to remove all data points? This action cannot be undone.')) {
      // Delete all points by deleting each point one by one
      for (let i = data.length - 1; i >= 0; i--) {
        onDeletePoint(i);
      }
    }
  };

  return (
    <div className={`space-y-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Configuration Controls */}
      <div className="grid grid-cols-1 gap-4">
        <ChartConfig 
          config={chartConfig} 
          onChange={onConfigChange}
          onImageUpdate={onImageUpdate}
          isDarkMode={isDarkMode}
          onDarkModeChange={onDarkModeChange}
        />
      </div>

      {/* Data Input Section */}
      <div id="data-input-section" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataInputForm 
          onAddPoint={onAddPoint} 
          series={['Cyan', 'Blue', 'White', 'Red', 'Magenta', 'Green', 'Yellow', 'Black']}
          isDarkMode={isDarkMode}
        />
        <FileUploader onDataLoaded={onDataLoaded} isDarkMode={isDarkMode} />
      </div>

      {/* Data Table */}
      <DataTable 
        data={data} 
        onDeletePoint={onDeletePoint} 
        onDeleteAllPoints={handleDeleteAllPoints}
        isDarkMode={isDarkMode} 
      />
    </div>
  );
};

export default SettingsPage;