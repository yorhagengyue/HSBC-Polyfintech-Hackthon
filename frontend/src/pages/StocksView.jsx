import React from 'react';
import { motion } from 'framer-motion';
import MarketOverview from '../components/MarketOverview';
import WatchlistSection from '../components/WatchlistSection';
import PerformanceCard from '../components/PerformanceCard';
import InsiderTradesWidget from '../components/InsiderTradesWidget';
import MarketNews from '../components/MarketNews';
import RiskMeter from '../components/RiskMeter';
import AlertsTimeline from '../components/AlertsTimeline';
import ProductRecommendations from '../components/ProductRecommendations';

const StocksView = ({ 
  userStockData, 
  onRefresh, 
  isLoadingUserStocks,
  onStockSelect,
  onStartMonitoring,
  onTradeClick,
  riskScore,
  onRiskChange,
  alerts,
  onClearAlerts,
  onAlertClick
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Left Column - Market Overview and User Stocks */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <MarketOverview />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <WatchlistSection 
              userStockData={userStockData}
              onStockSelect={onStockSelect}
              onRemoveStock={(symbol) => console.log('Remove stock:', symbol)}
              onReorderStocks={(newOrder) => console.log('Reorder stocks:', newOrder)}
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <PerformanceCard userStockData={userStockData} />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <InsiderTradesWidget onTradeClick={onTradeClick} />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <MarketNews />
          </motion.div>
        </div>

        {/* Right Column - Risk Meter and Alerts */}
        <div className="space-y-8">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <RiskMeter riskScore={riskScore} onRiskChange={onRiskChange} />
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="h-[600px]"
          >
            <AlertsTimeline 
              alerts={alerts} 
              onClearAlerts={onClearAlerts}
              onAlertClick={onAlertClick}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StocksView; 