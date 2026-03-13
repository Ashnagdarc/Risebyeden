'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import SplineCanvas from '@/components/SplineCanvas';

export default function HeroSplineWidget() {
  return (
    <Card 
      variant="glass" 
      className="relative w-full h-[240px] flex items-center justify-center p-0 m-0 overflow-hidden"
      style={{ padding: 0 }}
    >
      <div className="absolute inset-0 pointer-events-auto">
        <SplineCanvas scene="/3d/RadiantShift.spline" />
      </div>
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(to top, rgba(11, 11, 11, 0.9), transparent)'
        }} 
      />
    </Card>
  );
}
