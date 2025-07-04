import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, TrendingDown, Bell, Clock } from 'lucide-react';
import { UserPreferencesContext } from './UserPreferences';
import toast from 'react-hot-toast';

const AlertSystem = ({ stockData = [] }) => {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const { threshold } = useContext(UserPreferencesContext);
  const [previousPrices, setPreviousPrices] = useState({});

  // Monitor price changes and generate alerts
  useEffect(() => {
    if (!stockData || stockData.length === 0) return;

    const newAlerts = [];
    const currentTime = new Date();

    stockData.forEach(stock => {
      const previousPrice = previousPrices[stock.symbol];
      const currentPrice = stock.price;
      const changePercent = Math.abs(stock.change_percent || 0);

      // Check if price drop exceeds threshold
      if (previousPrice && currentPrice < previousPrice) {
        const dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100;
        
        if (dropPercent >= threshold) {
          const alertId = `${stock.symbol}-${currentTime.getTime()}`;
          
          if (!dismissedAlerts.has(alertId)) {
            const alert = {
              id: alertId,
              symbol: stock.symbol,
              name: stock.name,
              previousPrice,
              currentPrice,
              dropPercent: dropPercent.toFixed(2),
              timestamp: currentTime,
              type: dropPercent >= threshold * 2 ? 'critical' : 'warning'
            };
            
            newAlerts.push(alert);
            
            // Show toast notification
            toast.error(
              `${stock.symbol} dropped ${dropPercent.toFixed(1)}%`,
              {
                icon: '📉',
                duration: 5000,
              }
            );
          }
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep only 10 most recent
    }

    // Update previous prices for next comparison
    const newPreviousPrices = {};
    stockData.forEach(stock => {
      newPreviousPrices[stock.symbol] = stock.price;
    });
    setPreviousPrices(newPreviousPrices);
  }, [stockData, threshold, dismissedAlerts]);

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setDismissedAlerts(new Set());
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 left-4 z-50 max-w-sm">
      <AnimatePresence>
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: index * 0.1 
            }}
            className={`mb-3 p-4 rounded-xl shadow-2xl backdrop-blur-sm border ${
              alert.type === 'critical' 
                ? 'bg-red-900/90 border-red-500/50 text-red-100' 
                : 'bg-orange-900/90 border-orange-500/50 text-orange-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'critical' ? 'bg-red-500/20' : 'bg-orange-500/20'
                }`}>
                  {alert.type === 'critical' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-bold text-sm">{alert.symbol}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      alert.type === 'critical' 
                        ? 'bg-red-500/30 text-red-200' 
                        : 'bg-orange-500/30 text-orange-200'
                    }`}>
                      -{alert.dropPercent}%
                    </span>
                  </div>
                  
                  <p className="text-xs opacity-90 mb-2">
                    {alert.name}
                  </p>
                  
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="opacity-75">Previous:</span>
                      <span>${alert.previousPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Current:</span>
                      <span>${alert.currentPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 mt-2 text-xs opacity-75">
                    <Clock className="w-3 h-3" />
                    <span>
                      {alert.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => dismissAlert(alert.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Clear All Button */}
      {alerts.length > 1 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={clearAllAlerts}
          className="w-full mt-2 p-2 bg-gray-800/90 text-gray-300 text-xs rounded-lg hover:bg-gray-700/90 transition-colors backdrop-blur-sm border border-gray-600/50"
        >
          Clear All Alerts ({alerts.length})
        </motion.button>
      )}
    </div>
  );
};

export default AlertSystem; 