import React, { useRef } from 'react';
import { DataPoint } from '../types';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onDataLoaded: (data: DataPoint[]) => void;
  isDarkMode?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onDataLoaded,
  isDarkMode = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const lines = content.split('\n');
          const data: DataPoint[] = [];

          for (const line of lines) {
            if (line.trim()) {
              const [x, z, series] = line.split(',').map(s => s.trim());
              if (x && z && series) {
                data.push({
                  id: `upload-${Date.now()}-${data.length}`,
                  label: `${series} (${x}, ${z})`,
                  x: parseFloat(x),
                  z: parseFloat(z),
                  series: series as import('../types').SeriesType
                });
              }
            }
          }

          onDataLoaded(data);
        } catch (error) {
          console.error('Error parsing file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-4 rounded-lg shadow-sm`}>
      <h3 className="text-lg font-medium mb-3">Import Data</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
              isDarkMode 
                ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className={`w-8 h-8 mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`mb-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                CSV file with X,Z,Series columns
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;