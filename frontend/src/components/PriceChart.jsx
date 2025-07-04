import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { stockAPI } from '../services/api';

const PriceChart = ({ symbol }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['stock-history', symbol],
    queryFn: async () => {
      const response = await stockAPI.getStockHistory(symbol, '1mo', '1d');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-hsbc-red"></div>
      </div>
    );
  }

  const chartData = history?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: item.close,
    high: item.high,
    low: item.low,
  })) || [];

  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));
  const priceRange = maxPrice - minPrice;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <p className="text-white font-medium">{label}</p>
          <p className="text-hsbc-red">
            Price: ${payload[0].value.toFixed(2)}
          </p>
          <p className="text-gray-400 text-sm">
            High: ${payload[0].payload.high.toFixed(2)}
          </p>
          <p className="text-gray-400 text-sm">
            Low: ${payload[0].payload.low.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ee0005" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ee0005" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            domain={[minPrice - priceRange * 0.1, maxPrice + priceRange * 0.1]}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#ee0005"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#ee0005' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default PriceChart; 