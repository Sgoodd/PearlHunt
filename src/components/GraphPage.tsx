import React from 'react';
import ScatterPlotChart from './ScatterPlotChart';
import { DataPoint, SeriesType, ChartConfig as ChartConfigType } from '../types';
import { generateSampleData } from '../utils/dataUtils';
// import { Settings } from 'lucide-react'; // Unused, removed for lint

interface GraphPageProps {
  data: DataPoint[];
  visibleSeries: Set<SeriesType>;
  chartConfig: ChartConfigType;
  onImageUpdate: (imageData: string) => void;
  // onToggleSeries: (series: SeriesType) => void; // Unused, removed for lint
  isDarkMode?: boolean;
  onNavigateToSettings?: () => void;
  onDataLoaded?: (points: DataPoint[]) => void;
  rotation?: number;
}

const GraphPage: React.FC<GraphPageProps> = ({
  data,
  visibleSeries,
  chartConfig,
  onImageUpdate,
  // onToggleSeries, // Unused, removed for lint
  isDarkMode = false,
  onNavigateToSettings,
  onDataLoaded,
  rotation = 0
}) => {
  if (data.length === 0) {
    return (
      <div className={`relative min-h-[calc(100vh-4rem)] ${isDarkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className={`text-center p-8 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-lg max-w-md`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Data Points
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            The example map is ready. Add specific pearl locations, or generate the random points!
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                if (onDataLoaded) {
                  const randomPoints = generateSampleData(10);
                  onDataLoaded(randomPoints);
                }
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500' 
                  : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
              }`}
            >
              Generate Random Points
            </button>
            <button
              onClick={onNavigateToSettings}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              Add Pearl Hunt Locations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[calc(100vh-4rem)] ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="w-full h-full flex items-center justify-center p-0">
        <div 
          className={`relative ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-sm w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] p-0`}
          style={{
            aspectRatio: chartConfig.imageWidth && chartConfig.imageHeight 
              ? `${chartConfig.imageWidth} / ${chartConfig.imageHeight}`
              : '1 / 1',
            maxHeight: 'calc(100vh - 6rem)',
            width: chartConfig.imageWidth ? `${chartConfig.imageWidth}px` : '100%',
            height: chartConfig.imageHeight ? `${chartConfig.imageHeight}px` : '100%',
            padding: 0,
            margin: 0
          }}
        >
          <ScatterPlotChart 
            data={data} 
            xAxisLabel={chartConfig.xAxisLabel || ''}
            zAxisLabel={chartConfig.zAxisLabel || ''}
            visibleSeries={visibleSeries}
            backgroundImage={chartConfig.backgroundImage}
            backgroundImageOpacity={chartConfig.backgroundImageOpacity}
            backgroundImageScale={chartConfig.backgroundImageScale}
            axisLabelFontSize={chartConfig.dataLabelFontSize || 12}
            axisTickFontSize={chartConfig.axisTickFontSize ?? 12}
            showDataLabels={chartConfig.showDataLabels}
            dataLabelFontSize={chartConfig.dataLabelFontSize || 12}
            onImageUpdate={onImageUpdate}
            isDarkMode={isDarkMode}
            imageWidth={chartConfig.imageWidth}
            imageHeight={chartConfig.imageHeight}
            pointSize={chartConfig.pointSize}
            rotation={rotation}
          />
        </div>
      </div>
    </div>
  );
};

export default GraphPage;