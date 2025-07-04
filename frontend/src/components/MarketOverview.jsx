import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, TrendingDown, Activity, Clock, RefreshCw, MousePointer } from 'lucide-react';
import { stockAPI } from '../services/api';
import IndexDetailModal from './IndexDetailModal';

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1, decimals = 2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = value * easeOutQuart;
      
      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (value > 0) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span>
      {count.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}
    </span>
  );
};

// Enhanced Mini Chart with candlestick-like visualization
const EnhancedMiniChart = ({ isPositive, hasData, index }) => {
  // Generate sample data for mini chart
  const generateMiniData = () => {
    const points = 12;
    const data = [];
    for (let i = 0; i < points; i++) {
      const base = 50;
      const variation = isPositive ? (i * 3) : -(i * 3);
      const volatility = (Math.random() - 0.5) * 20;
      data.push({
        x: i,
        high: base + variation + Math.abs(volatility),
        low: base + variation - Math.abs(volatility),
        close: base + variation + volatility / 2
      });
    }
    return data;
  };

  const data = generateMiniData();
  const maxValue = Math.max(...data.map(d => d.high));
  const minValue = Math.min(...data.map(d => d.low));
  const range = maxValue - minValue;

  return (
    <div className="relative w-20 h-12 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 80 48">
        <defs>
          <linearGradient id={`miniGradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.4" />
            <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Background area */}
        <motion.path
          d={`M 0 ${48 - ((data[0].close - minValue) / range) * 40} ${data.map((d, i) => 
            `L ${(i / (data.length - 1)) * 80} ${48 - ((d.close - minValue) / range) * 40}`
          ).join(' ')} L 80 48 L 0 48 Z`}
          fill={`url(#miniGradient-${index})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 + index * 0.2 }}
        />
        
        {/* Candlestick-like bars */}
        {data.map((d, i) => (
          <motion.g key={i}>
            {/* High-Low line */}
            <motion.line
              x1={(i / (data.length - 1)) * 80}
              y1={48 - ((d.high - minValue) / range) * 40}
              x2={(i / (data.length - 1)) * 80}
              y2={48 - ((d.low - minValue) / range) * 40}
              stroke={hasData ? (isPositive ? '#10b981' : '#ef4444') : '#6b7280'}
              strokeWidth="1"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 1 + i * 0.1, type: "spring" }}
            />
            {/* Close price dot */}
            <motion.circle
              cx={(i / (data.length - 1)) * 80}
              cy={48 - ((d.close - minValue) / range) * 40}
              r="1.5"
              fill={hasData ? (isPositive ? '#10b981' : '#ef4444') : '#6b7280'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2 + i * 0.05, type: "spring" }}
            />
          </motion.g>
        ))}
        
        {/* Main trend line */}
        <motion.path
          d={`M 0 ${48 - ((data[0].close - minValue) / range) * 40} ${data.map((d, i) => 
            `L ${(i / (data.length - 1)) * 80} ${48 - ((d.close - minValue) / range) * 40}`
          ).join(' ')}`}
          fill="none"
          stroke={hasData ? (isPositive ? '#10b981' : '#ef4444') : '#6b7280'}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.8 + index * 0.2, ease: "easeInOut" }}
        />
        
        {/* Glow effect */}
        <motion.path
          d={`M 0 ${48 - ((data[0].close - minValue) / range) * 40} ${data.map((d, i) => 
            `L ${(i / (data.length - 1)) * 80} ${48 - ((d.close - minValue) / range) * 40}`
          ).join(' ')}`}
          fill="none"
          stroke={hasData ? (isPositive ? '#10b981' : '#ef4444') : '#6b7280'}
          strokeWidth="4"
          opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 + index * 0.2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};

