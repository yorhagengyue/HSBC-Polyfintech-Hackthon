import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MarketOverview from '../components/MarketOverview';
import AlertsTimeline from '../components/AlertsTimeline';
import RiskMeter from '../components/RiskMeter';
import AIChat from '../components/AIChat';
import UserPreferences from '../components/UserPreferences';
import InsiderTradesWidget from '../components/InsiderTradesWidget';
import StockDetails from '../components/StockDetails';
import AlertDetails from '../components/AlertDetails';
import InsiderTradeDetails from '../components/InsiderTradeDetails';
import ThemeToggle from '../components/ThemeToggle';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import StockManager from '../components/StockManager';
import UserStocksList from '../components/UserStocksList';
import MarketNews from '../components/MarketNews';
import AlertSystem from '../components/AlertSystem';
import HSBCRecommendations from '../components/HSBCRecommendations';
import BankAccounts from '../components/BankAccounts';
import TransactionsTable from '../components/TransactionsTable';
import useEventStream from '../hooks/useEventStream';
import { stockAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const Dashboard = () => {
  const { toggleTheme, isDarkMode } = useTheme();
  const [userStockData, setUserStockData] = useState([]);
  const [isLoadingUserStocks, setIsLoadingUserStocks] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Handle user stock list updates from StockManager
  const handleUserStockListUpdate = useCallback((stocks) => {
    setUserStockData(stocks);
  }, []);

  // Refresh user stock data
  const refreshUserStocks = useCallback(() => {
    // This will be triggered from UserStocksList component
    // The actual refresh is handled by StockManager
    console.log('Refreshing user stocks...');
  }, []);

  // Calculate risk score based on alerts
  const calculateRiskScore = useCallback((alertsList) => {
    if (alertsList.length === 0) return 0;
    
    // Get recent alerts (last hour)
    const recentAlerts = alertsList.filter(alert => {
      const alertTime = new Date(alert.timestamp);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return alertTime > hourAgo;
    });

    // Base score on severity and frequency
    let score = 0;
    recentAlerts.forEach(alert => {
      if (alert.severity === 'high') score += 20;
      else if (alert.severity === 'medium') score += 10;
      else if (alert.severity === 'low') score += 5;
    });

    // Add frequency component
    if (recentAlerts.length > 10) score += 20;
    else if (recentAlerts.length > 5) score += 10;

    // Cap at 100
    return Math.min(score, 100);
  }, []);

  // WebSocket event handler
  const handleWebSocketMessage = useCallback((data) => {
    console.log('Received WebSocket event:', data);
    
    if (data.type === 'price_drop' || data.type === 'major_news' || data.type === 'risk_alert') {
      // Add new alert
      const newAlert = {
        ...data,
        id: `alert-${Date.now()}`,
        isUnread: true,
        timestamp: data.timestamp || new Date().toISOString()
      };
      
      setAlerts(prev => {
        const updated = [newAlert, ...prev];
        // Calculate new risk score
        const impactScore = data.impact?.score || 0;
        setRiskScore(impactScore);
        return updated;
      });
    }
  }, []);

  // WebSocket connection handlers
  const handleConnect = useCallback(() => {
    console.log('WebSocket connected');
    setWsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected');
    setWsConnected(false);
  }, []);

  // Initialize WebSocket connection
  useEventStream(handleWebSocketMessage, handleConnect, handleDisconnect);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      
      // Prevent shortcuts when typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        // Only allow Escape to close modals when in input
        if (event.key === 'Escape') {
          event.target.blur();
          setSelectedStock(null);
          setSelectedAlert(null);
          setSelectedTrade(null);
          setSelectedAccount(null);
          setSelectedTransaction(null);
          setShowShortcuts(false);
          setShowPreferences(false);
        }
        return;
      }

      // Handle shortcuts
      if (isCtrl && event.key === '/') {
        event.preventDefault();
        setShowShortcuts(!showShortcuts);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedStock(null);
        setSelectedAlert(null);
        setSelectedTrade(null);
        setSelectedAccount(null);
        setSelectedTransaction(null);
        setShowShortcuts(false);
        setShowPreferences(false);
      } else if (isShift && event.key.toLowerCase() === 's') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
        }
      } else if (isShift && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        const addButton = document.querySelector('[data-add-stock]');
        if (addButton) {
          addButton.click();
        }
      } else if (isShift && event.key === 'ArrowUp') {
        event.preventDefault();
        if (isDarkMode) toggleTheme();
      } else if (isShift && event.key === 'ArrowDown') {
        event.preventDefault();
        if (!isDarkMode) toggleTheme();
      } else if (isCtrl && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        toggleTheme();
      } else if (isCtrl && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        setSelectedStock(null);
        setSelectedAlert(null);
        setSelectedTrade(null);
        setSelectedAccount(null);
        setSelectedTransaction(null);
        setShowShortcuts(false);
        setShowPreferences(false);
      } else if (isCtrl && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        window.location.reload();
      } else if (isCtrl && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        // Focus AI chat (this would need to be implemented in AIChat component)
        console.log('Open AI chat');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, isDarkMode, toggleTheme]);

  // Load initial sample alerts
  useEffect(() => {
    const sampleAlerts = [
      {
        id: 'alert-1',
        type: 'price_drop',
        severity: 'high',
        title: 'AAPL dropped 5.2%',
        message: 'Apple stock fell below your threshold',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        isUnread: true,
        details: {
          symbol: 'AAPL',
          change_percent: -5.2
        }
      },
      {
        id: 'alert-2',
        type: 'major_news',
        severity: 'medium',
        title: 'Fed Rate Decision',
        message: 'Federal Reserve announces rate hike',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        isUnread: false,
        source: 'Reuters'
      }
    ];
    
    setAlerts(sampleAlerts);
    setRiskScore(calculateRiskScore(sampleAlerts));
  }, [calculateRiskScore]);

  const handleClearAlerts = () => {
    setAlerts([]);
    setRiskScore(0);
  };

  const handleAlertClick = (alert) => {
    // This could open AI chat with context about the alert
    console.log('Alert clicked:', alert);
    setSelectedAlert(alert);
  };

  const handleTradeClick = (trade) => {
    console.log('Trade clicked:', trade);
    setSelectedTrade(trade);
  };

  const handleStartMonitoring = async (monitoringData) => {
    try {
      await stockAPI.startMonitoring(monitoringData);
      console.log('Started monitoring:', monitoringData);
      // Could show a success toast here
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      // Could show an error toast here
    }
  };

  // Banking handlers
  const handleAccountSelect = (account) => {
    console.log('Account selected:', account);
    setSelectedAccount(account);
  };

  const handleTransactionSelect = (transaction) => {
    console.log('Transaction selected:', transaction);
    setSelectedTransaction(transaction);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-tr dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 light:bg-gradient-to-br light:from-gray-100 light:via-gray-50 light:to-gray-200">
      {/* Background gradient spots for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-hsbc-red/20 via-blue-500/10 to-transparent blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 via-pink-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 light:neumorphism sticky top-0 z-40 transition-all duration-300">
        <div className="w-full max-w-none px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                {/* HSBC Brand Collaboration */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-hsbc-red to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">H</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Financial Alarm Clock</span>
                  </div>
                  <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div className="w-1.5 h-1.5 bg-hsbc-red rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Powered by HSBC
                    </span>
                  </div>
                </div>
              </div>
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div 
                  className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}
                  animate={{ 
                    scale: wsConnected ? [1, 1.2, 1] : 1,
                    boxShadow: wsConnected ? [
                      '0 0 0 0 rgba(16, 185, 129, 0.4)',
                      '0 0 0 4px rgba(16, 185, 129, 0)',
                      '0 0 0 0 rgba(16, 185, 129, 0)'
                    ] : [
                      '0 0 0 0 rgba(239, 68, 68, 0.4)',
                      '0 0 0 4px rgba(239, 68, 68, 0)',
                      '0 0 0 0 rgba(239, 68, 68, 0)'
                    ]
                  }}
                  transition={{ 
                    repeat: wsConnected ? Infinity : 0, 
                    duration: 2 
                  }}
                />
                <motion.span 
                  className={`text-xs transition-colors duration-300 ${
                    wsConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ 
                    repeat: wsConnected ? 0 : Infinity, 
                    duration: 1.5 
                  }}
                >
                  {wsConnected ? 'Real-time Connected' : 'Reconnecting...'}
                </motion.span>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <StockManager onStockListUpdate={handleUserStockListUpdate} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Responsive Grid */}
      <main className="w-full max-w-none px-8 py-8">
        {/* Scrollable container for ultra-wide screens */}
        <div className="overflow-x-auto hide-scrollbar">
          <section className="grid gap-8 
                            grid-cols-1 
                            md:grid-cols-2 
                            xl:grid-cols-3 
                            2xl:grid-cols-[repeat(auto-fill,minmax(360px,1fr))]
                            3xl:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]
                            grid-flow-dense
                            auto-rows-min
                            min-w-full">
            
            {/* Market Overview - spans 2 columns on larger screens */}
            <motion.div
              className="md:col-span-2 xl:col-span-2 2xl:col-span-2 min-w-[320px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <MarketOverview />
            </motion.div>

            {/* Risk Meter - important, place early */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="h-full min-w-[320px]"
            >
              <RiskMeter riskScore={riskScore} onRiskChange={setRiskScore} />
            </motion.div>

            {/* User Custom Stocks - spans full width on xl+ */}
            <motion.div
              className="md:col-span-2 xl:col-span-3 2xl:col-span-2 min-w-[320px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <UserStocksList 
                userStockData={userStockData}
                onRefresh={refreshUserStocks}
                isLoading={isLoadingUserStocks}
                onStockSelect={setSelectedStock}
                onStartMonitoring={handleStartMonitoring}
              />
            </motion.div>

            {/* Alerts Timeline */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-1 xl:col-span-1 2xl:col-span-1 min-h-[400px] xl:min-h-[600px] min-w-[320px]"
            >
              <AlertsTimeline 
                alerts={alerts} 
                onClearAlerts={handleClearAlerts}
                onAlertClick={handleAlertClick}
              />
            </motion.div>

            {/* Insider Trades - spans 2 columns */}
            <motion.div
              className="md:col-span-2 xl:col-span-2 2xl:col-span-2 min-w-[320px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <InsiderTradesWidget onTradeClick={handleTradeClick} />
            </motion.div>
            
            {/* Additional cards for 4K displays */}
            {/* Market News Widget - no longer a placeholder */}
            <motion.div
              className="md:col-span-2 xl:col-span-2 2xl:col-span-2 min-w-[320px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <MarketNews />
            </motion.div>

            {/* HSBC Bank Accounts */}
            <motion.div
              className="md:col-span-2 xl:col-span-2 2xl:col-span-2 min-w-[320px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <BankAccounts 
                onAccountSelect={handleAccountSelect}
                selectedAccountId={selectedAccount?.account_id}
              />
            </motion.div>

            {/* Transactions Table */}
            <motion.div
              className="md:col-span-2 xl:col-span-3 2xl:col-span-3 min-w-[320px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <TransactionsTable 
                account={selectedAccount}
                onTransactionSelect={handleTransactionSelect}
              />
            </motion.div>

            {/* HSBC Recommendations - only shows in Low Risk Mode */}
            <motion.div
              className="md:col-span-2 xl:col-span-3 2xl:col-span-3 min-w-[320px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <HSBCRecommendations />
            </motion.div>
          </section>
        </div>
      </main>

      {/* Alert System - Fixed position overlay */}
      <AlertSystem stockData={userStockData} />

      {/* Stock Details Panel */}
      <AnimatePresence>
        {selectedStock && (
          <StockDetails 
            symbol={selectedStock} 
            onClose={() => setSelectedStock(null)} 
          />
        )}
      </AnimatePresence>

      {/* Alert Details Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <AlertDetails 
            alert={selectedAlert} 
            onClose={() => setSelectedAlert(null)} 
          />
        )}
      </AnimatePresence>

      {/* Insider Trade Details Modal */}
      <AnimatePresence>
        {selectedTrade && (
          <InsiderTradeDetails 
            trade={selectedTrade} 
            onClose={() => setSelectedTrade(null)} 
          />
        )}
      </AnimatePresence>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className={`text-xl font-bold ${
                    selectedTransaction.credit_debit_indicator === 'Credit'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedTransaction.credit_debit_indicator === 'Credit' ? '+' : '-'}
                    {new Intl.NumberFormat('en-SG', {
                      style: 'currency',
                      currency: selectedTransaction.currency || 'SGD'
                    }).format(Math.abs(selectedTransaction.amount || 0))}
                  </p>
                </div>
                
                {selectedTransaction.merchant_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Merchant</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTransaction.merchant_name}
                    </p>
                  </div>
                )}
                
                {selectedTransaction.description && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTransaction.booking_datetime).toLocaleString('en-SG')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {selectedTransaction.status || 'Completed'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <AIChat alerts={alerts} />
      <UserPreferences 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />
      
      {/* Preferences Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPreferences(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </motion.button>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
    </div>
  );
};

export default Dashboard; 