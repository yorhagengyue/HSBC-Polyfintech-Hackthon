import React, { useState, useContext, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Sliders, Eye, Shield, Save } from 'lucide-react';

// User Preferences Context
export const UserPreferencesContext = createContext({
  threshold: 3,
  density: 'detailed',
  lowRiskMode: false,
  setThreshold: () => {},
  setDensity: () => {},
  setLowRiskMode: () => {},
});

export const UserPreferencesProvider = ({ children }) => {
  const [threshold, setThreshold] = useState(
    parseInt(localStorage.getItem('threshold') || '3')
  );
  const [density, setDensity] = useState(
    localStorage.getItem('density') || 'detailed'
  );
  const [lowRiskMode, setLowRiskMode] = useState(
    localStorage.getItem('lowRiskMode') === 'true'
  );

  const updateThreshold = (value) => {
    setThreshold(value);
    localStorage.setItem('threshold', value.toString());
  };

  const updateDensity = (value) => {
    setDensity(value);
    localStorage.setItem('density', value);
  };

  const updateLowRiskMode = (value) => {
    setLowRiskMode(value);
    localStorage.setItem('lowRiskMode', value.toString());
  };

  return (
    <UserPreferencesContext.Provider value={{
      threshold,
      density,
      lowRiskMode,
      setThreshold: updateThreshold,
      setDensity: updateDensity,
      setLowRiskMode: updateLowRiskMode,
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

const UserPreferences = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const {
    threshold,
    density,
    lowRiskMode,
    setThreshold,
    setDensity,
    setLowRiskMode,
  } = useContext(UserPreferencesContext);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      {/* Settings Button */}
      <motion.button
        className="fixed top-20 right-6 w-10 h-10 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-lg flex items-center justify-center z-40 transition-colors border border-gray-200 dark:border-gray-600"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
      >
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </motion.button>

      {/* Preferences Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto border-l border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Sliders className="w-5 h-5 mr-2 text-hsbc-red" />
                    User Preferences
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Alert Threshold */}
                <div className="mb-8">
                  <h3 className="text-gray-900 dark:text-white font-medium mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-yellow-400" />
                    Alert Threshold
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Notify me when price drops by:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-bold text-lg">{threshold}%</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {threshold <= 2 ? 'Sensitive' : threshold <= 5 ? 'Balanced' : 'Relaxed'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>1%</span>
                      <span>5%</span>
                      <span>10%</span>
                    </div>
                  </div>
                </div>

                {/* Information Density */}
                <div className="mb-8">
                  <h3 className="text-gray-900 dark:text-white font-medium mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-blue-400" />
                    Information Density
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Choose how much detail to display:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="radio"
                        name="density"
                        value="compact"
                        checked={density === 'compact'}
                        onChange={() => setDensity('compact')}
                        className="mr-3 text-hsbc-red"
                      />
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">Compact</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Essential info only</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="radio"
                        name="density"
                        value="detailed"
                        checked={density === 'detailed'}
                        onChange={() => setDensity('detailed')}
                        className="mr-3 text-hsbc-red"
                      />
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">Detailed</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Full metrics & charts</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Low Risk Mode */}
                <div className="mb-8">
                  <h3 className="text-gray-900 dark:text-white font-medium mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-green-400" />
                    Low Risk Mode
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Focus on stable investment products:
                  </p>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={lowRiskMode}
                        onChange={(e) => setLowRiskMode(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        lowRiskMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                          lowRiskMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </div>
                    <span className="ml-3 text-gray-900 dark:text-white">
                      {lowRiskMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                  {lowRiskMode && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-600 dark:text-gray-400 mt-2"
                    >
                      Only HSBC fixed deposits and stable funds will be recommended
                    </motion.p>
                  )}
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                    saved 
                      ? 'bg-green-500 text-white' 
                      : 'bg-hsbc-red hover:bg-red-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{saved ? 'Preferences Saved!' : 'Save Preferences'}</span>
                </motion.button>
              </div>

              <style jsx>{`
                .slider::-webkit-slider-thumb {
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  background: #ee0005;
                  cursor: pointer;
                  border-radius: 50%;
                }
                .slider::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  background: #ee0005;
                  cursor: pointer;
                  border-radius: 50%;
                  border: none;
                }
              `}</style>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserPreferences; 