const MarketOverview = () => {
  const [lastSync, setLastSync] = useState(new Date());
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['index-prices'],
    queryFn: async () => {
      const response = await stockAPI.getIndexPrices();
      setLastSync(new Date());
      // Ensure we always return an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If not array, return empty array or try to convert
      console.warn('Index prices API did not return an array:', response.data);
      return [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
    onError: (error) => {
      console.error('Error fetching index prices:', error);
    }
  });

  // Handle index click
  const handleIndexClick = (indexData, indexMeta) => {
    setSelectedIndex({
      ...indexData,
      ...indexMeta
    });
    setShowModal(true);
  };

  // Skeleton loader
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-hsbc-red" />
            Market Overview
          </h3>
          <div className="animate-pulse h-4 w-32 bg-gray-700 rounded" />
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Error handling
  if (error) {
    console.error('MarketOverview error:', error);
  }

  // Default to empty array if marketData is not an array
  const indices = Array.isArray(marketData) ? marketData : [];

  const marketIndices = [
    { symbol: '^GSPC', icon: '🇺🇸', name: 'S&P 500' },
    { symbol: '^DJI', icon: '📊', name: 'Dow Jones' },
    { symbol: '^IXIC', icon: '💻', name: 'NASDAQ' },
  ];

  // Check if market is open
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTime = utcHour + utcMinutes / 60;
  
  const isDST = true;
  const estOffset = isDST ? 4 : 5;
  const estTime = (utcTime - estOffset + 24) % 24;
  
  const dayOfWeek = now.getUTCDay();
  const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
  const isMarketHours = estTime >= 9.5 && estTime < 16;
  const isMarketOpen = isWeekday && isMarketHours;

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <>
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-fluid border border-gray-200/50 dark:border-gray-700/50 light:neumorphism shadow-lg card-hover card-adaptive">
        <div className="flex items-center justify-between mb-fluid-lg">
          <h3 className="text-xl-fluid font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-hsbc-red" />
            Market Overview
          </h3>
          <motion.div 
            className="flex items-center space-x-1 text-small text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Last-Sync {formatTime(lastSync)}</span>
          </motion.div>
        </div>

        <div className="space-y-fluid">
          {marketIndices.map((index, i) => {
            const data = indices.find(m => m.symbol === index.symbol);
            const hasData = data && data.price > 0;
            const isPositive = data?.change_percent > 0;

            return (
              <motion.div
                key={index.symbol}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                className="bg-white dark:bg-gray-800/50 rounded-xl p-fluid-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md group cursor-pointer relative overflow-hidden card-hover"
                onClick={() => hasData && handleIndexClick(data, index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Click hint overlay */}
                <motion.div
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ rotate: -45 }}
                  whileHover={{ rotate: 0 }}
                >
                  <MousePointer className="w-4 h-4 text-gray-400" />
                </motion.div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {/* Ghost Icon Background */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center">
                        <motion.span 
                          className="text-xl opacity-30 dark:opacity-20"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
                        >
                          📊
                        </motion.span>
                      </div>
                      <motion.span 
                        className="absolute inset-0 flex items-center justify-center text-large"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 + 0.4, type: "spring" }}
                      >
                        {index.icon}
                      </motion.span>
                    </div>
                    <div>
                      <span className="text-body font-semibold text-gray-900 dark:text-white">{data?.name || index.name}</span>
                      <p className="text-small text-gray-500 dark:text-gray-400 uppercase tracking-wide">Index • Click for details</p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1 + 0.5, type: "spring" }}
                    className="relative"
                  >
                    {/* Market Status Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      hasData ? 'bg-green-500/10' : 'bg-gray-500/10'
                    }`}>
                      <Activity className={`w-4 h-4 ${hasData ? 'text-green-500' : 'text-gray-400'}`} />
                    </div>
                    {hasData && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </motion.div>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <motion.div 
                      className="text-2xl-fluid font-bold tracking-tight text-gray-900 dark:text-white"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.2 + 0.8, type: "spring" }}
                    >
                      {hasData ? (
                        <span className="relative">
                          $<AnimatedCounter 
                            value={data.price} 
                            duration={1.5}
                            decimals={2}
                          />
                          {/* Color blur for market status */}
                          <div className={`absolute -inset-1 rounded-lg blur-xl opacity-20 ${
                            isMarketOpen ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                        </span>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </motion.div>
                    <div className="flex items-center space-x-2 mt-1">
                      {hasData ? (
                        <motion.div 
                          className={`flex items-center px-2 py-1 rounded-lg text-body ${
                            isPositive 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-red-500/10 text-red-500'
                          }`}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.2 + 1.2, type: "spring" }}
                        >
                          <motion.div
                            initial={{ rotate: isPositive ? -45 : 45 }}
                            animate={{ rotate: 0 }}
                            transition={{ delay: i * 0.2 + 1.4, type: "spring", stiffness: 200 }}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </motion.div>
                          <span className="ml-1 font-semibold">
                            {isPositive ? '+' : ''}<AnimatedCounter value={Math.abs(data.change)} duration={1} decimals={2} />
                          </span>
                          <span className="ml-1 text-small opacity-75">
                            ({isPositive ? '+' : ''}<AnimatedCounter value={Math.abs(data.change_percent)} duration={1} decimals={2} />%)
                          </span>
                        </motion.div>
                      ) : (
                        <span className="text-gray-500 text-body">Loading...</span>
                      )}
                      {/* Market Status Badge */}
                      <div className={`px-2 py-1 rounded-full text-small font-medium ${
                        isMarketOpen 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {isMarketOpen ? 'OPEN' : 'CLOSED'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Mini Chart */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                  >
                    <EnhancedMiniChart 
                      isPositive={isPositive} 
                      hasData={hasData} 
                      index={i}
                    />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Market Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, type: "spring" }}
          className={`mt-fluid p-3 rounded-lg text-center transition-all duration-500 ${
            isMarketOpen ? 'bg-green-500/20' : 'bg-gray-500/20'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <motion.div
              animate={{ 
                scale: isMarketOpen ? [1, 1.2, 1] : 1,
                opacity: isMarketOpen ? [1, 0.7, 1] : 0.7
              }}
              transition={{ 
                repeat: isMarketOpen ? Infinity : 0, 
                duration: 2 
              }}
            >
              <Clock className="w-4 h-4" />
            </motion.div>
            <p className={`text-body font-medium transition-colors duration-300 ${
              isMarketOpen ? 'text-green-400' : 'text-gray-400'
            }`}>
              {isMarketOpen ? 'Market is Open' : 'Market is Closed'}
            </p>
          </div>
          <motion.p 
            className="text-gray-500 text-small mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            {isMarketOpen ? 
              `Closes at 4:00 PM EST` : 
              isWeekday ? 
                `Opens at 9:30 AM EST` :
                `Opens Monday 9:30 AM EST`}
          </motion.p>
        </motion.div>
      </div>

      {/* Index Detail Modal */}
      <IndexDetailModal
        index={selectedIndex}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default MarketOverview; 