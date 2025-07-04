import React from 'react';
import { motion } from 'framer-motion';
import BankAccounts from '../components/BankAccounts';
import TransactionsTable from '../components/TransactionsTable';
import HSBCRecommendations from '../components/HSBCRecommendations';

const BankingView = ({ 
  onAccountSelect,
  selectedAccount,
  onTransactionSelect 
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Bank Accounts Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <BankAccounts 
            onAccountSelect={onAccountSelect}
            selectedAccountId={selectedAccount?.account_id}
          />
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TransactionsTable 
            account={selectedAccount}
            onTransactionSelect={onTransactionSelect}
          />
        </motion.div>

        {/* HSBC Recommendations */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <HSBCRecommendations />
        </motion.div>
      </div>
    </div>
  );
};

export default BankingView; 