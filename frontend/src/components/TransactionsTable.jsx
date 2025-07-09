import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileX,
  TrendingUp,
  TrendingDown,
  Clock,
  Building2,
  CreditCard,
  ShoppingCart,
  Coffee,
  Car,
  Home,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

import { bankingAPI } from '../services/api';
import { UserPreferencesContext } from './UserPreferences';
import SkeletonLoader from './SkeletonLoader';

const TransactionsTable = ({ account, onTransactionSelect }) => {
  const { density } = useContext(UserPreferencesContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days
  const [typeFilter, setTypeFilter] = useState('all'); // all, credit, debit
  const [showFilters, setShowFilters] = useState(false);

  // Load transactions
  const loadTransactions = async (forceRefresh = false) => {
    if (!account) return;

    try {
      if (forceRefresh) {
        setRefreshing(true);
        toast.loading('Loading transactions...', { id: 'transactions-load' });
      } else {
        setLoading(true);
      }
      setError(null);

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(dateRange));

      const params = {
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        limit: 100,
        forceRefresh
      };

      const response = await bankingAPI.getAccountTransactions(account.account_id, params);
      const transactionsData = response.data.transactions || [];
      
      setTransactions(transactionsData);

      if (forceRefresh) {
        toast.success('Transactions updated', { id: 'transactions-load' });
      }

    } catch (error) {
      // Error loading transactions
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load transactions';
      setError(errorMessage);
      
      if (forceRefresh) {
        toast.error(`Failed to load: ${errorMessage}`, { id: 'transactions-load' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effect to load transactions when account or filters change
  useEffect(() => {
    if (account) {
      loadTransactions();
    }
  }, [account, dateRange]);

  const handleRefresh = () => {
    loadTransactions(true);
  };

  const formatCurrency = (amount, currency = 'SGD') => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Math.abs(amount) || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-SG', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (transaction) => {
    const description = (transaction.description || '').toLowerCase();
    const merchantName = (transaction.merchant_name || '').toLowerCase();
    const isCredit = transaction.credit_debit_indicator === 'Credit';
    
    if (description.includes('coffee') || merchantName.includes('starbucks') || merchantName.includes('coffee')) {
      return <Coffee className="w-4 h-4" />;
    } else if (description.includes('fuel') || description.includes('petrol') || merchantName.includes('shell') || merchantName.includes('esso')) {
      return <Car className="w-4 h-4" />;
    } else if (description.includes('groceries') || description.includes('supermarket') || merchantName.includes('ntuc') || merchantName.includes('fairprice')) {
      return <ShoppingCart className="w-4 h-4" />;
    } else if (description.includes('utility') || description.includes('electricity') || description.includes('water')) {
      return <Zap className="w-4 h-4" />;
    } else if (description.includes('rent') || description.includes('mortgage')) {
      return <Home className="w-4 h-4" />;
    } else if (isCredit) {
      return <ArrowDownLeft className="w-4 h-4" />;
    } else {
      return <ArrowUpRight className="w-4 h-4" />;
    }
  };

  const getTransactionCategory = (transaction) => {
    const description = (transaction.description || '').toLowerCase();
    const merchantName = (transaction.merchant_name || '').toLowerCase();
    const isCredit = transaction.credit_debit_indicator === 'Credit';
    
    if (description.includes('coffee') || merchantName.includes('coffee')) return 'Food & Dining';
    if (description.includes('fuel') || description.includes('petrol')) return 'Transportation';
    if (description.includes('groceries') || description.includes('supermarket')) return 'Groceries';
    if (description.includes('utility') || description.includes('electricity')) return 'Utilities';
    if (description.includes('rent') || description.includes('mortgage')) return 'Housing';
    if (isCredit) return 'Income';
    return 'Other';
  };

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.merchant_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const isCredit = transaction.credit_debit_indicator === 'Credit';
    const isDebit = transaction.credit_debit_indicator === 'Debit';
    
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'credit' && isCredit) ||
      (typeFilter === 'debit' && isDebit);

    return matchesSearch && matchesType;
  });

  if (!account) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select an Account
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a bank account to view its transaction history
          </p>
        </div>
      </div>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Transactions
          </h3>
          <SkeletonLoader className="w-24 h-8 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonLoader key={i} className="h-16 rounded-lg" />
          ))}
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
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <CreditCard className="w-6 h-6 mr-3 text-hsbc-red" />
            Recent Transactions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {account.nickname || `${account.account_type} Account`} • 
            Last {dateRange} days
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              showFilters ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            title="Filters"
          >
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-hsbc-red focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Date Range */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-hsbc-red focus:border-transparent"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>
                
                {/* Transaction Type */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-hsbc-red focus:border-transparent"
                  >
                    <option value="all">All transactions</option>
                    <option value="credit">Credits only</option>
                    <option value="debit">Debits only</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      <div className="space-y-3">
        {error && (
          <div className="text-center py-8">
            <FileX className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-hsbc-red text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {filteredTransactions.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <FileX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Transactions Found
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search or filters' : 'No transactions in the selected period'}
            </p>
          </div>
        )}

        <AnimatePresence>
          {filteredTransactions.map((transaction, index) => {
            const isCredit = transaction.credit_debit_indicator === 'Credit';
            const amount = transaction.amount || 0;
            const signedAmount = isCredit ? amount : -amount;
            
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer"
                onClick={() => onTransactionSelect?.(transaction)}
              >
                <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <div className="flex items-center justify-between">
                    {/* Transaction Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCredit 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {getTransactionIcon(transaction)}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {transaction.merchant_name || 
                             transaction.description || 
                             (isCredit ? 'Credit Transaction' : 'Debit Transaction')}
                          </h4>
                          
                          <div className="text-right ml-4">
                            <p className={`text-lg font-bold ${
                              isCredit 
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isCredit ? '+' : '-'}{formatCurrency(amount, transaction.currency)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Additional Details */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatDate(transaction.booking_datetime)}</span>
                            <span>•</span>
                            <span>{formatTime(transaction.booking_datetime)}</span>
                            {density === 'detailed' && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
                                  {getTransactionCategory(transaction)}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {density === 'detailed' && transaction.balance_after && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Balance: {formatCurrency(transaction.balance_after, transaction.currency)}
                            </span>
                          )}
                        </div>
                        
                        {/* Description (if different from merchant name) */}
                        {density === 'detailed' && transaction.description && 
                         transaction.description !== transaction.merchant_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Summary */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            
            {density === 'detailed' && (
              <div className="flex items-center space-x-4">
                {/* Income/Expense Summary */}
                <div className="flex items-center space-x-2">
                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +{formatCurrency(
                      filteredTransactions
                        .filter(t => t.credit_debit_indicator === 'Credit')
                        .reduce((sum, t) => sum + (t.amount || 0), 0)
                    )}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    -{formatCurrency(
                      filteredTransactions
                        .filter(t => t.credit_debit_indicator === 'Debit')
                        .reduce((sum, t) => sum + (t.amount || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionsTable; 