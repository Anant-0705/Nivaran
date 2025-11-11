import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import SetupGuideScreen from './src/screens/SetupGuideScreen';
import SplashScreen from './src/components/SplashScreen';
import { AuthService } from './src/services/authService';
import { isSupabaseConfigured, supabase } from './src/services/supabase';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    console.log('🚀 App starting up...');
    
    // Check if Supabase is configured
    const configured = isSupabaseConfigured();
    console.log('🔧 Supabase configured:', configured);
    setSupabaseConfigured(!!configured);

    if (configured) {
      // Check initial auth state
      checkAuthState();

      // Listen for auth state changes
      const { data: { subscription } } = AuthService.onAuthStateChange(async (user) => {
        console.log('🔄 Auth state changed in App:', user?.email);
        
        if (user) {
          // User is authenticated, check if profile exists
          try {
            const profile = await AuthService.getCurrentUser();
            console.log('🔄 Profile exists:', !!profile);
            setIsAuthenticated(!!profile);
          } catch (error) {
            console.log('🔄 Profile check failed but user exists, considering authenticated');
            setIsAuthenticated(true);
          }
        } else {
          console.log('🔄 No user, setting unauthenticated');
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
      });

      // Also check session periodically to catch OAuth callbacks
      const checkSessionPeriodically = setInterval(async () => {
        try {
          if (supabase && !isAuthenticated) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('🔄 Periodic check found session:', session.user.email);
              try {
                const user = await AuthService.getCurrentUser();
                if (user) {
                  console.log('🔄 Periodic check: profile exists, setting authenticated');
                  setIsAuthenticated(true);
                  setIsLoading(false);
                }
              } catch (error) {
                console.log('🔄 Periodic check: profile check failed but session exists');
                setIsAuthenticated(true);
                setIsLoading(false);
              }
            }
          }
        } catch (error) {
          console.log('🔄 Periodic auth check error:', error);
        }
      }, 1000); // Check every second

      return () => {
        console.log('🧹 Cleaning up auth listener');
        subscription?.unsubscribe();
        clearInterval(checkSessionPeriodically);
      };
    } else {
      console.log('⚠️ Supabase not configured, showing setup guide');
      setIsLoading(false);
    }
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking initial auth state...');
      
      // First, try to restore session from URL or storage
      const restoredUser = await AuthService.restoreSession();
      console.log('🔍 Session restoration result:', restoredUser);
      
      if (restoredUser) {
        setIsAuthenticated(true);
        console.log('🔍 Session restored, user authenticated');
        return;
      }
      
      // Fallback to regular session check
      if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Session check result:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email,
          error 
        });
        
        if (session?.user) {
          // We have a session, verify the user profile exists
          try {
            const user = await AuthService.getCurrentUser();
            console.log('🔍 Profile check result:', !!user);
            setIsAuthenticated(!!user);
          } catch (profileError) {
            console.log('🔍 Profile check failed, but session exists. User authenticated:', profileError);
            // Session exists but profile check failed - still consider authenticated
            setIsAuthenticated(true);
          }
        } else {
          console.log('🔍 No session found');
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSplash || isLoading) {
    return (
      <SplashScreen 
        onFinish={() => {
          setShowSplash(false);
          setHasCompletedOnboarding(true);
        }} 
      />
    );
  }

  if (!supabaseConfigured) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SetupGuideScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator 
        isAuthenticated={isAuthenticated} 
        hasCompletedOnboarding={hasCompletedOnboarding}
      />
    </SafeAreaProvider>
  );
}
