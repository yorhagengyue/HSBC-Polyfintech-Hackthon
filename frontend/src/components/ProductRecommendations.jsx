import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Percent, ArrowRight, Star } from 'lucide-react';

const ProductRecommendations = ({ riskScore }) => {
  // Determine recommended products based on risk score
  const getRecommendations = () => {
    if (riskScore < 30) {
      // Low risk - recommend conservative products
      return [
        {
          id: 1,
          title: 'HSBC Fixed Deposit',
          type: 'Fixed Deposit',
          icon: Shield,
          keyMetric: '3.2% p.a.',
          features: [
            'Guaranteed returns',
            'Capital protection',
            'Flexible tenure: 3-12 months',
            'Min deposit: $10,000'
          ],
          riskLevel: 'Low',
          color: 'green'
        },
        {
          id: 2,
          title: 'Singapore Savings Bond',
          type: 'Government Bond',
          icon: Shield,
          keyMetric: '3.0% p.a.',
          features: [
            'Government backed',
            'Step-up interest',
            'Redeem anytime',
            'Min investment: $500'
          ],
          riskLevel: 'Very Low',
          color: 'blue'
        }
      ];
    } else if (riskScore < 70) {
      // Medium risk - balanced products
      return [
        {
          id: 3,
          title: 'HSBC Balanced Fund',
          type: 'Mutual Fund',
          icon: TrendingUp,
          keyMetric: '8.5% avg return',
          features: [
            '60% equities, 40% bonds',
            'Professional management',
            'Monthly dividends',
            'Min investment: $1,000'
          ],
          riskLevel: 'Medium',
          color: 'yellow'
        },
        {
          id: 4,
          title: 'HSBC Asia Pacific Fund',
          type: 'Regional Fund',
          icon: TrendingUp,
          keyMetric: '12% avg return',
          features: [
            'Asia-focused growth',
            'Diversified portfolio',
            'Quarterly rebalancing',
            'Min investment: $5,000'
          ],
          riskLevel: 'Medium-High',
          color: 'orange'
        }
      ];
    } else {
      // High risk - growth products
      return [
        {
          id: 5,
          title: 'HSBC Technology Fund',
          type: 'Sector Fund',
          icon: Percent,
          keyMetric: '18% avg return',
          features: [
            'Tech sector focus',
            'High growth potential',
            'Active management',
            'Min investment: $10,000'
          ],
          riskLevel: 'High',
          color: 'red'
        },
        {
          id: 6,
          title: 'HSBC Emerging Markets',
          type: 'Growth Fund',
          icon: Percent,
          keyMetric: '22% avg return',
          features: [
            'Emerging market exposure',
            'High volatility',
            'Long-term growth',
            'Min investment: $15,000'
          ],
          riskLevel: 'Very High',
          color: 'purple'
        }
      ];
    }
  };

  const recommendations = getRecommendations();

  const getRiskColor = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recommended for You
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Based on your risk profile: {riskScore < 30 ? 'Conservative' : riskScore < 70 ? 'Balanced' : 'Aggressive'}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          {[1, 2, 3].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= (riskScore < 30 ? 1 : riskScore < 70 ? 2 : 3)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((product, index) => {
          const Icon = product.icon;
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-hsbc-red/10 rounded-lg">
                    <Icon className="w-6 h-6 text-hsbc-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.type}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(product.color)}`}>
                  {product.riskLevel}
                </span>
              </div>

              {/* Key Metric */}
              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.keyMetric}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Expected returns
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button className="w-full flex items-center justify-center space-x-2 py-2 bg-hsbc-red/10 hover:bg-hsbc-red/20 text-hsbc-red rounded-lg transition-colors group-hover:bg-hsbc-red group-hover:text-white">
                <span className="text-sm font-medium">Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Disclaimer:</strong> Investment products are subject to market risks. 
          Past performance is not indicative of future results. Please read all scheme 
          related documents carefully before investing.
        </p>
      </div>
    </div>
  );
};

export default ProductRecommendations; 