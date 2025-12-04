import React, { createContext, useContext, useState, useCallback } from 'react';

interface UnreadCountContextType {
  refreshUnreadCount: () => void;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger: number;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export const UnreadCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <UnreadCountContext.Provider value={{ refreshUnreadCount, setRefreshTrigger, refreshTrigger }}>
      {children}
    </UnreadCountContext.Provider>
  );
};

export const useUnreadCount = () => {
  const context = useContext(UnreadCountContext);
  if (context === undefined) {
    throw new Error('useUnreadCount must be used within an UnreadCountProvider');
  }
  return context;
};