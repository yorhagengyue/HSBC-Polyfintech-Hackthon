import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import Navigation from '../components/Navigation';
import DashboardView from './DashboardView';
import PortfolioView from './PortfolioView';
import MarketView from './MarketView';
import AlertsView from './AlertsView';
import AnalysisView from './AnalysisView';
import BankingView from './BankingView';
import StockDetails from '../components/StockDetails';
import AlertModal from '../components/AlertModal';
import InsiderTradeDetails from '../components/InsiderTradeDetails';
import ThemeToggle from '../components/ThemeToggle';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import StockManager from '../components/StockManager';
import AlertSystem from '../components/AlertSystem';
import AIChat from '../components/AIChat';
import UserPreferences from '../components/UserPreferences';
import GlobalSearchBar from '../components/GlobalSearchBar';
import OnboardingGuide from '../components/OnboardingGuide';
import useEventStream from '../hooks/useEventStream';
import { stockAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const Dashboard = () => {
  const { toggleTheme, isDarkMode } = useTheme();
  const [activeView, setActiveView] = useState('dashboard');
  const [userStockData, setUserStockData] = useState([]);
  const [isLoadingUserStocks, setIsLoadingUserStocks] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [wsConnected, setWsConnected] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [lastAlert, setLastAlert] = useState(null);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [riskScore, setRiskScore] = useState(0);

  // Handle user stock list updates from StockManager
  const handleUserStockListUpdate = useCallback((stocks) => {
    setUserStockData(stocks);
  }, []);

  // Refresh user stock data
  const refreshUserStocks = useCallback(() => {
    // This will be triggered from UserStocksList component
    // The actual refresh is handled by StockManager
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
    setWsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
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
        setSelectedStock(null);
        setSelectedAlert(null);
        setSelectedTrade(null);
        setSelectedAccount(null);
        setSelectedTransaction(null);
        setShowShortcuts(false);
        setShowPreferences(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, showPreferences, isDarkMode, toggleTheme]);

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
    setSelectedAlert(alert);
  };

  const handleTradeClick = (trade) => {
    setSelectedTrade(trade);
  };

  const handleStartMonitoring = async (monitoringData) => {
    try {
      await stockAPI.startMonitoring(monitoringData);
      // Could show a success toast here
    } catch (error) {
      // Could show an error toast here
    }
  };

  // Banking handlers
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
  };

  const handleTransactionSelect = (transaction) => {
    setSelectedTransaction(transaction);
  };

  // Mock alert for testing
  useEffect(() => {
    const mockAlert = {
      id: 1,
      title: 'Stock Price Alert',
      message: 'AAPL has dropped 5% in the last hour',
      severity: 'high',
      timestamp: new Date().toISOString(),
    };
    setLastAlert(mockAlert);
    setHasNewAlert(true);
  }, []);

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
              {/* Global Search Bar */}
              <div className="hidden md:block flex-1 max-w-xl mx-4">
                <GlobalSearchBar 
                  onSearch={(result) => {
                    if (result.type === 'stock') {
                      setSelectedStock(result.symbol);
                    } else if (result.type === 'alert') {
                      // Find and select the alert
                      const alert = alerts.find(a => a.title === result.title);
                      if (alert) setSelectedAlert(alert);
                    }
                  }}
                />
              </div>

              {/* Connection Indicator */}
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
                  className={`text-xs transition-colors duration-300 hidden lg:inline ${
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

      {/* Navigation */}
      <Navigation activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main className="min-h-[calc(100vh-128px)]">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardView 
                userStockData={userStockData}
                alerts={alerts}
                riskScore={riskScore}
                onViewChange={setActiveView}
              />
            </motion.div>
          )}
          
          {activeView === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PortfolioView 
                userStockData={userStockData}
                onStockSelect={setSelectedStock}
                onRemoveStock={(symbol) => {
                  // Remove stock logic here
                }}
                onReorderStocks={(newOrder) => {
                  // Reorder logic here
                  setUserStockData(newOrder);
                }}
                onStockListUpdate={handleUserStockListUpdate}
              />
            </motion.div>
          )}
          
          {activeView === 'market' && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MarketView 
                onStockSelect={setSelectedStock}
                onTradeClick={handleTradeClick}
              />
            </motion.div>
          )}
          
          {activeView === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AlertsView 
                alerts={alerts}
                riskScore={riskScore}
                onRiskChange={setRiskScore}
                onClearAlerts={handleClearAlerts}
                onAlertClick={handleAlertClick}
                userStockData={userStockData}
              />
            </motion.div>
          )}
          
          {activeView === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalysisView 
                userStockData={userStockData}
                onStockSelect={setSelectedStock}
              />
            </motion.div>
          )}
          
          {activeView === 'banking' && (
            <motion.div
              key="banking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BankingView 
                onAccountSelect={handleAccountSelect}
                selectedAccount={selectedAccount}
                onTransactionSelect={handleTransactionSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Onboarding Guide for new users */}
      <OnboardingGuide />

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

      {/* Alert Modal - Enhanced */}
      <AnimatePresence>
        {selectedAlert && (
          <AlertModal 
            alert={selectedAlert} 
            onClose={() => setSelectedAlert(null)}
            riskScore={riskScore}
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

      {/* Preferences */}
      <UserPreferences 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />
      
      {/* Floating Action Buttons */}
      {/* PDF Report Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          // TODO: Generate PDF report
          // This would integrate with a PDF generation library
        }}
        className="fixed bottom-40 right-4 w-14 h-14 bg-hsbc-red hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="Download PDF Report"
      >
        <FileText className="w-6 h-6" />
      </motion.button>

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
      <AnimatePresence>
        {showShortcuts && (
          <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>

      {/* Global AI Chat Component - Always Available */}
      <AIChat 
        lastAlert={lastAlert}
        hasNewAlert={hasNewAlert}
        userStocks={userStockData}
      />
    </div>
  );
};

export default Dashboard; 