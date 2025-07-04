import React from 'react';
import { motion } from 'framer-motion';

export const StockCardSkeleton = () => (
  <div className="bg-gray-700/50 rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-6 w-20 bg-gray-600 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-600 rounded" />
      </div>
      <div className="text-right">
        <div className="h-8 w-24 bg-gray-600 rounded mb-2" />
        <div className="h-4 w-16 bg-gray-600 rounded" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex space-x-4">
        <div className="h-4 w-20 bg-gray-600 rounded" />
        <div className="h-4 w-20 bg-gray-600 rounded" />
      </div>
      <div className="h-8 w-8 bg-gray-600 rounded" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="h-64 bg-gray-700/50 rounded-lg animate-pulse p-4">
    <div className="h-6 w-32 bg-gray-600 rounded mb-4" />
    <div className="h-48 bg-gray-600/30 rounded" />
  </div>
);

export const MarketOverviewSkeleton = () => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
    <div className="h-6 w-32 bg-gray-600 rounded mb-4" />
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-700/30 rounded-lg p-4 animate-pulse">
          <div className="h-5 w-24 bg-gray-600 rounded mb-2" />
          <div className="flex justify-between">
            <div className="h-8 w-20 bg-gray-600 rounded" />
            <div className="h-6 w-16 bg-gray-600 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RiskMeterSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-32 flex items-center justify-center">
      <div className="w-32 h-32 bg-gray-600/30 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-5 w-24 bg-gray-600 rounded" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-4 w-full bg-gray-600/50 rounded" />
        ))}
      </div>
    </div>
  </div>
);

// Default skeleton loader component
const SkeletonLoader = ({ className = '', ...props }) => (
  <div 
    className={`animate-pulse bg-gray-600 rounded ${className}`}
    {...props}
  />
);

export default SkeletonLoader; 