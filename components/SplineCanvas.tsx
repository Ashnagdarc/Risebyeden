'use client';

import React from 'react';
import Spline from '@splinetool/react-spline';
import SplineErrorBoundary from '@/components/SplineErrorBoundary';

type Props = {
  scene: string;
};

/**
 * Client-side Spline wrapper with error boundary.
 * Safe to use inside Server Components.
 */
export default function SplineCanvas({ scene }: Props) {
  return (
    <SplineErrorBoundary>
      <Spline scene={scene} />
    </SplineErrorBoundary>
  );
}
