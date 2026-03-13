'use client';

import React, { Suspense } from 'react';
import Spline from '@splinetool/react-spline';
import { Card } from '@/components/ui/Card';

export default function HeroSplineWidget() {
  return (
    <Card 
      variant="glass" 
      className="relative w-full h-[240px] flex items-center justify-center p-0 m-0 overflow-hidden"
      style={{ padding: 0 }}
    >
      <Suspense fallback={<div className="text-white opacity-50 text-xs">Loading Interactive Canvas...</div>}>
         <div className="absolute inset-0 pointer-events-auto">
            {/* The user provided .spline file from their editor. 
                We try to load it from the public directory. 
                Note: In production usually a .splinecode export URL is preferred. */}
            <Spline scene="/3d/RadiantShift.spline" />
         </div>
      </Suspense>
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(to top, rgba(11, 11, 11, 0.9), transparent)'
        }} 
      />
    </Card>
  );
}
