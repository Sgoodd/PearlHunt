// src/plugins/BorderAlignPlugin.ts
// Chart.js plugin that forces the minimum value of the x and y scales
// to align exactly with the chart-area border (pixel-perfect).
// This solves the common issue where the first data point appears a few
// pixels inset even when scale.min is 0.

import { Plugin, Chart } from 'chart.js';

/**
 * Patch a scale so `getPixelForValue(min)` returns the exact edge pixel.
 * We do this by measuring the current pixel for the min, computing the
 * delta from the desired edge, and then overriding `getPixelForValue` to
 * subtract that delta for all future calls.
 */
function patchScale(scale: any, edgePx: number) {
  if (scale._edgeAligned) return; // already patched
  const original = scale.getPixelForValue.bind(scale);
  const current = original(scale.min);
  const delta = current - edgePx;

  if (Math.abs(delta) < 0.5) {
    // Already aligned to sub-pixel precision; nothing to do.
    scale._edgeAligned = true;
    return;
  }

  scale.getPixelForValue = (value: number) => original(value) - delta;
  scale._edgeAligned = true;
}

const BorderAlignPlugin: Plugin<'scatter'> = {
  id: 'borderAlign',
  afterUpdate(chart: Chart<'scatter'>) {
    const { chartArea } = chart;
    const xScale = (chart as any).scales?.x;
    const yScale = (chart as any).scales?.y;
    if (xScale) patchScale(xScale, chartArea.left);
    if (yScale) patchScale(yScale, chartArea.top);
  }
};

export default BorderAlignPlugin;
