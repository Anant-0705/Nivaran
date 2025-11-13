import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthService } from '../services/authService';
import { supabase } from '../services/supabase';

const AuthCallbackScreen: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      console.log('🔐 Auth callback screen processing...');
      setStatus('processing');
      setMessage('Processing authentication...');

      // Wait a moment to ensure auth state propagates
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to restore the session from URL parameters
      const user = await AuthService.restoreSession();
      
      if (user) {
        console.log('✅ Auth callback successful for user:', user.email);
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        // Wait a moment then redirect to main app
        setTimeout(() => {
          // For web, we can redirect to the home page
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }, 2000);
      } else {
        // Check if we have a session even if restore failed
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('✅ Found session after callback:', session.user.email);
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }, 2000);
          } else {
            throw new Error('No user session found after authentication');
          }
        } else {
          throw new Error('Supabase not configured');
        }
      }
    } catch (error) {
      console.error('❌ Auth callback error:', error);
      setStatus('error');
      setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Redirect to login after showing error
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color="#006C48" style={styles.loader} />
            <Text style={styles.title}>Completing Sign In</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✅</Text>
            </View>
            <Text style={styles.title}>Sign In Successful!</Text>
            <Text style={styles.message}>Redirecting to your dashboard...</Text>
          </>
        )}
        
        {status === 'error' && (
          <>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>❌</Text>
            </View>
            <Text style={styles.title}>Sign In Failed</Text>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.subMessage}>Redirecting to login...</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  loader: {
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 64,
  },
  errorIcon: {
    marginBottom: 24,
  },
  errorIconText: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default AuthCallbackScreen;