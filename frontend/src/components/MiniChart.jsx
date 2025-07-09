import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown, TrendingUp, BarChart3, Activity, Volume2 } from 'lucide-react';
import { stockAPI } from '../services/api';

const MiniChart = ({ symbol, isOpen, onClose }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real chart data from API
  useEffect(() => {
    if (isOpen && symbol) {
      setLoading(true);
      setError(null);
      
      const fetchChartData = async () => {
        try {
          // Get 5-minute data for the last day (4 hours of trading)
          const response = await stockAPI.getStockHistory(symbol, '1d', '5m');
          
          if (response.data && response.data.length > 0) {
            const formattedData = response.data.map(item => ({
              time: new Date(item.date).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              timestamp: new Date(item.date),
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
              volume: item.volume
            }));
            
            setChartData(formattedData);
          } else {
            // If no intraday data available, try daily data
            const dailyResponse = await stockAPI.getStockHistory(symbol, '5d', '1d');
            
            if (dailyResponse.data && dailyResponse.data.length > 0) {
              const formattedData = dailyResponse.data.map(item => ({
                time: new Date(item.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
                timestamp: new Date(item.date),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume
              }));
              
              setChartData(formattedData);
            } else {
              throw new Error('No chart data available');
            }
          }
        } catch (err) {
          setError('Failed to load chart data');
          
          // Generate fallback mock data only if real API fails
          const basePrice = 150 + Math.random() * 50;
          const data = [];
          
          for (let i = 0; i < 48; i++) {
            const time = new Date(Date.now() - (47 - i) * 5 * 60 * 1000);
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * volatility;
            const price = i === 0 ? basePrice : data[i - 1].close * (1 + change);
            
            const high = price * (1 + Math.random() * 0.01);
            const low = price * (1 - Math.random() * 0.01);
            const open = i === 0 ? price : data[i - 1].close;
            const close = price;
            const volume = 50000 + Math.random() * 100000;
            
            data.push({
              time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              timestamp: time,
              open,
              high,
              low,
              close,
              volume
            });
          }
          
          setChartData(data);
        } finally {
          setLoading(false);
        }
      };
      
      fetchChartData();
    }
  }, [isOpen, symbol]);

  // Calculate price change from chart data
  const getPriceChange = () => {
    if (!chartData || chartData.length < 2) return { change: 0, changePercent: 0 };
    
    const firstPrice = chartData[0].close;
    const lastPrice = chartData[chartData.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return { change, changePercent };
  };

  const { change, changePercent } = getPriceChange();
  const isPositive = change >= 0;

  // Simple SVG line chart
  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    const width = 300;
    const height = 120;
    const padding = 10;
    
    const prices = chartData.map(d => d.close);
    const volumes = chartData.map(d => d.volume);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const maxVolume = Math.max(...volumes);
    
    // Generate price line path
    const pricePath = chartData.map((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = padding + ((maxPrice - point.close) / priceRange) * (height - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    // Generate volume bars
    const volumeBars = chartData.map((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const barHeight = (point.volume / maxVolume) * 30;
      const y = height - barHeight - 5;
      return { x, y, height: barHeight, volume: point.volume };
    });

    return (
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Volume bars */}
          {volumeBars.map((bar, index) => (
            <rect
              key={`volume-${index}`}
              x={bar.x - 1}
              y={bar.y}
              width="2"
              height={bar.height}
              fill="rgba(99, 102, 241, 0.3)"
            />
          ))}
          
          {/* Price line */}
          <path
            d={pricePath}
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {chartData.map((point, index) => {
            const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
            const y = padding + ((maxPrice - point.close) / priceRange) * (height - 2 * padding);
            
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r="2"
                fill={isPositive ? '#10b981' : '#ef4444'}
                className="opacity-70"
              />
            );
          })}
        </svg>
        
        {/* Price labels */}
        <div className="absolute top-2 left-2 text-xs text-gray-400">
          ${maxPrice.toFixed(2)}
        </div>
        <div className="absolute bottom-8 left-2 text-xs text-gray-400">
          ${minPrice.toFixed(2)}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          exit={{ y: 20 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{symbol}</h3>
                <p className="text-sm text-gray-400">Mini Chart</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Chart Error</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && chartData && (
            <div className="space-y-4">
              {/* Price Summary */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}
                  </span>
                  <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    ({changePercent.toFixed(2)}%)
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">
                    {chartData[chartData.length - 1]?.volume.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                {renderChart()}
              </div>

              {/* Time Range */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>{chartData[0]?.time}</span>
                <span>{chartData[chartData.length - 1]?.time}</span>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MiniChart; 