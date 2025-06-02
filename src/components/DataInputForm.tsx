import React, { useState } from 'react';
import { DataPoint, SeriesType } from '../types';
import { Plus } from 'lucide-react';

// Helper function to create a DataPoint with required properties
const createDataPoint = (x: number, z: number, series: SeriesType): DataPoint => ({
  id: Math.random().toString(36).substr(2, 9),
  label: `${series} (${x}, ${z})`,
  x,
  z,
  series
});

interface DataInputFormProps {
  onAddPoint: (point: DataPoint) => void;
  series: SeriesType[];
  isDarkMode?: boolean;
}

const DataInputForm: React.FC<DataInputFormProps> = ({ 
  onAddPoint, 
  series,
  isDarkMode = false 
}) => {
  const [formData, setFormData] = useState<{
    x: string;
    z: string;
    series: SeriesType;
  }>({
    x: '',
    z: '',
    series: series[0]
  });

  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const x = parseFloat(formData.x);
    const z = parseFloat(formData.z);
    
    if (isNaN(x) || isNaN(z)) {
      setError('Please enter valid numbers for both coordinates');
      return;
    }

    if (x >= -3 && x <= 3 && z >= -3 && z <= 3) { // Area from (0,0) to (-3,-3) and (3,3)
      setError('Cannot add point in the restricted area (from -3,-3 to 3,3)');
      return;
    }
    
    onAddPoint(createDataPoint(x, z, formData.series));
    
    // Clear form
    setFormData({
      x: '',
      z: '',
      series: formData.series
    });
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!pastedText.trim()) return;

      const lines = pastedText.split('\n');
      let currentSeries: SeriesType | null = null;
      let errorCount = 0;
      let successCount = 0;
      const failedLines: string[] = [];

      // Map of color indicators to series
      const colorMap: { [key: string]: SeriesType } = {
        '🔴': 'Red',
        '🟢': 'Green',
        '🔵': 'Cyan',
        '⚪': 'White',
        '🟣': 'Magenta',
        '🟡': 'Yellow',
        '⚫': 'Black',
        ':blue:': 'Blue',
        'red': 'Red',
        'green': 'Green',
        'blue': 'Blue',
        'white': 'White',
        'magenta': 'Magenta',
        'yellow': 'Yellow',
        'black': 'Black',
        'cyan': 'Cyan'
      };

      for (const line of lines) {
        try {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Check if line is a color header, emoji, or :color: format
          const colorKeyword = Object.keys(colorMap).find(key => 
            trimmedLine.toLowerCase().startsWith(key.toLowerCase()) || 
            trimmedLine.toLowerCase().startsWith(`:${key.toLowerCase()}:`)
          );
          
          if (colorKeyword) {
            currentSeries = colorMap[colorKeyword];
            continue;
          }

          // Try to extract coordinates and color from the line
          // Match patterns like:
          // (100, 42) cyan
          // 100, 42 cyan
          // 100 42 cyan
          // (100, 42)
          const coordColorMatch = trimmedLine.match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?\s*(?:([a-zA-Z]+))?$/);
          
          if (coordColorMatch) {
            const [, xStr, zStr, colorStr] = coordColorMatch;
            const x = parseFloat(xStr);
            const z = parseFloat(zStr);
            
            // If color is specified in the line, use it
            if (colorStr) {
              const matchedColor = Object.keys(colorMap).find(key => 
                key.toLowerCase() === colorStr.toLowerCase()
              );
              if (matchedColor) {
                currentSeries = colorMap[matchedColor];
              }
            }

            if (!isNaN(x) && !isNaN(z) && currentSeries) {
              onAddPoint(createDataPoint(x, z, currentSeries));
              successCount++;
              continue;
            } else {
              failedLines.push(trimmedLine);
              errorCount++;
              continue;
            }
          }

          // If the above pattern didn't match, try the old parsing method
          const lineWithoutComments = trimmedLine
            .replace(/\s*\([^)]*\)/, '')  // Remove comments in parentheses
            .replace(/,\s*$/, '')         // Remove trailing comma
            .trim();

          // Skip lines that are just text (like "None yet,")
          if (!lineWithoutComments.match(/-?\d+/)) {
            continue;
          }

          // Try to parse coordinates
          const parts = lineWithoutComments.split(/[\s,./]+/).filter(part => part.trim());
          if (parts.length >= 2) {
            const x = parseFloat(parts[0]);
            const z = parseFloat(parts[1]);
            
            if (!isNaN(x) && !isNaN(z) && currentSeries) {
              onAddPoint(createDataPoint(x, z, currentSeries));
              successCount++;
            } else {
              failedLines.push(trimmedLine);
              errorCount++;
            }
          } else {
            failedLines.push(trimmedLine);
            errorCount++;
          }
        } catch (lineError) {
          console.error('Error processing line:', line, lineError);
          failedLines.push(line);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        const errorMessage = `${errorCount} line(s) could not be parsed:\n${failedLines.map(line => `- "${line}"`).join('\n')}`;
        setError(errorMessage);
      } else {
        setError(null);
      }

      if (successCount > 0) {
        setPastedText('');
      }
    } catch (error) {
      console.error('Error in handlePasteSubmit:', error);
      setError('An error occurred while processing the input. Please try again.');
    }
  };

  const inputClasses = `w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
  }`;

  const labelClasses = `block text-sm font-medium mb-1 ${
    isDarkMode ? 'text-gray-200' : 'text-gray-700'
  }`;

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-sm`}>
      <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Data Points</h3>
      
      {/* Single Point Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className={`text-md font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Add Point
          </h4>
          <button
            type="submit"
            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isDarkMode ? 'focus:ring-offset-gray-800' : ''
            }`}
          >
            Add Point
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="x" className={labelClasses}>X Coordinate</label>
            <input
              type="number"
              id="x"
              name="x"
              value={formData.x}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Enter X coordinate"
              step="any"
            />
          </div>
          <div>
            <label htmlFor="z" className={labelClasses}>Z Coordinate</label>
            <input
              type="number"
              id="z"
              name="z"
              value={formData.z}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Enter Z coordinate"
              step="any"
            />
          </div>
        </div>
        <div>
          <label htmlFor="series" className={labelClasses}>Series</label>
          <select
            id="series"
            name="series"
            value={formData.series}
            onChange={handleChange}
            className={inputClasses}
          >
            {series.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </form>

      {/* Bulk Paste Form */}
      <div className="mt-6">
        <h4 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bulk Add Points</h4>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          Paste coordinates with color indicators (one per line).<br />
          Supports color headers, emoji indicators, and direct coordinates.
        </p>
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className={`${inputClasses} h-32`}
            placeholder="Red&#10;123.-114&#10;131.19&#10;&#10;🔴&#10;19, -92&#10;-44, 74&#10;&#10;100 50 cyan&#10;(120, 60) blue"
          />
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus size={16} className="mr-2" />
            Add Points
          </button>
        </form>
      </div>

      {error && (
        <div className={`mt-4 p-2 rounded-md ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}
    </div>
  );
};

export default DataInputForm;