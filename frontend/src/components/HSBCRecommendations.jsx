import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, Clock, Star, ExternalLink, Building2, Award, CreditCard, PiggyBank, BarChart3, Banknote, Landmark } from 'lucide-react';
import { UserPreferencesContext } from './UserPreferences';

const HSBCRecommendations = () => {
  const { lowRiskMode } = useContext(UserPreferencesContext);

  const recommendations = [
    {
      id: 1,
      title: "HSBC Fixed Deposit",
      description: "Capital guaranteed time deposit with competitive interest rates. Perfect for conservative investors seeking stable returns.",
      interestRate: "3.2%",
      term: "12 months",
      minimumAmount: "$10,000",
      riskLevel: "Very Low",
      features: ["Capital Guaranteed", "Fixed Returns", "SDIC Insured"],
      category: "deposit",
      gradient: "from-green-500 to-emerald-600",
      bgPattern: "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-green-800/20",
      url: "https://www.hsbc.com.sg/deposits/time-deposits/",
      badge: "Most Popular"
    },
    {
      id: 2,
      title: "HSBC Stable Income Fund",
      description: "Conservative bond fund designed for steady income generation with professional portfolio management.",
      expectedReturn: "4.1%",
      term: "Medium-term",
      minimumAmount: "$5,000",
      riskLevel: "Low",
      features: ["Monthly Dividends", "Professional Management", "Diversified Portfolio"],
      category: "fund",
      gradient: "from-blue-500 to-indigo-600",
      bgPattern: "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-blue-800/20",
      url: "https://www.hsbc.com.sg/investments/products/unit-trusts/",
      badge: "Recommended"
    },
    {
      id: 3,
      title: "HSBC Conservative Balanced Fund",
      description: "Carefully balanced portfolio mixing government bonds with blue-chip equities for moderate growth.",
      expectedReturn: "5.8%",
      term: "Long-term",
      minimumAmount: "$3,000",
      riskLevel: "Low-Medium",
      features: ["Balanced Allocation", "Capital Preservation Focus", "ESG Compliant"],
      category: "fund",
      gradient: "from-purple-500 to-violet-600",
      bgPattern: "bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-purple-900/20 dark:via-violet-900/10 dark:to-purple-800/20",
      url: "https://www.hsbc.com.sg/investments/products/unit-trusts/",
      badge: "ESG"
    },
    {
      id: 4,
      title: "HSBC Treasury Bills",
      description: "Short-term government securities offering liquidity and safety with competitive yields.",
      interestRate: "2.8%",
      term: "3-6 months",
      minimumAmount: "$50,000",
      riskLevel: "Minimal",
      features: ["Government Backed", "High Liquidity", "No Credit Risk"],
      category: "securities",
      gradient: "from-orange-500 to-amber-600",
      bgPattern: "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-orange-900/20 dark:via-amber-900/10 dark:to-orange-800/20",
      url: "https://www.hsbc.com.sg/investments/products/bonds-and-structured-products/",
      badge: "Government"
    }
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'deposit':
        return <PiggyBank className="w-6 h-6" />;
      case 'fund':
        return <BarChart3 className="w-6 h-6" />;
      case 'securities':
        return <Landmark className="w-6 h-6" />;
      default:
        return <Banknote className="w-6 h-6" />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Minimal':
      case 'Very Low':
        return 'text-green-700 bg-green-100 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700';
      case 'Low':
        return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
      case 'Low-Medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-gray-900/30 dark:border-gray-700';
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Most Popular':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'Recommended':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'ESG':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'Government':
        return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (!lowRiskMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-fluid border border-gray-200/50 dark:border-gray-700/50 shadow-lg card-adaptive overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-hsbc-red/5 via-red-500/3 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/5 via-indigo-500/3 to-transparent blur-2xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-fluid-lg">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-hsbc-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div>
              <h3 className="text-xl-fluid font-bold text-gray-900 dark:text-white flex items-center">
                HSBC Recommended Products
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full shadow-sm">
                  Low Risk
                </span>
              </h3>
              <p className="text-small text-gray-500 dark:text-gray-400 mt-1">
                Conservative investment options tailored for stability
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-small text-gray-500 dark:text-gray-400">
              <Award className="w-4 h-4 text-hsbc-red" />
              <span>Premium Products</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-fluid-lg">
          {recommendations.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              {/* Product Card */}
              <motion.div
                className={`relative ${product.bgPattern} rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/30 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden`}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open(product.url, '_blank')}
              >
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getBadgeColor(product.badge)}`}>
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 pr-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${product.gradient} rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {getCategoryIcon(product.category)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-hsbc-red transition-colors duration-300">
                          {product.title}
                        </h4>
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getRiskColor(product.riskLevel)} mt-1`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {product.riskLevel} Risk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rate Display - Separate row */}
                  <div className="flex items-center justify-end mb-4">
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {product.interestRate || product.expectedReturn}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.interestRate ? 'Fixed Rate' : 'Expected Return'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-small text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Term</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {product.term}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <CreditCard className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Min. Amount</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {product.minimumAmount}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Star className="w-3 h-3 mr-1 text-yellow-500" />
                      Key Features
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((feature, featureIndex) => (
                        <motion.span
                          key={featureIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                          className="px-3 py-1 bg-white/60 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
                        >
                          {feature}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(product.url, '_blank');
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-hsbc-red to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <span>Learn More & Apply</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-fluid-lg pt-6 border-t border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-small font-medium text-gray-700 dark:text-gray-300">
                  All products are SDIC insured and regulated by MAS
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Investment advice available • Minimum age requirements apply
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://www.hsbc.com.sg/investments/', '_blank')}
              className="flex items-center space-x-2 text-hsbc-red hover:text-red-700 font-medium text-small transition-colors duration-300 group"
            >
              <span>View All Products</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HSBCRecommendations; 