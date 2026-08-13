'use client';

import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface ChartZoomProps {
  children: React.ReactNode;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
}

export function ChartZoom({ children, className = '', minZoom = 0.5, maxZoom = 3 }: ChartZoomProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, minZoom));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg p-1">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= minZoom}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Reducir zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-white/80 font-mono min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= maxZoom}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/20" />
        <button
          onClick={handleReset}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Restablecer zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Componente simple de zoom solo para escala
export function SimpleChartZoom({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg p-1">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Reducir zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-white/80 font-mono min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 2}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/20" />
        <button
          onClick={handleReset}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Restablecer zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Chart container */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}