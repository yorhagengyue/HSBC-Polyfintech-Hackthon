import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage for saved preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      const theme = saved === 'dark';
      // Apply theme immediately during initialization
      document.documentElement.className = '';
      document.documentElement.classList.add(theme ? 'dark' : 'light');
      document.body.className = theme ? 'dark' : 'light';
      return theme;
    }
    // Default to dark mode
    document.documentElement.className = '';
    document.documentElement.classList.add('dark');
    document.body.className = 'dark';
    return true;
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Add transition class for smooth theme switching
    document.documentElement.classList.add('theme-transition');
    
    // Update document classes with smooth transition
    document.documentElement.className = 'theme-transition'; // Clear all classes but keep transition
    document.documentElement.classList.add(isDarkMode ? 'dark' : 'light');
    
    // Also update body class for immediate visual feedback
    document.body.className = isDarkMode ? 'dark' : 'light';
    
    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);

    return () => clearTimeout(timer);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 