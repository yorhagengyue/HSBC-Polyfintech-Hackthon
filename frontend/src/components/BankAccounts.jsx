import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  DollarSign,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

import { bankingAPI } from '../services/api';
import { UserPreferencesContext } from './UserPreferences';
import SkeletonLoader from './SkeletonLoader';

const BankAccounts = ({ onAccountSelect, selectedAccountId }) => {
  const { density } = useContext(UserPreferencesContext);
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hsbcStatus, setHsbcStatus] = useState('unknown');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load accounts and balances
  const loadAccountsAndBalances = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
        toast.loading('Syncing with HSBC...', { id: 'banking-sync' });
      } else {
        setLoading(true);
      }
      setError(null);

      // Check HSBC API status first
      try {
        const healthResponse = await bankingAPI.checkHealth();
        setHsbcStatus(healthResponse.data.hsbc_api === 'connected' ? 'connected' : 'disconnected');
      } catch (e) {
        setHsbcStatus('error');
      }

      // Load accounts
      const accountsResponse = await bankingAPI.getAccounts(forceRefresh);
      const accountsData = accountsResponse.data;
      
      setAccounts(accountsData.accounts || []);
      setLastUpdated(accountsData.last_updated);

      // Load balances for each account
      const balancePromises = (accountsData.accounts || []).map(async (account) => {
        try {
          const balanceResponse = await bankingAPI.getAccountBalances(account.account_id, forceRefresh);
          return { 
            accountId: account.account_id, 
            balances: balanceResponse.data || [] 
          };
        } catch (error) {
          // Failed to load balances for this account
          return { accountId: account.account_id, balances: [] };
        }
      });

      const balanceResults = await Promise.all(balancePromises);
      const balanceMap = {};
      balanceResults.forEach(({ accountId, balances }) => {
        balanceMap[accountId] = balances;
      });
      
      setBalances(balanceMap);

      if (forceRefresh) {
        toast.success('Banking data synchronized', { id: 'banking-sync' });
      }

    } catch (error) {
      // Error loading banking data
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load banking data';
      setError(errorMessage);
      
      if (forceRefresh) {
        toast.error(`Sync failed: ${errorMessage}`, { id: 'banking-sync' });
      } else {
        toast.error(`Banking error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAccountsAndBalances();
  }, []);

  const handleRefresh = () => {
    loadAccountsAndBalances(true);
  };

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  const formatCurrency = (amount, currency = 'SGD') => {
    if (!balanceVisible) return '••••••';
    
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getAccountTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'current':
      case 'checking':
        return <Wallet className="w-5 h-5" />;
      case 'savings':
        return <DollarSign className="w-5 h-5" />;
      case 'credit':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  const getAccountTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'current':
      case 'checking':
        return 'from-blue-500 to-blue-600';
      case 'savings':
        return 'from-green-500 to-green-600';
      case 'credit':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (hsbcStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAvailableBalance = (accountId) => {
    const accountBalances = balances[accountId] || [];
    const availableBalance = accountBalances.find(b => b.balance_type === 'Available');
    return availableBalance ? availableBalance.amount : 0;
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Building2 className="w-6 h-6 mr-3 text-hsbc-red" />
            HSBC Accounts
          </h3>
          <SkeletonLoader className="w-8 h-8 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Banking Connection Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-hsbc-red text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-hsbc-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              HSBC Accounts
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              {getStatusIcon()}
              <span>
                {hsbcStatus === 'connected' ? 'Connected' : 
                 hsbcStatus === 'disconnected' ? 'Disconnected' : 
                 hsbcStatus === 'error' ? 'Connection Error' : 'Checking...'}
              </span>
              {lastUpdated && (
                <>
                  <span>•</span>
                  <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleBalanceVisibility}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={balanceVisible ? 'Hide balances' : 'Show balances'}
          >
            {balanceVisible ? (
              <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        <AnimatePresence>
          {accounts.map((account, index) => {
            const availableBalance = getAvailableBalance(account.account_id);
            const isSelected = selectedAccountId === account.account_id;
            
            return (
              <motion.div
                key={account.account_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`group cursor-pointer transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-hsbc-red' : ''
                }`}
                onClick={() => onAccountSelect?.(account)}
              >
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 hover:shadow-md border border-gray-200/50 dark:border-gray-600/50 group-hover:border-hsbc-red/30 transition-all duration-300">
                  {/* Account Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getAccountTypeColor(account.account_type)} rounded-lg flex items-center justify-center text-white shadow-sm`}>
                        {getAccountTypeIcon(account.account_type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {account.nickname || `${account.account_type} Account`}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {account.account_number ? `••••${account.account_number.slice(-4)}` : account.account_id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(availableBalance, account.currency)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Available Balance
                      </p>
                    </div>
                  </div>

                  {/* Additional Details (Detailed View) */}
                  {density === 'detailed' && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Type:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {account.account_type || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.status === 'Active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {account.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-600/50 mt-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        Last updated: {account.last_synced_at 
                          ? new Date(account.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Never'
                        }
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAccountSelect?.(account);
                      }}
                      className="text-hsbc-red hover:text-red-700 text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary Footer */}
      {accounts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Total: {formatCurrency(
                Object.values(balances).flat().reduce((sum, balance) => {
                  return balance.balance_type === 'Available' ? sum + (balance.amount || 0) : sum;
                }, 0)
              )}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BankAccounts; 