import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Simple request throttling for stock APIs
const requestQueue = new Map();
const REQUEST_DELAY = 1000; // 1 second between similar requests

const throttleRequest = async (key, requestFn) => {
  // Check if we have a pending request for this key
  if (requestQueue.has(key)) {
    console.log(`Request for ${key} already pending, returning cached promise`);
    return requestQueue.get(key);
  }
  
  // Create the request promise
  const requestPromise = requestFn().finally(() => {
    // Clean up after delay
    setTimeout(() => {
      requestQueue.delete(key);
    }, REQUEST_DELAY);
  });
  
  // Store the promise
  requestQueue.set(key, requestPromise);
  
  return requestPromise;
};

// Stock APIs
export const stockAPI = {
  getStockInfo: (symbol) => api.get(`/stocks/stock/${symbol}`),
  getRealtimePrice: (symbol) => api.get(`/stocks/stock/${symbol}/price`),
  getStockHistory: (symbol, period = '1mo', interval = '1d') => 
    api.get(`/stocks/stock/${symbol}/history?period=${period}&interval=${interval}`),
  
  // Throttled getIndexPrices
  getIndexPrices: () => {
    return throttleRequest('index-prices', () => 
      api.get('/stocks/index-prices')
    );
  },
  
  // New search and user stock APIs
  searchStocks: (query) => api.get(`/stocks/search?query=${encodeURIComponent(query)}`),
  getUserStocks: (symbols) => {
    const key = `user-stocks-${symbols}`;
    return throttleRequest(key, () => 
      api.get(`/stocks/user-stocks?symbols=${encodeURIComponent(symbols)}`)
    );
  },
  
  // Monitoring
  startMonitoring: (data) => api.post('/stocks/monitoring/start', data),
  stopMonitoring: (symbol) => api.delete(`/stocks/monitoring/stop/${symbol}`),
  getMonitoringStatus: () => api.get('/stocks/monitoring/status'),
  getCachedPrice: (symbol) => api.get(`/stocks/monitoring/cache/${symbol}`),
  
  // News APIs
  getMarketNews: (category = 'business') => api.get(`/news/market?category=${category}`),
  searchNews: (query) => api.get(`/news/search?query=${encodeURIComponent(query)}`),
  getSymbolNews: (symbol) => api.get(`/news/symbol/${symbol}`),
  addNewsMonitoring: (symbol, keywords) => api.post(`/news/monitor/${symbol}`, { keywords }),
  removeNewsMonitoring: (symbol) => api.delete(`/news/monitor/${symbol}`),
  getMonitoredSymbols: () => api.get('/news/monitor/symbols'),
  getNewsAlerts: () => api.get('/news/alerts'),
};

// Banking APIs - New HSBC Integration
export const bankingAPI = {
  // Health and status
  checkHealth: () => api.get('/banking/health'),
  
  // Accounts
  getAccounts: (forceRefresh = false) => 
    api.get(`/banking/accounts?force_refresh=${forceRefresh}`),
  
  // Balances
  getAccountBalances: (accountId, forceRefresh = false) => 
    api.get(`/banking/accounts/${accountId}/balances?force_refresh=${forceRefresh}`),
  
  // Transactions
  getAccountTransactions: (accountId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('from_date', params.fromDate);
    if (params.toDate) queryParams.append('to_date', params.toDate);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.forceRefresh) queryParams.append('force_refresh', params.forceRefresh);
    
    const queryString = queryParams.toString();
    return api.get(`/banking/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`);
  },
  
  // Sync all banking data
  syncAllData: () => api.post('/banking/sync'),
  
  // Analytics helpers (to be implemented later)
  getBankingSummary: () => api.get('/banking/summary'),
  getSpendingAnalysis: (period = 'last_30_days') => 
    api.get(`/banking/analysis/spending?period=${period}`),
  searchTransactions: (query, filters = {}) => 
    api.post('/banking/transactions/search', { query, ...filters }),
};

// Advanced APIs
export const advancedAPI = {
  getInsiderTrades: (symbol = null) => 
    api.get(`/advanced/insider-trades${symbol ? `?symbol=${symbol}` : ''}`),
  getTrendingStocks: () => api.get('/advanced/trending'),
  getOptionsChain: (symbol) => api.get(`/advanced/options/${symbol}`),
  getMarketSummary: () => api.get('/advanced/market-summary'),
  getStatistics: (symbol) => api.get(`/advanced/statistics/${symbol}`),
  getEnhancedQuote: (symbol) => api.get(`/advanced/quote/${symbol}`),
  getRiskAnalysis: (symbol) => api.get(`/advanced/risk-analysis/${symbol}`),
};

// AI Chat APIs
export const aiAPI = {
  // Chat with AI
  chat: (data) => api.post('/ai/chat', data),
  
  // Document analysis
  analyzeDocuments: (documents, question) => 
    api.post('/ai/analyze-documents', { documents, question }),
  
  // Upload document
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ai/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Financial analysis
  financialAnalysis: (symbol, analysisType = 'technical', timeframe = '1d') =>
    api.post(`/ai/financial-analysis?symbol=${symbol}&analysis_type=${analysisType}&timeframe=${timeframe}`),
  
  // Provider info
  getProviderInfo: () => api.get('/ai/provider-info'),
  
  // Switch provider
  switchProvider: (provider) => api.post('/ai/switch-provider', { provider }),
  
  // Health check
  checkHealth: () => api.get('/ai/health'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
  checkBanking: () => bankingAPI.checkHealth(),
  checkAI: () => aiAPI.checkHealth(),
};

export default api; 