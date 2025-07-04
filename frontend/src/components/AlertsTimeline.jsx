import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, TrendingDown, AlertTriangle, Zap, X, Circle } from 'lucide-react';

const AlertsTimeline = ({ alerts = [], onClearAlerts, onAlertClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const timelineRef = useRef(null);
  const [displayAlerts, setDisplayAlerts] = useState([]);

  // Update display alerts when new alerts come in
  useEffect(() => {
    // Add unique IDs and unread status to alerts if not present
    const alertsWithMeta = alerts.map((alert, index) => ({
      ...alert,
      id: alert.id || `alert-${Date.now()}-${index}`,
      isUnread: alert.isUnread !== false,
      timestamp: alert.timestamp || new Date().toISOString()
    }));

    setDisplayAlerts(alertsWithMeta);
    
    // Count unread alerts
    const unread = alertsWithMeta.filter(a => a.isUnread).length;
    setUnreadCount(unread);

    // Auto-scroll to top when new alert arrives
    if (timelineRef.current && alertsWithMeta.length > 0) {
      timelineRef.current.scrollTop = 0;
    }
  }, [alerts]);

  const handleAlertClick = (alertId) => {
    // Mark as read
    setDisplayAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isUnread: false } : alert
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Call parent handler if provided
    if (onAlertClick) {
      const alert = displayAlerts.find(a => a.id === alertId);
      onAlertClick(alert);
    }
  };

  const handleClearAll = () => {
    setDisplayAlerts([]);
    setUnreadCount(0);
    if (onClearAlerts) {
      onClearAlerts();
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="w-4 h-4" />;
      case 'major_news':
        return <Zap className="w-4 h-4" />;
      case 'risk_alert':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getAlertColor = (type, severity) => {
    // Semantic colors based on alert type
    const typeColors = {
      'price_drop': 'border-l-red-500 bg-red-500/5',
      'major_news': 'border-l-yellow-500 bg-yellow-500/5', 
      'insider_trading': 'border-l-purple-500 bg-purple-500/5',
      'risk_alert': 'border-l-orange-500 bg-orange-500/5'
    };
    
    const baseColor = typeColors[type] || 'border-l-gray-500 bg-gray-500/5';
    
    // Add severity intensity
    const intensityClass = severity === 'high' ? 'border-l-4' : 'border-l-3';
    
    return `${baseColor} ${intensityClass}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-fluid border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-full flex flex-col card-adaptive card-hover">
      <div className="flex items-center justify-between mb-fluid-lg">
        <div className="flex items-center">
          <h3 className="text-xl-fluid font-bold text-gray-900 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-hsbc-red" />
            Real-Time Alerts
        </h3>
          <AnimatePresence>
            {alerts.filter(a => a.isUnread).length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="ml-2 bg-hsbc-red text-white text-small px-2 py-0.5 rounded-full font-medium"
              >
                {alerts.filter(a => a.isUnread).length}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onClearAlerts}
          className="text-small text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
        style={{ maxHeight: '600px' }}
      >
        <AnimatePresence>
          {displayAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 text-center py-8"
            >
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active alerts</p>
              <p className="text-sm mt-1">We're monitoring the markets for you</p>
            </motion.div>
          ) : (
            displayAlerts.slice(0, 50).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleAlertClick(alert.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700/50 border ${
                  getAlertColor(alert.type, alert.severity || 'medium')
                } ${alert.isUnread ? 'relative ring-1 ring-blue-500/20' : 'opacity-75'}`}
              >
                {alert.isUnread && (
                  <Circle className="absolute top-2 right-2 w-2 h-2 fill-red-500 text-red-500" />
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-white font-medium flex items-center">
                        {alert.title}
                        {alert.severity === 'high' && (
                          <span className="ml-2" title="High severity alert">🔥</span>
                        )}
                      </h4>
                                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{alert.message}</p>
                      
                      {alert.details && (
                        <div className="mt-2 text-xs text-gray-500">
                          {alert.details.symbol && (
                            <span className="inline-block bg-gray-700 px-2 py-1 rounded mr-2">
                              {alert.details.symbol}
                            </span>
                          )}
                          {alert.details.change_percent && (
                            <span className={`inline-block px-2 py-1 rounded ${
                              alert.details.change_percent < 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {alert.details.change_percent > 0 ? '+' : ''}{alert.details.change_percent}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>{formatTime(alert.timestamp)}</span>
                  {alert.source && (
                    <span className="text-gray-600">{alert.source}</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {displayAlerts.length > 10 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 border-t border-gray-700 text-center"
        >
          <p className="text-sm text-gray-500">
            Showing {Math.min(displayAlerts.length, 50)} of {displayAlerts.length} alerts
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AlertsTimeline; 