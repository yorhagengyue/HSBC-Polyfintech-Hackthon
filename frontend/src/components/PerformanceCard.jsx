import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceCard = ({ userStockData }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [portfolioReturn, setPortfolioReturn] = useState(0);
  const [spyReturn, setSpyReturn] = useState(0);
  const [timeRange, setTimeRange] = useState('1M'); // 1D, 1W, 1M, 3M, 1Y

  useEffect(() => {
    // Generate mock performance data
    generatePerformanceData();
  }, [userStockData, timeRange]);

  const generatePerformanceData = () => {
    const dataPoints = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : 365;
    const data = [];
    
    let portfolioValue = 100;
    let spyValue = 100;
    
    for (let i = 0; i < dataPoints; i++) {
      // Simulate daily returns with some volatility
      const portfolioDaily = (Math.random() - 0.48) * 2; // Portfolio slightly more volatile
      const spyDaily = (Math.random() - 0.49) * 1.5; // SPY less volatile
      
      portfolioValue *= (1 + portfolioDaily / 100);
      spyValue *= (1 + spyDaily / 100);
      
      data.push({
        date: i,
        portfolio: portfolioValue.toFixed(2),
        spy: spyValue.toFixed(2),
      });
    }
    
    setPerformanceData(data);
    setPortfolioReturn(((portfolioValue - 100) / 100 * 100).toFixed(2));
    setSpyReturn(((spyValue - 100) / 100 * 100).toFixed(2));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your portfolio vs S&P 500
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {['1D', '1W', '1M', '3M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Your Portfolio</span>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`flex items-center space-x-2 ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioReturn >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="text-2xl font-bold">
              {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn}%
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">S&P 500</span>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`flex items-center space-x-2 ${spyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {spyReturn >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="text-2xl font-bold">
              {spyReturn >= 0 ? '+' : ''}{spyReturn}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={performanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (timeRange === '1D') return `${value}h`;
                if (timeRange === '1W') return `D${value}`;
                return `${value}`;
              }}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value) => [`${value}%`, '']}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="portfolio" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              name="Your Portfolio"
            />
            <Line 
              type="monotone" 
              dataKey="spy" 
              stroke="#6B7280" 
              strokeWidth={2}
              dot={false}
              name="S&P 500"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alpha Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Alpha (vs S&P 500)</span>
          <span className={`text-lg font-bold ${
            (portfolioReturn - spyReturn) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {(portfolioReturn - spyReturn) >= 0 ? '+' : ''}
            {(portfolioReturn - spyReturn).toFixed(2)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceCard; 