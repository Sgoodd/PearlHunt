// src/utils/measureText.ts
export function measureText(ctx: CanvasRenderingContext2D, text: string, font = "12px sans-serif") {
  ctx.save();
  ctx.font = font;
  const metrics = ctx.measureText(text);
  // approximate height using em; for many fonts 1em ≈ 12px (matching font-size)
  const estimatedHeight = parseInt(font, 10); 
  ctx.restore();
  return { width: metrics.width, height: estimatedHeight };
}
