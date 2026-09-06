import { useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useWaterfallStore } from '../store/waterfallStore.js';

function dbToColor(db: number): string {
  // Rough dB-to-color ramp: quieter = dark blue, louder = yellow/white.
  const clamped = Math.max(-100, Math.min(0, db));
  const t = (clamped + 100) / 100;
  const r = Math.round(255 * t);
  const g = Math.round(255 * Math.min(1, t * 1.2));
  const b = Math.round(150 * (1 - t));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Canvas-based waterfall display. Subscribes to the websocket "waterfall"
 * channel via useWebSocket and draws each frame as a new scrolling row.
 * Functional rendering, not pixel-perfect.
 */
export default function Waterfall() {
  useWebSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames = useWaterfallStore((s) => s.frames);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const latest = frames[frames.length - 1];
    if (!latest) return;

    const width = canvas.width;
    const height = canvas.height;

    // Scroll existing content up by one row.
    const imageData = ctx.getImageData(0, 1, width, height - 1);
    ctx.putImageData(imageData, 0, 0);

    const binWidth = width / latest.bins.length;
    for (let i = 0; i < latest.bins.length; i++) {
      ctx.fillStyle = dbToColor(latest.bins[i] ?? -100);
      ctx.fillRect(i * binWidth, height - 1, Math.ceil(binWidth), 1);
    }
  }, [frames]);

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Waterfall</h2>
      <canvas
        ref={canvasRef}
        width={512}
        height={200}
        className="w-full bg-black rounded border border-slate-800"
      />
    </section>
  );
}
