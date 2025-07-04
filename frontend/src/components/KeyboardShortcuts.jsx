import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Search, Plus, Palette, BarChart3 } from 'lucide-react';

const KeyboardShortcuts = ({ isOpen, onClose }) => {
  const shortcuts = [
    {
      category: 'Navigation',
      icon: <BarChart3 className="w-5 h-5" />,
      items: [
        { key: 'Ctrl + /', description: 'Show this help panel' },
        { key: 'Escape', description: 'Close any modal or panel' }
      ]
    },
    {
      category: 'Search & Add',
      icon: <Search className="w-5 h-5" />,
      items: [
        { key: 'Shift + S', description: 'Focus stock search input' },
        { key: 'Shift + W', description: 'Add stock to watchlist' },
        { key: 'Ctrl + K', description: 'Quick command search' }
      ]
    },
    {
      category: 'Interface',
      icon: <Palette className="w-5 h-5" />,
      items: [
        { key: 'Shift + ↑', description: 'Switch to light theme' },
        { key: 'Shift + ↓', description: 'Switch to dark theme' },
        { key: 'Ctrl + M', description: 'Toggle theme' }
      ]
    },
    {
      category: 'Actions',
      icon: <Plus className="w-5 h-5" />,
      items: [
        { key: 'Ctrl + E', description: 'Toggle edit mode' },
        { key: 'Ctrl + R', description: 'Refresh market data' },
        { key: 'Ctrl + C', description: 'Open AI chat' }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Keyboard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Speed up your workflow with these shortcuts</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortcuts.map((category, categoryIndex) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          {category.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {category.category}
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        {category.items.map((shortcut, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {shortcut.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {shortcut.key.split(' + ').map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  {keyIndex > 0 && (
                                    <span className="text-gray-400 text-xs">+</span>
                                  )}
                                  <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300 shadow-sm">
                                    {key}
                                  </kbd>
                                </React.Fragment>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-200 dark:border-blue-800"
                >
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tips</h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Hold <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">Ctrl</kbd> while clicking to open links in new tabs</li>
                    <li>• Use <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">Tab</kbd> to navigate between form fields</li>
                    <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">Ctrl + /</kbd> anytime to see this help</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcuts; 