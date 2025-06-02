import { useState, useEffect } from 'react';
import { DataPoint, SeriesType, ChartConfig as ChartConfigType } from './types';
// import { generateSampleData } from './utils/dataUtils'; // Unused, removed for lint
import { BarChart2, Settings, LineChart, RotateCw } from 'lucide-react';
import SettingsPage from './components/SettingsPage';
import GraphPage from './components/GraphPage';
import SeriesSelector from './components/SeriesSelector';

function App() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [visibleSeries, setVisibleSeries] = useState<Set<SeriesType>>(
    new Set(['Cyan', 'Blue', 'White', 'Red', 'Magenta', 'Green', 'Yellow', 'Black'])
  );
  const [chartConfig, setChartConfig] = useState<ChartConfigType>({
    xAxisLabel: 'X Coordinate',
    zAxisLabel: 'Z Coordinate',
    title: 'Pearl Hunt Graph',
    showDataLabels: true,
    dataLabelFontSize: 10,
    pointSize: 6,
    backgroundImage: '/preset-maps/example-map.PNG',
    imageWidth: 530,
    imageHeight: 534,
    backgroundImageOpacity: 0.3,
    backgroundImageScale: 1
  });
  const [currentPage, setCurrentPage] = useState<'graph' | 'settings'>('graph');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, or 270 degrees

  const handleAddPoint = (point: DataPoint) => {
    // Validate that point is not in the restricted area
    if ((point.x >= -3 && point.x <= 3 && point.z >= -3 && point.z <= 3)) { // Area from (0,0) to (-3,-3) and (3,3)
      return; // Silently reject the point
    }
    setData(prevData => [...prevData, point]);
  };

  const handleDeletePoint = (index: number) => {
    setData(prevData => prevData.filter((_, i) => i !== index));
  };

  const handleDataLoaded = (newData: DataPoint[]) => {
    setData(prevData => [...prevData, ...newData]);
  };

  const handleToggleSeries = (series: SeriesType) => {
    setVisibleSeries(prev => {
      const newVisibleSeries = new Set(prev);
      if (newVisibleSeries.has(series)) {
        newVisibleSeries.delete(series);
      } else {
        newVisibleSeries.add(series);
      }
      return newVisibleSeries;
    });
  };

  const handleImageUpdate = (imageData: string) => {
    setChartConfig(prev => ({
      ...prev,
      backgroundImage: imageData
    }));
  };

  const handleDarkModeChange = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleNavigateToSettings = () => {
    setCurrentPage('settings');
    setTimeout(() => {
      const element = document.getElementById('data-input-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Animation effect when data changes
  useEffect(() => {
    // This could be expanded to add more sophisticated animations
  }, [data]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <BarChart2 className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
              </div>
              <div className="w-64">
                <SeriesSelector
                  availableSeries={['Cyan', 'Blue', 'White', 'Red', 'Magenta', 'Green', 'Yellow', 'Black']}
                  visibleSeries={visibleSeries}
                  onToggleSeries={handleToggleSeries}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
            <nav className="flex space-x-4 items-center">
              <button
                onClick={handleRotate}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  rotation === 0
                    ? isDarkMode ? 'text-blue-400 hover:bg-blue-900' : 'text-blue-600 hover:bg-blue-100'
                    : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={`Rotate ${rotation}°`}
              >
                <RotateCw size={20} className={`transform transition-transform duration-300`} style={{ transform: `rotate(${rotation}deg)` }} />
                <span className="ml-1 text-xs">{rotation}°</span>
              </button>
              <button
                onClick={() => setCurrentPage('graph')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'graph'
                    ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                    : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LineChart size={16} className="mr-2" />
                Graph
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'settings'
                    ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                    : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings size={16} className="mr-2" />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'graph' ? (
          <GraphPage
            data={data}
            visibleSeries={visibleSeries}
            chartConfig={chartConfig}
            onImageUpdate={handleImageUpdate}
            isDarkMode={isDarkMode}
            onNavigateToSettings={handleNavigateToSettings}
            onDataLoaded={handleDataLoaded}
            rotation={rotation}
          />
        ) : (
          <SettingsPage
            data={data}
            chartConfig={chartConfig}
            onConfigChange={setChartConfig}
            onAddPoint={handleAddPoint}
            onDeletePoint={handleDeletePoint}
            onDataLoaded={handleDataLoaded}
            onImageUpdate={handleImageUpdate}
            isDarkMode={isDarkMode}
            onDarkModeChange={handleDarkModeChange}
          />
        )}
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-4`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Pearl Hunt Graph - Built with React and Chart.js
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;