import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  isConnected: boolean;
  isLoading: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isLoading: true,
});

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
    }).catch(() => {
      setIsConnected(false);
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isLoading }}>
      {children}
    </NetworkContext.Provider>
  );
};