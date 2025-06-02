import { DataPoint, SeriesType } from '../types';
import Papa from 'papaparse';

export const parseCSV = (csvContent: string): DataPoint[] => {
  const results = Papa.parse(csvContent, { header: false });
  
  if (results.errors.length > 0) {
    console.error('CSV parse errors:', results.errors);
    return [];
  }

  const validSeries: SeriesType[] = ['Cyan', 'Blue', 'White', 'Red', 'Magenta', 'Green', 'Yellow', 'Black'];
  
  const rows = results.data as Array<[string, string, SeriesType]>;
  return rows
    .filter(([xStr, zStr, series]) => {
      const x = Number(xStr);
      const z = Number(zStr);
      return !isNaN(x) && 
             !isNaN(z) &&
             validSeries.includes(series) &&
             x >= -159 &&
             x <= 159 &&
             z >= -160 &&
             z <= 160 &&
             !(x >= -3 && x <= 3 && z >= -3 && z <= 3); // Area from (0,0) to (-3,-3) and (3,3)
    })
    .map(([xStr, zStr, series], index) => ({
      id: `point-${Date.now()}-${index}`,
      label: `${series} (${xStr}, ${zStr})`,
      x: Number(xStr),
      z: Number(zStr),
      series
    }));
};

export const generateSampleData = (count: number = 10): DataPoint[] => {
  const series: SeriesType[] = ['Cyan', 'Blue', 'White', 'Red', 'Magenta', 'Green', 'Yellow', 'Black'];
  const sampleData: DataPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomSeries = series[Math.floor(Math.random() * series.length)];
    // Map the 530x534 image coordinates to -160 to 160 range
    const x = (Math.random() * 530 - 265) * (320/530); // Scale to -160 to 160
    const z = (Math.random() * 534 - 267) * (320/534); // Scale to -160 to 160
    sampleData.push({
      id: `sample-${Date.now()}-${i}`,
      label: `${randomSeries} (${Math.round(x)}, ${Math.round(z)})`,
      x: Math.round(x), // Round to nearest integer
      z: Math.round(z), // Round to nearest integer
      series: randomSeries
    });
  }
  
  return sampleData;
};

export const saveDataToCSV = (data: DataPoint[]): void => {
  // Convert data to CSV format
  const csvContent = data.map(point => `${point.x},${point.z},${point.series}`).join('\n');
  
  // Create a blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Set up the download
  link.setAttribute('href', url);
  link.setAttribute('download', 'scatter_plot_data.csv');
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};