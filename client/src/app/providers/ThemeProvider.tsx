// src/app/providers/ThemeProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { theme, ThemeType } from '../../theme';

const ThemeContext = createContext<ThemeType>(theme);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
export default ThemeProvider;
