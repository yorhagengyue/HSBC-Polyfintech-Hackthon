import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle, Clock, Settings, TrendingDown } from 'lucide-react';
import AlertsTimeline from '../components/AlertsTimeline';
import RiskMeter from '../components/RiskMeter';
import AlertModal from '../components/AlertModal';

const AlertsView = ({ 
  alerts, 
  riskScore,
  onRiskChange,
  onClearAlerts,
  onAlertClick,
  userStockData 
}) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertSettings, setAlertSettings] = useState({
    priceDropThreshold: 5,
    volumeSpikeThreshold: 200,
    enableEmailAlerts: true,
    enablePushAlerts: true
  });

  // Categorize alerts
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = activeAlerts.filter(alert => alert.severity === 'high');
  const mediumAlerts = activeAlerts.filter(alert => alert.severity === 'medium');

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    onAlertClick(alert);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Alerts & Risk Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor and manage your portfolio risk alerts
        </p>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                {criticalAlerts.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">High</p>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                {highAlerts.length}
              </p>
            </div>
            <Bell className="w-8 h-8 text-orange-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Medium</p>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                {mediumAlerts.length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Resolved</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {alerts.filter(a => a.resolved).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alert Timeline - Takes 2 columns */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <AlertsTimeline 
              alerts={alerts}
              onClearAlerts={onClearAlerts}
              onAlertClick={handleAlertClick}
            />
          </motion.div>

          {/* Alert Settings */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Alert Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price Drop Threshold
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={alertSettings.priceDropThreshold}
                      onChange={(e) => setAlertSettings({
                        ...alertSettings,
                        priceDropThreshold: parseInt(e.target.value)
                      })}
                      className="w-32"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                      {alertSettings.priceDropThreshold}%
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Volume Spike Threshold
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="50"
                      value={alertSettings.volumeSpikeThreshold}
                      onChange={(e) => setAlertSettings({
                        ...alertSettings,
                        volumeSpikeThreshold: parseInt(e.target.value)
                      })}
                      className="w-32"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                      {alertSettings.volumeSpikeThreshold}%
                    </span>
                  </div>
                </label>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={alertSettings.enableEmailAlerts}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      enableEmailAlerts: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Push Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={alertSettings.enablePushAlerts}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      enablePushAlerts: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Risk Dashboard */}
        <div className="space-y-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <RiskMeter 
              riskScore={riskScore}
              onRiskChange={onRiskChange}
            />
          </motion.div>

          {/* Stocks at Risk */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
              Stocks at Risk
            </h3>
            
            {userStockData
              .filter(stock => stock.change_percent < -3)
              .slice(0, 5)
              .map((stock) => (
                <div 
                  key={stock.symbol}
                  className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {stock.symbol}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ${stock.price?.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-red-600">
                    {stock.change_percent?.toFixed(2)}%
                  </div>
                </div>
              ))
            }
            
            {userStockData.filter(stock => stock.change_percent < -3).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No stocks currently at risk
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Alert Modal */}
      {selectedAlert && (
        <AlertModal 
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};

export default AlertsView; 