import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Calendar, Clock, BarChart3, Activity, DollarSign, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Generate realistic OHLC data for demonstration
const generateOHLCData = (symbol, currentPrice, change, timeframe = '1D') => {
  const data = [];
  const basePrice = currentPrice;
  
  // Define data points and intervals based on timeframe
  let dataPoints, intervalMs, dateFormat;
  
  switch (timeframe) {
    case '1D':
      dataPoints = 78; // 9:30 AM to 4:00 PM, 5-minute intervals
      intervalMs = 5 * 60 * 1000; // 5 minutes
      break;
    case '5D':
      dataPoints = 390; // 5 days * 78 intervals per day
      intervalMs = 5 * 60 * 1000;
      break;
    case '1M':
      dataPoints = 22; // ~22 trading days
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '3M':
      dataPoints = 65; // ~65 trading days
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case '6M':
      dataPoints = 130; // ~130 trading days
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case '1Y':
      dataPoints = 252; // ~252 trading days
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    default:
      dataPoints = 30;
      intervalMs = 24 * 60 * 60 * 1000;
  }
  
  // Adjust starting price based on timeframe to show more realistic movement
  let price = basePrice - Math.abs(change) * (dataPoints / 30);
  
  for (let i = 0; i < dataPoints; i++) {
    const open = price;
    
    // Adjust volatility based on timeframe
    let volatilityFactor;
    if (timeframe === '1D' || timeframe === '5D') {
      volatilityFactor = 0.002; // ±0.2% for intraday
    } else if (timeframe === '1M') {
      volatilityFactor = 0.02; // ±2% for daily
    } else {
      volatilityFactor = 0.03; // ±3% for longer periods
    }
    
    const changePercent = (Math.random() - 0.5) * 2 * volatilityFactor;
    
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * volatilityFactor);
    const low = Math.min(open, close) * (1 - Math.random() * volatilityFactor);
    const volume = Math.floor(Math.random() * 10000000 + 5000000);
    
    // Calculate date based on timeframe
    let date;
    if (timeframe === '1D') {
      // For 1D, show today's data
      const today = new Date();
      today.setHours(9, 30, 0, 0); // Market open at 9:30 AM
      date = new Date(today.getTime() + i * intervalMs);
    } else {
      // For other timeframes, go back from current date
      date = new Date(Date.now() - (dataPoints - i - 1) * intervalMs);
    }
    
    data.push({
      date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    price = close;
  }
  
  // Ensure last price matches current price for non-intraday views
  if (data.length > 0 && timeframe !== '1D') {
    const adjustment = currentPrice / data[data.length - 1].close;
    // Adjust last few data points to smoothly reach current price
    const adjustPoints = Math.min(5, data.length);
    for (let i = data.length - adjustPoints; i < data.length; i++) {
      const factor = 1 + (adjustment - 1) * ((i - (data.length - adjustPoints)) / adjustPoints);
      data[i].open *= factor;
      data[i].high *= factor;
      data[i].low *= factor;
      data[i].close *= factor;
    }
    data[data.length - 1].close = currentPrice;
  }
  
  return data;
};

const IndexDetailModal = ({ index, isOpen, onClose }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [chartData, setChartData] = useState([]);
  const [hoveredData, setHoveredData] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [chartType, setChartType] = useState('line'); // 'line' or 'candle'

  useEffect(() => {
    if (index && isOpen) {
      const data = generateOHLCData(index.symbol, index.price, index.change, timeframe);
      setChartData(data);
      // Reset zoom and pan when changing timeframe
      setZoomLevel(1);
      setPanOffset(0);
      // Auto-select chart type based on timeframe
      if (timeframe === '1D' || timeframe === '5D') {
        setChartType('line');
      } else {
        setChartType('candle');
      }
    }
  }, [index, isOpen, timeframe]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!index || !isOpen) return null;

  const isPositive = index.change_percent > 0;
  const maxPrice = Math.max(...chartData.map(d => d.high));
  const minPrice = Math.min(...chartData.map(d => d.low));
  const priceRange = maxPrice - minPrice;

  // Handle mouse events for chart interaction
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Calculate which data point is being hovered
    const chartWidth = 580;
    const chartStart = 10;
    const adjustedX = (x - chartStart) / zoomLevel - panOffset;
    const dataIndex = Math.round((adjustedX / chartWidth) * (chartData.length - 1));
    
    if (dataIndex >= 0 && dataIndex < chartData.length) {
      setHoveredData({ ...chartData[dataIndex], index: dataIndex });
    }
    
    // Handle dragging
    if (isDragging && dragStart) {
      const deltaX = x - dragStart.x;
      const newOffset = dragStart.offset + deltaX / zoomLevel;
      // Limit pan based on zoom level
      const maxOffset = (chartWidth * (zoomLevel - 1)) / zoomLevel;
      setPanOffset(Math.max(-maxOffset, Math.min(0, newOffset)));
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      const rect = svgRef.current.getBoundingClientRect();
      setDragStart({ x: e.clientX - rect.left, offset: panOffset });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 1));
    if (zoomLevel <= 1.5) {
      setPanOffset(0);
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  // Generate candlestick chart
  const CandlestickChart = () => {
    // Calculate visible data points based on timeframe
    let visiblePoints = chartData.length;
    if (timeframe === '1D') {
      visiblePoints = Math.min(78, chartData.length); // Show all intraday data
    } else if (timeframe === '5D') {
      visiblePoints = Math.min(390, chartData.length);
    } else if (timeframe === '1Y') {
      // For 1Y, show monthly candles (about 12 points)
      visiblePoints = Math.min(52, chartData.length); // Weekly view
    }
    
    // Sample data for better performance on large datasets
    let displayData = chartData;
    if (chartData.length > 100 && timeframe !== '1D') {
      const step = Math.floor(chartData.length / 100);
      displayData = chartData.filter((_, index) => index % step === 0);
    }
    
    return (
      <div className="relative w-full">
        {/* Zoom Controls */}
        <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Tooltip */}
        {hoveredData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-20 pointer-events-none"
            style={{
              left: Math.min(Math.max(mousePosition.x, 100), 400),
              top: Math.max(mousePosition.y - 100, 10)
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl">
              <div className="text-xs text-gray-400 mb-1">
                {timeframe === '1D' 
                  ? hoveredData.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : hoveredData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between space-x-6">
                  <span className="text-gray-400">Open:</span>
                  <span className="text-white font-medium">${hoveredData.open.toFixed(2)}</span>
                </div>
                <div className="flex justify-between space-x-6">
                  <span className="text-gray-400">High:</span>
                  <span className="text-green-400 font-medium">${hoveredData.high.toFixed(2)}</span>
                </div>
                <div className="flex justify-between space-x-6">
                  <span className="text-gray-400">Low:</span>
                  <span className="text-red-400 font-medium">${hoveredData.low.toFixed(2)}</span>
                </div>
                <div className="flex justify-between space-x-6">
                  <span className="text-gray-400">Close:</span>
                  <span className="text-white font-medium">${hoveredData.close.toFixed(2)}</span>
                </div>
                <div className="flex justify-between space-x-6 pt-1 border-t border-gray-700">
                  <span className="text-gray-400">Volume:</span>
                  <span className="text-blue-400 font-medium">
                    {(hoveredData.volume / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between space-x-6">
                  <span className="text-gray-400">Change:</span>
                  <span className={`font-medium ${hoveredData.close >= hoveredData.open ? 'text-green-400' : 'text-red-400'}`}>
                    {hoveredData.close >= hoveredData.open ? '+' : ''}
                    {((hoveredData.close - hoveredData.open) / hoveredData.open * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="w-full h-64 bg-gray-900/50 rounded-lg p-4 overflow-hidden">
          <svg 
            ref={svgRef}
            width="100%" 
            height="100%" 
            viewBox="0 0 600 260"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'crosshair') }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            <g transform={`scale(${zoomLevel}, 1) translate(${panOffset}, 0)`}>
              {/* Main chart area */}
              <g>
                {/* Grid lines for price chart */}
                {[0, 1, 2, 3].map(i => (
                  <line
                    key={`grid-${i}`}
                    x1="0"
                    y1={i * 40}
                    x2="600"
                    y2={i * 40}
                    stroke="#374151"
                    strokeWidth="0.5"
                    opacity="0.5"
                  />
                ))}
                
                {/* Separator line between price and volume */}
                <line
                  x1="0"
                  y1="160"
                  x2="600"
                  y2="160"
                  stroke="#4b5563"
                  strokeWidth="1"
                  opacity="0.8"
                />

                {/* Crosshair */}
                {hoveredData && (
                  <>
                                      {/* Vertical line */}
                  <line
                    x1={(hoveredData.index / (chartData.length - 1)) * 580 + 10}
                    y1="0"
                    x2={(hoveredData.index / (chartData.length - 1)) * 580 + 10}
                    y2="240"
                    stroke="#6b7280"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                  {/* Horizontal line at close price */}
                  <line
                    x1="0"
                    y1={150 - ((hoveredData.close - minPrice) / priceRange) * 130}
                    x2="600"
                    y2={150 - ((hoveredData.close - minPrice) / priceRange) * 130}
                    stroke="#6b7280"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                  </>
                )}
                
                {/* Candlesticks for candle chart type */}
                {chartType === 'candle' && displayData.map((d, i) => {
                  const x = (i / (displayData.length - 1)) * 580 + 10;
                  const candleWidth = Math.max(2, 580 / displayData.length - 2);
                  const isGreen = d.close >= d.open;
                  const isHovered = hoveredData && hoveredData.index === i;
                  
                  return (
                    <g key={i}>
                      {/* High-Low line */}
                      <line
                        x1={x}
                        y1={150 - ((d.high - minPrice) / priceRange) * 130}
                        x2={x}
                        y2={150 - ((d.low - minPrice) / priceRange) * 130}
                        stroke={isGreen ? "#10b981" : "#ef4444"}
                        strokeWidth={isHovered ? "2" : "1"}
                        opacity={isHovered ? "1" : "0.8"}
                      />
                      {/* Open-Close box */}
                      <rect
                        x={x - candleWidth / 2}
                        y={150 - ((Math.max(d.open, d.close) - minPrice) / priceRange) * 130}
                        width={candleWidth}
                        height={Math.abs(((d.close - d.open) / priceRange) * 130) || 1}
                        fill={isGreen ? "#10b981" : "#ef4444"}
                        opacity={isHovered ? "1" : "0.8"}
                        stroke={isHovered ? "#ffffff" : "none"}
                        strokeWidth={isHovered ? "1" : "0"}
                      />
                    </g>
                  );
                })}
                
                {/* Price line for all timeframes when line chart is selected */}
                {chartType === 'line' && (
                  <>
                    <motion.path
                      d={`M ${displayData.map((d, i) => `${(i / (displayData.length - 1)) * 580 + 10},${150 - ((d.close - minPrice) / priceRange) * 130}`).join(' L ')}`}
                      fill="none"
                      stroke={isPositive ? "#10b981" : "#ef4444"}
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                    
                    {/* Fill area under curve */}
                    <motion.path
                      d={`M ${displayData.map((d, i) => `${(i / (displayData.length - 1)) * 580 + 10},${150 - ((d.close - minPrice) / priceRange) * 130}`).join(' L ')} L 590,150 L 10,150 Z`}
                      fill="url(#priceGradient)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                    />
                    
                    {/* Interactive hover dots */}
                    {hoveredData && (
                      <motion.circle
                        cx={(hoveredData.index / (chartData.length - 1)) * 580 + 10}
                        cy={150 - ((hoveredData.close - minPrice) / priceRange) * 130}
                        r="4"
                        fill={isPositive ? "#10b981" : "#ef4444"}
                        stroke="#ffffff"
                        strokeWidth="2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.5 }}
                        transition={{ type: "spring" }}
                      />
                    )}
                  </>
                )}
                
                {/* Data points for smaller datasets in line chart mode */}
                {chartType === 'line' && displayData.length <= 50 && displayData.map((d, i) => (
                  <motion.circle
                    key={i}
                    cx={(i / (displayData.length - 1)) * 580 + 10}
                    cy={150 - ((d.close - minPrice) / priceRange) * 130}
                    r={hoveredData && hoveredData.index === i ? "4" : "2"}
                    fill={isPositive ? "#10b981" : "#ef4444"}
                    stroke={hoveredData && hoveredData.index === i ? "#ffffff" : "none"}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 + i * 0.02, type: "spring" }}
                  />
                ))}
              </g>
              
              {/* Volume chart */}
              <g>
                {displayData.map((d, i) => {
                  const x = (i / (displayData.length - 1)) * 580 + 10;
                  const barWidth = Math.max(1, 580 / displayData.length - 1);
                  const maxVolume = Math.max(...chartData.map(d => d.volume));
                  const volumeHeight = (d.volume / maxVolume) * 60;
                  const isGreen = d.close >= d.open;
                  
                  return (
                    <rect
                      key={`vol-${i}`}
                      x={x - barWidth / 2}
                      y={240 - volumeHeight}
                      width={barWidth}
                      height={volumeHeight}
                      fill={isGreen ? "#10b981" : "#ef4444"}
                      opacity={hoveredData && hoveredData.index === i ? "0.8" : "0.4"}
                    />
                  );
                })}
              </g>
            </g>
            
            {/* Price labels - outside of transform group */}
            <text x="10" y="15" fill="#9ca3af" fontSize="12">
              ${maxPrice.toFixed(2)}
            </text>
            <text x="10" y="155" fill="#9ca3af" fontSize="12">
              ${minPrice.toFixed(2)}
            </text>
            
            {/* Volume label */}
            <text x="10" y="175" fill="#6b7280" fontSize="10">
              Volume
            </text>
            
            {/* Current price indicator */}
            {hoveredData && (
              <g>
                <rect
                  x="545"
                  y={180 - ((hoveredData.close - minPrice) / priceRange) * 160 - 10}
                  width="55"
                  height="20"
                  fill="#1f2937"
                  stroke={hoveredData.close >= hoveredData.open ? "#10b981" : "#ef4444"}
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x="572"
                  y={180 - ((hoveredData.close - minPrice) / priceRange) * 160 + 4}
                  fill={hoveredData.close >= hoveredData.open ? "#10b981" : "#ef4444"}
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  ${hoveredData.close.toFixed(2)}
                </text>
              </g>
            )}
            
            {/* Time labels */}
            {displayData.length > 0 && (
              <>
                <text x="10" y="210" fill="#6b7280" fontSize="10">
                  {timeframe === '1D' 
                    ? displayData[0].date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : displayData[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                </text>
                <text x="550" y="210" fill="#6b7280" fontSize="10" textAnchor="end">
                  {timeframe === '1D' 
                    ? displayData[displayData.length - 1].date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : displayData[displayData.length - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                </text>
              </>
            )}
          </svg>
        </div>
      </div>
    );
  };

  const timeframes = ['1D', '5D', '1M', '3M', '6M', '1Y'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {index.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {index.symbol} • Index
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Price Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-baseline space-x-3">
                  <motion.span
                    className="text-4xl font-bold text-gray-900 dark:text-white"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    ${index.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </motion.span>
                  <motion.div
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg ${
                      isPositive 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-semibold">
                      {isPositive ? '+' : ''}{index.change?.toFixed(2)}
                    </span>
                    <span className="text-sm opacity-75">
                      ({isPositive ? '+' : ''}{index.change_percent?.toFixed(2)}%)
                    </span>
                  </motion.div>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-green-500">Live</span>
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Today's High</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(index.price * 1.012).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Today's Low</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(index.price * 0.988).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Volume</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(Math.random() * 50 + 20).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Market Cap</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(Math.random() * 10 + 35).toFixed(1)}T
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Price Chart
              </h3>
              <div className="flex items-center space-x-4">
                {/* Chart Type Selector */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      chartType === 'line'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('candle')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      chartType === 'candle'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Candle
                  </button>
                </div>
                
                {/* Timeframe Selector */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        timeframe === tf
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CandlestickChart />
              
              {/* Chart Interaction Hints */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-gray-500 rounded-sm"></div>
                    <span>Hover for details</span>
                  </div>
                  {zoomLevel > 1 && (
                    <div className="flex items-center space-x-1">
                      <motion.div 
                        className="w-3 h-3 border border-gray-500 rounded-sm"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 0.8, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                      <span>Drag to pan</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <ZoomIn className="w-3 h-3" />
                    <span>Zoom controls</span>
                  </div>
                </div>
                
                {/* Keyboard shortcuts */}
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">+</kbd>
                    <span>Zoom in</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">-</kbd>
                    <span>Zoom out</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">0</kbd>
                    <span>Reset</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">ESC</kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <motion.div
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">52W High</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${(index.price * 1.15).toFixed(2)}
                </span>
              </motion.div>

              <motion.div
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">52W Low</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${(index.price * 0.85).toFixed(2)}
                </span>
              </motion.div>

              <motion.div
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">P/E Ratio</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(Math.random() * 10 + 15).toFixed(1)}
                </span>
              </motion.div>

              <motion.div
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Volume</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(Math.random() * 20 + 30).toFixed(1)}M
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IndexDetailModal; 