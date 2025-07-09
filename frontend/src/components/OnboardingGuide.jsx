import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Check, 
  TrendingUp, Bot, Bell, Newspaper, Shield,
  DollarSign, BarChart3, Target, Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const OnboardingGuide = ({ onComplete }) => {
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    // Check if user has seen the guide
    const seen = localStorage.getItem('onboarding_completed');
    if (seen) {
      setHasSeenGuide(true);
      setIsVisible(false);
    }
  }, []);

  const steps = [
    {
      title: "Welcome to Financial Alarm Clock!",
      description: "Your AI-powered financial companion for smarter investing decisions.",
      icon: TrendingUp,
      color: "blue",
      features: [
        "Real-time market monitoring",
        "AI-powered insights",
        "Smart alerts system",
        "HSBC integration"
      ]
    },
    {
      title: "AI Financial Advisor",
      description: "Get instant analysis and recommendations powered by Google Gemini.",
      icon: Bot,
      color: "purple",
      features: [
        "Ask any financial question",
        "Portfolio analysis",
        "Market predictions",
        "Risk assessment"
      ],
      action: "Try asking: 'What are the top 3 tech stocks to buy today?'"
    },
    {
      title: "Smart Alert System",
      description: "Never miss important market movements with intelligent alerts.",
      icon: Bell,
      color: "red",
      features: [
        "Price alerts",
        "Volume spikes",
        "News-based alerts",
        "Custom thresholds"
      ]
    },
    {
      title: "News Intelligence",
      description: "Stay informed with AI-analyzed financial news.",
      icon: Newspaper,
      color: "green",
      features: [
        "Sentiment analysis",
        "Sector filtering",
        "Batch AI analysis",
        "Real-time updates"
      ],
      action: "Select multiple news items and click 'AI Analyze' for insights!"
    },
    {
      title: "Portfolio Protection",
      description: "Safeguard your investments with HSBC's financial products.",
      icon: Shield,
      color: "orange",
      features: [
        "Risk monitoring",
        "Diversification tips",
        "Insurance products",
        "Wealth management"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  if (!isVisible || hasSeenGuide) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-2xl overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Close Button */}
          <button
            onClick={skipOnboarding}
            className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8 pt-12">
            {/* Step Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep 
                        ? 'w-8 bg-blue-500' 
                        : index < currentStep 
                          ? 'bg-green-500' 
                          : isDarkMode 
                            ? 'bg-gray-600' 
                            : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Icon and Title */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className={`inline-flex p-4 rounded-2xl mb-4 ${
                currentStepData.color === 'blue' ? 'bg-blue-500/10' :
                currentStepData.color === 'purple' ? 'bg-purple-500/10' :
                currentStepData.color === 'red' ? 'bg-red-500/10' :
                currentStepData.color === 'green' ? 'bg-green-500/10' :
                'bg-orange-500/10'
              }`}>
                <Icon className={`w-12 h-12 ${
                  currentStepData.color === 'blue' ? 'text-blue-500' :
                  currentStepData.color === 'purple' ? 'text-purple-500' :
                  currentStepData.color === 'red' ? 'text-red-500' :
                  currentStepData.color === 'green' ? 'text-green-500' :
                  'text-orange-500'
                }`} />
              </div>
              
              <h2 className={`text-2xl font-bold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {currentStepData.title}
              </h2>
              
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {currentStepData.description}
              </p>
            </motion.div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {currentStepData.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
                >
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Action Tip */}
            {currentStepData.action && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-lg mb-6 ${
                  isDarkMode 
                    ? 'bg-blue-500/10 border-blue-500/20' 
                    : 'bg-blue-50 border-blue-200'
                } border`}
              >
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-700'
                    }`}>
                      Pro Tip:
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {currentStepData.action}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentStep === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={skipOnboarding}
                className={`text-sm ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Skip Guide
              </button>

              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                  currentStep === steps.length - 1 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingGuide; 