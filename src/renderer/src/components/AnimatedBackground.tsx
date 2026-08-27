import React, { useEffect, useRef } from 'react';
import BackgroundWorker from './background.worker?worker';

export const AnimatedBackground: React.FC = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 w-full h-full pointer-events-none';
    container.appendChild(canvas);

    // Create worker
    workerRef.current = new BackgroundWorker();

    // Transfer control to worker
    const offscreen = canvas.transferControlToOffscreen();
    
    // Set initial size
    const rect = container.getBoundingClientRect();
    if (rect) {
      offscreen.width = rect.width;
      offscreen.height = rect.height;
    }

    workerRef.current.postMessage({
      type: 'init',
      canvas: offscreen,
      theme: 'minecraft'
    }, [offscreen]);

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === container && workerRef.current) {
          workerRef.current.postMessage({
            type: 'resize',
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'destroy' });
        workerRef.current.terminate();
      }
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none" 
    />
  );
});
