import React from 'react';
import { DataPoint, SeriesType, SERIES_COLORS } from '../types';
import { Trash2, Download } from 'lucide-react';
import { saveDataToCSV } from '../utils/dataUtils';

interface DataTableProps {
  data: DataPoint[];
  onDeletePoint: (index: number) => void;
  onDeleteAllPoints?: () => void;
  isDarkMode?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDeletePoint, onDeleteAllPoints, isDarkMode = false }) => {
  if (data.length === 0) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-4 rounded-lg shadow-sm text-center text-gray-500`}>
        No data points available. Add some using the form above or import from a CSV file.
      </div>
    );
  }

  // Get display color (adjust white/black for visibility)
  const getDisplayColor = (series: SeriesType): string => {
    if (series === 'White') return '#FFFFFF'; // Pure white
    if (series === 'Black') return '#333333'; // Dark gray instead of black
    return SERIES_COLORS[series];
  };

  const handleSaveData = () => {
    saveDataToCSV(data);
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-4 rounded-lg shadow-sm`}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Data Points</h3>
          <p className="text-sm text-gray-500">
            {data.length} data point{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {onDeleteAllPoints && (
            <button
              onClick={onDeleteAllPoints}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200`}
            >
              <Trash2 size={16} className="mr-1" />
              Remove All
            </button>
          )}
          <button
            onClick={handleSaveData}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <Download size={16} className="mr-1" />
            Save Data
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-80">
        <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Series
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                X
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Z
              </th>
              <th scope="col" className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {data.map((point, index) => (
              <tr key={index} className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  <div className="flex items-center">
                    <div 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ 
                        backgroundColor: getDisplayColor(point.series),
                        border: point.series === 'White' ? '1px solid #ccc' : 'none'
                      }}
                    />
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{point.series}</div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {point.x.toFixed(2)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {point.z.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => onDeletePoint(index)}
                    className={`inline-flex items-center px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      isDarkMode 
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/50' 
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;