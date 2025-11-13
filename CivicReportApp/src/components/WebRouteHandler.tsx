import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AuthCallbackScreen from '../screens/AuthCallbackScreen';

interface WebRouteHandlerProps {
  children: React.ReactNode;
}

const WebRouteHandler: React.FC<WebRouteHandlerProps> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<string>('');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleRouteChange = () => {
        const path = window.location.pathname;
        setCurrentRoute(path);
      };

      // Set initial route
      handleRouteChange();

      // Listen for route changes (for SPAs)
      window.addEventListener('popstate', handleRouteChange);

      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, []);

  // Handle web-specific routes
  if (Platform.OS === 'web' && currentRoute === '/auth/callback') {
    return <AuthCallbackScreen />;
  }

  // Default: render the normal app
  return <>{children}</>;
};

export default WebRouteHandler;