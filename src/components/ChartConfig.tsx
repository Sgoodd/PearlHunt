import React, { useRef, useState } from 'react';
import { ChartConfig as ChartConfigType } from '../types';
import { Upload, Moon, Sun, RefreshCw } from 'lucide-react';

interface ChartConfigProps {
  config: ChartConfigType;
  onChange: (config: ChartConfigType) => void;
  onImageUpdate?: (imageData: string) => void;
  isDarkMode?: boolean;
  onDarkModeChange?: (isDark: boolean) => void;
}

const PRESET_MAPS = [
  { name: 'Example Map', path: '/preset-maps/example-map.PNG' },
  // Add more preset maps here as needed
];

const DEFAULT_CONFIG: ChartConfigType = {
  dataLabelFontSize: 10,
  showDataLabels: false,
  pointSize: 6,
  backgroundImageOpacity: 0.1,
  backgroundImageScale: 1,
  imageWidth: 530,
  imageHeight: 534
};

const ChartConfig: React.FC<ChartConfigProps> = ({ 
  config, 
  onChange, 
  onImageUpdate,
  isDarkMode = false,
  onDarkModeChange 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsedValue;
    if (name === 'backgroundImageScale' || name === 'typeScale') {
      parsedValue = parseFloat(value);
    } else if (name === 'pointSize') {
      parsedValue = parseInt(value, 10);
    } else {
      parsedValue = type === 'number' ? parseFloat(value) : value;
    }
    onChange({
      ...config,
      [name]: parsedValue,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        
        // Create a temporary image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Update config with both image data and dimensions
          onChange({
            ...config,
            backgroundImage: imageData,
            imageWidth: img.width,
            imageHeight: img.height
          });
          onImageUpdate?.(imageData);
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetImage = async (mapPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a temporary image to load the preset map
      const img = new Image();
      
      // Create a promise to handle the image loading
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load preset map'));
        img.src = mapPath;
      });

      // Update config with both image data and dimensions
      onChange({
        ...config,
        backgroundImage: img.src,
        imageWidth: img.width,
        imageHeight: img.height
      });
      onImageUpdate?.(img.src);
    } catch (err) {
      setError('Failed to load preset map. Please make sure the image file exists in the public/preset-maps directory.');
      console.error('Error loading preset map:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange({
      ...config,
      backgroundImage: undefined,
      backgroundImageOpacity: 0.1
    });
    onImageUpdate?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = (field: keyof ChartConfigType) => {
    onChange({
      ...config,
      [field]: DEFAULT_CONFIG[field]
    });
  };

  const inputClasses = `w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
  }`;

  const labelClasses = `block text-sm font-medium mb-1 ${
    isDarkMode ? 'text-gray-200' : 'text-gray-700'
  }`;

  const rangeClasses = `w-full ${isDarkMode ? 'accent-blue-500' : ''}`;

  const buttonClasses = (isPrimary = false) => `
    inline-flex items-center px-3 py-2 rounded-md shadow-sm text-sm font-medium 
    focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200
    ${isDarkMode 
      ? isPrimary
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
        : 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500'
      : isPrimary
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
        : 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 border border-gray-300'
    }
  `;

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-4 rounded-lg shadow-sm`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Chart Configuration</h3>
        <button
          onClick={() => onDarkModeChange?.(!isDarkMode)}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>
              Data Point Labels
            </label>
            <div className="flex items-center space-x-2">
              <label className={`inline-flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  name="showDataLabels"
                  checked={config.showDataLabels || false}
                  onChange={(e) => onChange({
                    ...config,
                    showDataLabels: e.target.checked
                  })}
                  className={`rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : ''
                  }`}
                />
                <span className="ml-2 text-sm">Show Labels</span>
              </label>
            </div>
            {config.showDataLabels && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="dataLabelFontSize" className={labelClasses}>
                      Label Font Size: {config.dataLabelFontSize || 10}px
                    </label>
                    <button
                      onClick={() => handleReset('dataLabelFontSize')}
                      className={`p-1 rounded-lg transition-colors duration-200 ${
                        isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title="Reset to default"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <input
                    type="range"
                    id="dataLabelFontSize"
                    name="dataLabelFontSize"
                    min="1"
                    max="20"
                    step="1"
                    value={config.dataLabelFontSize || 10}
                    onChange={handleChange}
                    className={rangeClasses}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={labelClasses}>
                Point Size Settings
              </label>
              <button
                onClick={() => handleReset('pointSize')}
                className={`p-1 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Reset to default"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div>
              <label htmlFor="pointSize" className={labelClasses}>
                Point Size: {config.pointSize || 6}px
              </label>
              <input
                type="range"
                id="pointSize"
                name="pointSize"
                min="2"
                max="12"
                step="1"
                value={config.pointSize || 6}
                onChange={handleChange}
                className={rangeClasses}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className={labelClasses}>
          Image Dimensions
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="imageWidth" className={labelClasses}>
              Width (px)
            </label>
            <input
              type="number"
              id="imageWidth"
              name="imageWidth"
              value={config.imageWidth || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Enter width"
              min="1"
            />
          </div>
          <div>
            <label htmlFor="imageHeight" className={labelClasses}>
              Height (px)
            </label>
            <input
              type="number"
              id="imageHeight"
              name="imageHeight"
              value={config.imageHeight || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Enter height"
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className={labelClasses}>
          Background Image
        </label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg"
            onChange={handleImageUpload}
            className="hidden"
            id="backgroundImage"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={buttonClasses()}
          >
            <Upload size={16} className="mr-1" />
            Upload Image
          </button>
          {PRESET_MAPS.map((map) => (
            <button
              key={map.path}
              type="button"
              onClick={() => handlePresetImage(map.path)}
              disabled={isLoading}
              className={`${buttonClasses()} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {map.name}
            </button>
          ))}
          {config.backgroundImage && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                isDarkMode 
                  ? 'text-red-400 bg-red-900/50 hover:bg-red-900/70' 
                  : 'text-red-700 bg-red-100 hover:bg-red-200'
              }`}
            >
              Remove Image
            </button>
          )}
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}
        {config.backgroundImage && (
          <div className="space-y-4">
            <div className="mt-2">
              <img
                src={config.backgroundImage}
                alt="Background preview"
                className="max-h-32 rounded-md"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="backgroundImageOpacity" className={labelClasses}>
                  Image Opacity: {config.backgroundImageOpacity || 0.1}
                </label>
                <button
                  onClick={() => handleReset('backgroundImageOpacity')}
                  className={`p-1 rounded-lg transition-colors duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Reset to default"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <input
                type="range"
                id="backgroundImageOpacity"
                name="backgroundImageOpacity"
                min="0"
                max="1"
                step="0.1"
                value={config.backgroundImageOpacity || 0.1}
                onChange={handleChange}
                className={rangeClasses}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="backgroundImageScale" className={labelClasses}>
                  Image Scale: {Math.round((config.backgroundImageScale || 1) * 100)}%
                </label>
                <button
                  onClick={() => handleReset('backgroundImageScale')}
                  className={`p-1 rounded-lg transition-colors duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Reset to default"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <input
                type="range"
                id="backgroundImageScale"
                name="backgroundImageScale"
                min="10"
                max="200"
                step="1"
                value={(config.backgroundImageScale || 1) * 100}
                onChange={(e) => {
                  const percentage = parseInt(e.target.value, 10);
                  const scale = percentage / 100;
                  // Get the original dimensions from the initial image load
                  const originalWidth = config.imageWidth ? config.imageWidth / (config.backgroundImageScale || 1) : 530;
                  const originalHeight = config.imageHeight ? config.imageHeight / (config.backgroundImageScale || 1) : 534;
                  
                  onChange({
                    ...config,
                    backgroundImageScale: scale,
                    imageWidth: Math.round(originalWidth * scale),
                    imageHeight: Math.round(originalHeight * scale)
                  });
                }}
                className={rangeClasses}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartConfig;